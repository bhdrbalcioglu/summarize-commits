// backend/src/services/openAIService.ts
import OpenAI from "openai";
import { z } from "zod";
import { encoding_for_model } from "tiktoken";
import { environment } from "../config/index.js";
import {
  AISummarizationService,
  BackendAnalysisRequest,
  BackendAnalysisResponse,
  BackendUpdateNotesRequest,
  BackendUpdateNotesResponse,
  SingleCommitAnalysis,
} from "../types/ai.types.js";
import { BackendCommitBundleItem } from "../types/git.types.js";
import {
  BASE_ANALYSIS_PROMPT,
  BASE_UPDATE_NOTES_PROMPT,
} from "../prompts/aiPrompts.js";

// --- Constants & Configuration ---
const MODEL_NAME = "gpt-4o-mini"; // Pinned model version
const MAX_TOKENS_PER_REQUEST = 16000;
const SAFETY_MARGIN = 1000;
const MAX_INPUT_TOKENS = MAX_TOKENS_PER_REQUEST - SAFETY_MARGIN;
const MAX_OUTPUT_TOKENS = 4000;

// AI Configuration
const AI_CONFIG = {
  temperature: 0.1, // Low temperature for consistent, factual analysis
  top_p: 0.9,
  max_tokens: MAX_OUTPUT_TOKENS,
} as const;

// --- Rate Limiting Configuration ---
interface RateLimitConfig {
  maxTPM: number;        // Tokens per minute
  maxRPM: number;        // Requests per minute
  safetyMargin: number;  // Percentage (0.9 = 90%)
  tier: string;          // Detected tier
}

interface RateLimitState {
  currentTPM: number;
  currentRPM: number;
  remainingTPM: number;
  remainingRPM: number;
  resetTimeTPM: number;  // Seconds until reset
  resetTimeRPM: number;  // Seconds until reset
  lastUpdated: number;   // Timestamp
}

// Default rate limits (Tier 1) - will be auto-detected
const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxTPM: 200000,      // 200K TPM for Tier 1
  maxRPM: 2000,        // 2K RPM for Tier 1  
  safetyMargin: 0.9,   // Use 90% of limits
  tier: "Tier 1"
};

// --- Zod Schemas for Structured Output ---
const singleCommitAnalysisSchema = z.object({
  commitMessage: z.string(),
  commitID: z.string(),
  authorName: z.string(),
  description: z.string(),
  category: z
    .enum([
      "Bug Fix",
      "Improvement",
      "New Feature",
      "Refactoring",
      "Documentation Update",
      "Other (Specify)",
    ])
    .or(z.string()), // Allow custom strings for "Other"
  affectedAreas: z.array(z.string()),
  languageOrFramework: z.string(),
});

const batchAnalysisSchema = z.object({
  analyses: z.array(singleCommitAnalysisSchema),
});

const releaseNotesSchema = z.object({
  updateNotes: z.string(),
});

// --- JSON Schemas for OpenAI Structured Outputs ---
const analysisJsonSchema = {
  type: "object",
  properties: {
    analyses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          commitMessage: { type: "string" },
          commitID: { type: "string" },
          authorName: { type: "string" },
          description: { type: "string" },
          category: { 
            type: "string",
            enum: [
              "Bug Fix",
              "Improvement", 
              "New Feature",
              "Refactoring",
              "Documentation Update",
              "Other (Specify)"
            ]
          },
          affectedAreas: {
            type: "array",
            items: { type: "string" }
          },
          languageOrFramework: { type: "string" }
        },
        required: [
          "commitMessage", "commitID", "authorName", 
          "description", "category", "affectedAreas", "languageOrFramework"
        ],
        additionalProperties: false
      }
    }
  },
  required: ["analyses"],
  additionalProperties: false
} as const;

const releaseNotesJsonSchema = {
  type: "object",
  properties: {
    updateNotes: {
      type: "string",
      description: "Markdown-formatted release notes as a single string"
    }
  },
  required: ["updateNotes"],
  additionalProperties: false
} as const;

// --- Token Counting ---
let tokenEncoder: any = null;

function getTokenEncoder() {
  if (!tokenEncoder) {
    tokenEncoder = encoding_for_model("gpt-4o-mini");
  }
  return tokenEncoder;
}

function countTokens(text: string): number {
  try {
    const encoder = getTokenEncoder();
    return encoder.encode(text).length;
  } catch (error) {
    console.warn(
      "Failed to count tokens precisely, falling back to estimation:",
      error
    );
    // Fallback to rough estimation
    return Math.ceil(text.length / 4);
  }
}

// --- Rate Limiting Utilities ---
class RateLimitManager {
  private config: RateLimitConfig;
  private state: RateLimitState;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor() {
    this.config = { ...DEFAULT_RATE_LIMITS };
    this.state = {
      currentTPM: 0,
      currentRPM: 0,
      remainingTPM: this.config.maxTPM,
      remainingRPM: this.config.maxRPM,
      resetTimeTPM: 60,
      resetTimeRPM: 60,
      lastUpdated: Date.now()
    };
  }

  // Parse rate limit headers from OpenAI response
  updateFromHeaders(headers: any): void {
    try {
      const remainingRequests = parseInt(headers['x-ratelimit-remaining-requests'] || '0');
      const remainingTokens = parseInt(headers['x-ratelimit-remaining-tokens'] || '0');
      const limitRequests = parseInt(headers['x-ratelimit-limit-requests'] || '0');
      const limitTokens = parseInt(headers['x-ratelimit-limit-tokens'] || '0');
      const resetRequests = headers['x-ratelimit-reset-requests'] || '60s';
      const resetTokens = headers['x-ratelimit-reset-tokens'] || '60s';

      // Auto-detect tier based on limits
      if (limitTokens >= 2000000) {
        this.config.tier = "Tier 5";
        this.config.maxTPM = limitTokens;
        this.config.maxRPM = limitRequests;
      } else if (limitTokens >= 200000) {
        this.config.tier = "Tier 1+";
        this.config.maxTPM = limitTokens;
        this.config.maxRPM = limitRequests;
      }

      this.state.remainingTPM = remainingTokens;
      this.state.remainingRPM = remainingRequests;
      this.state.resetTimeTPM = this.parseResetTime(resetTokens);
      this.state.resetTimeRPM = this.parseResetTime(resetRequests);
      this.state.lastUpdated = Date.now();

      console.log(`🎯 [RateLimit] Updated: ${this.config.tier} - TPM: ${remainingTokens}/${limitTokens}, RPM: ${remainingRequests}/${limitRequests}`);
    } catch (error) {
      console.warn('⚠️ [RateLimit] Failed to parse headers:', error);
    }
  }

  private parseResetTime(resetStr: string): number {
    // Parse strings like "1m30s", "45s", "2m" into seconds
    const match = resetStr.match(/(?:(\d+)m)?(?:(\d+)s)?/);
    if (match) {
      const minutes = parseInt(match[1] || '0');
      const seconds = parseInt(match[2] || '0');
      return minutes * 60 + seconds;
    }
    return 60; // Default fallback
  }

  // Check if we can make a request with given token count
  canMakeRequest(estimatedTokens: number): boolean {
    const safeTPM = this.config.maxTPM * this.config.safetyMargin;
    const safeRPM = this.config.maxRPM * this.config.safetyMargin;
    
    return this.state.remainingTPM >= estimatedTokens && 
           this.state.remainingRPM >= 1 &&
           this.state.currentTPM < safeTPM &&
           this.state.currentRPM < safeRPM;
  }

  // Calculate optimal concurrency level
  getOptimalConcurrency(avgTokensPerRequest: number): number {
    const safeTPM = this.config.maxTPM * this.config.safetyMargin;
    const safeRPM = this.config.maxRPM * this.config.safetyMargin;
    
    const maxByTokens = Math.floor(safeTPM / avgTokensPerRequest / 60); // Per second
    const maxByRequests = Math.floor(safeRPM / 60); // Per second
    
    const optimal = Math.min(maxByTokens, maxByRequests, 10); // Cap at 10 concurrent
    return Math.max(1, optimal);
  }

  // Calculate delay needed before next request
  getDelayMs(estimatedTokens: number): number {
    if (this.canMakeRequest(estimatedTokens)) {
      return 0;
    }

    // Calculate delay based on reset times and current usage
    const tokenDelay = this.state.resetTimeTPM * 1000;
    const requestDelay = this.state.resetTimeRPM * 1000;
    
    return Math.min(tokenDelay, requestDelay, 60000); // Max 1 minute delay
  }

  // Track request start
  trackRequestStart(estimatedTokens: number): void {
    this.state.currentTPM += estimatedTokens;
    this.state.currentRPM += 1;
    this.state.remainingTPM = Math.max(0, this.state.remainingTPM - estimatedTokens);
    this.state.remainingRPM = Math.max(0, this.state.remainingRPM - 1);
  }

  // Get current status for logging
  getStatus(): string {
    return `${this.config.tier} | TPM: ${this.state.remainingTPM}/${this.config.maxTPM} | RPM: ${this.state.remainingRPM}/${this.config.maxRPM}`;
  }
}

// --- Batch Processing ---
function createCommitBatchesForAnalysis(
  commitBundle: BackendCommitBundleItem[]
): BackendCommitBundleItem[][] {
  const batches: BackendCommitBundleItem[][] = [];
  let currentBatch: BackendCommitBundleItem[] = [];
  let currentBatchTokenSize = 0;

  for (const commit of commitBundle) {
    const commitSize = countTokens(JSON.stringify(commit));

    if (
      currentBatchTokenSize + commitSize > MAX_INPUT_TOKENS &&
      currentBatch.length > 0
    ) {
      batches.push(currentBatch);
      currentBatch = [commit];
      currentBatchTokenSize = commitSize;
    } else if (commitSize > MAX_INPUT_TOKENS) {
      // Single commit too large
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
        currentBatchTokenSize = 0;
      }
      console.warn(
        `Warning: Single commit ${commit.commit_id} estimated at ${commitSize} tokens exceeds MAX_INPUT_TOKENS ${MAX_INPUT_TOKENS}. It will be processed alone but may fail.`
      );
      batches.push([commit]);
    } else {
      currentBatch.push(commit);
      currentBatchTokenSize += commitSize;
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

// --- Concurrent Processing Queue ---
class ConcurrentProcessor {
  private rateLimitManager: RateLimitManager;
  private activeRequests = 0;
  private maxConcurrency = 1;

  constructor(rateLimitManager: RateLimitManager) {
    this.rateLimitManager = rateLimitManager;
  }

  async processBatchesConcurrently<T>(
    batches: any[],
    processor: (batch: any, index: number) => Promise<T>,
    avgTokensPerBatch: number
  ): Promise<T[]> {
    console.log(`🚀 [ConcurrentProcessor] Starting concurrent processing of ${batches.length} batches`);
    
    // Calculate optimal concurrency
    this.maxConcurrency = this.rateLimitManager.getOptimalConcurrency(avgTokensPerBatch);
    console.log(`⚡ [ConcurrentProcessor] Optimal concurrency: ${this.maxConcurrency} (${this.rateLimitManager.getStatus()})`);

    const results: T[] = new Array(batches.length);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < batches.length; i++) {
      const promise = this.processWithRateLimit(batches[i], i, processor, avgTokensPerBatch)
        .then(result => {
          results[i] = result;
        });
      promises.push(promise);

      // Control concurrency
      if (this.activeRequests >= this.maxConcurrency) {
        await Promise.race(promises.filter(p => p !== undefined));
      }
    }

    // Wait for all remaining requests
    await Promise.all(promises);
    
    console.log(`✅ [ConcurrentProcessor] All ${batches.length} batches completed`);
    return results;
  }

  private async processWithRateLimit<T>(
    batch: any,
    index: number,
    processor: (batch: any, index: number) => Promise<T>,
    estimatedTokens: number
  ): Promise<T> {
    // Wait for rate limit availability
    while (!this.rateLimitManager.canMakeRequest(estimatedTokens)) {
      const delay = this.rateLimitManager.getDelayMs(estimatedTokens);
      console.log(`⏳ [ConcurrentProcessor] Batch ${index + 1} waiting ${delay}ms for rate limit`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.activeRequests++;
    this.rateLimitManager.trackRequestStart(estimatedTokens);
    
    try {
      console.log(`🔄 [ConcurrentProcessor] Processing batch ${index + 1} (${this.activeRequests}/${this.maxConcurrency} active)`);
      const result = await processor(batch, index);
      console.log(`✅ [ConcurrentProcessor] Batch ${index + 1} completed`);
      return result;
    } finally {
      this.activeRequests--;
    }
  }
}

// --- Modern OpenAI Service ---
class OpenAIService implements AISummarizationService {
  private client: OpenAI;
  private rateLimitManager: RateLimitManager;
  private concurrentProcessor: ConcurrentProcessor;

  constructor() {
    if (!environment.OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API Key is not configured. AI features will not work."
      );
    }

    this.client = new OpenAI({
      apiKey: environment.OPENAI_API_KEY,
    });

    this.rateLimitManager = new RateLimitManager();
    this.concurrentProcessor = new ConcurrentProcessor(this.rateLimitManager);
  }

  private async analyzeSingleBatch(
    batch: BackendCommitBundleItem[],
    targetLanguage: string,
    retries = 3
  ): Promise<SingleCommitAnalysis[]> {
    const userContent = `Target language: ${targetLanguage}
Commits to analyze:
${JSON.stringify(batch, null, 2)}`;

    console.log(`🔄 [OpenAI Service] Analyzing batch with ${batch.length} commits (${retries} retries left)`);
    console.log(`🔢 [OpenAI Service] Estimated tokens: ${countTokens(userContent)}`);

    try {
      const { data: completion, response } = await this.client.chat.completions.create({
        model: MODEL_NAME,
        temperature: AI_CONFIG.temperature,
        top_p: AI_CONFIG.top_p,
        max_tokens: AI_CONFIG.max_tokens,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "commit_analysis",
            schema: analysisJsonSchema,
            strict: true
          }
        },
        messages: [
          {
            role: "system",
            content: BASE_ANALYSIS_PROMPT
          },
          {
            role: "user",
            content: userContent
          }
        ]
      }).withResponse();

      // Update rate limits from response headers
      this.rateLimitManager.updateFromHeaders(Object.fromEntries(response.headers));

      console.log('✅ [OpenAI Service] OpenAI API response received for batch')
      console.log('📊 [OpenAI Service] Usage:', completion.usage)

      // Handle refusals
      if (completion.choices[0].message.refusal) {
        console.error('❌ [OpenAI Service] OpenAI refused the request:', completion.choices[0].message.refusal)
        throw new Error(`OpenAI refused the analysis request: ${completion.choices[0].message.refusal}`)
      }

      const content = completion.choices[0].message?.content;
      if (!content) {
        console.error('❌ [OpenAI Service] OpenAI returned empty content for batch')
        throw new Error("OpenAI returned empty content for analysis.");
      }

      console.log('🔄 [OpenAI Service] Parsing structured response...')
      const parsed = JSON.parse(content);
      
      console.log(`✅ [OpenAI Service] Batch analysis completed successfully with ${parsed.analyses.length} results`)
      return parsed.analyses;
    } catch (error: any) {
      console.error('💥 [OpenAI Service] Error in analyzeSingleBatch:', error)
      
      if (
        retries > 0 &&
        (error.status === 429 || error.code === "rate_limit_exceeded")
      ) {
        const delay = Math.pow(2, 4 - retries) * 1000; // Exponential backoff
        console.log(`⏳ [OpenAI Service] Rate limit hit. Retrying in ${delay / 1000}s... (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.analyzeSingleBatch(batch, targetLanguage, retries - 1);
      }

      console.error('❌ [OpenAI Service] Batch analysis failed permanently:', error);
      throw error;
    }
  }

  async analyzeCommits(
    request: BackendAnalysisRequest
  ): Promise<BackendAnalysisResponse> {
    console.log('🤖 [OpenAI Service] analyzeCommits called')
    console.log('📊 [OpenAI Service] Input - Commit bundle count:', request.commitBundle?.length)
    console.log('🌐 [OpenAI Service] Input - Language:', request.language)
    
    const { commitBundle, language } = request;

    if (!commitBundle || commitBundle.length === 0) {
      console.warn('⚠️ [OpenAI Service] analyzeCommits called with empty commitBundle.');
      return { analysisResults: [] };
    }

    console.log('🔄 [OpenAI Service] Creating batches for analysis...')
    const batches = createCommitBatchesForAnalysis(commitBundle);
    console.log('📦 [OpenAI Service] Created', batches.length, 'batches')
    
    // Calculate average tokens per batch for concurrency optimization
    const avgTokensPerBatch = batches.reduce((sum, batch) => {
      return sum + countTokens(JSON.stringify(batch));
    }, 0) / batches.length;

    console.log(`⚡ [OpenAI Service] Average tokens per batch: ${Math.round(avgTokensPerBatch)}`);
    console.log(`🎯 [OpenAI Service] Rate limit status: ${this.rateLimitManager.getStatus()}`);

    try {
      // Process batches concurrently with intelligent rate limiting
      const batchResults = await this.concurrentProcessor.processBatchesConcurrently(
        batches,
        (batch, index) => this.analyzeSingleBatch(batch, language),
        avgTokensPerBatch
      );

      // Flatten results
      const allResults: SingleCommitAnalysis[] = [];
      for (const results of batchResults) {
        if (results && Array.isArray(results)) {
          allResults.push(...results);
        }
      }

      console.log('✅ [OpenAI Service] All batches processed concurrently')
      console.log('📊 [OpenAI Service] Total analysis results:', allResults.length)
      return { analysisResults: allResults };
    } catch (error) {
      console.error('💥 [OpenAI Service] Error in concurrent processing:', error);
      throw error;
    }
  }

  async generateReleaseNotes(
    request: BackendUpdateNotesRequest
  ): Promise<BackendUpdateNotesResponse> {
    console.log('📝 [OpenAI Service] generateReleaseNotes called')
    console.log('📊 [OpenAI Service] Input - Analysis results count:', request.analysisResults?.length)
    console.log('🌐 [OpenAI Service] Input - Language:', request.language)
    console.log('👤 [OpenAI Service] Input - Include author:', request.isAuthorIncluded)
    
    const { analysisResults, language, isAuthorIncluded } = request;

    if (!analysisResults || analysisResults.length === 0) {
      console.warn('⚠️ [OpenAI Service] generateReleaseNotes called with no analysis results.');
      return { updateNotes: "" };
    }

    const authorInstructions = isAuthorIncluded
      ? "Please group the update notes by author name."
      : "";

    const userContent = `Target language: ${language}
${authorInstructions}
Analysis results to convert to release notes:
${JSON.stringify(analysisResults, null, 2)}`;

    console.log('🔢 [OpenAI Service] Counting tokens for prompt...')
    const promptTokens = countTokens(BASE_UPDATE_NOTES_PROMPT + userContent);
    console.log('📊 [OpenAI Service] Prompt tokens:', promptTokens)
    
    if (promptTokens > MAX_INPUT_TOKENS) {
      console.warn(
        `⚠️ [OpenAI Service] Release notes prompt is ${promptTokens} tokens, may hit limits.`
      );
    }

    try {
      console.log('🤖 [OpenAI Service] Calling OpenAI API with structured output...')
      
      const { data: completion, response } = await this.client.chat.completions.create({
        model: MODEL_NAME,
        temperature: AI_CONFIG.temperature,
        top_p: AI_CONFIG.top_p,
        max_tokens: AI_CONFIG.max_tokens,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "release_notes",
            schema: releaseNotesJsonSchema,
            strict: true
          }
        },
        messages: [
          {
            role: "system",
            content: BASE_UPDATE_NOTES_PROMPT
          },
          {
            role: "user",
            content: userContent
          }
        ]
      }).withResponse();

      // Update rate limits from response headers
      this.rateLimitManager.updateFromHeaders(Object.fromEntries(response.headers));

      console.log('✅ [OpenAI Service] OpenAI API response received')
      console.log('📊 [OpenAI Service] Usage:', completion.usage)

      // Handle refusals
      if (completion.choices[0].message.refusal) {
        console.error('❌ [OpenAI Service] OpenAI refused the request:', completion.choices[0].message.refusal)
        throw new Error(`OpenAI refused the notes generation request: ${completion.choices[0].message.refusal}`)
      }

      const content = completion.choices[0].message?.content;
      if (!content) {
        console.error('❌ [OpenAI Service] OpenAI returned empty content')
        throw new Error("OpenAI returned empty content for release notes.");
      }

      console.log('🔄 [OpenAI Service] Parsing structured response...')
      const parsed = JSON.parse(content);
      
      console.log('✅ [OpenAI Service] Notes generation completed successfully')
      console.log('📊 [OpenAI Service] Generated notes length:', parsed.updateNotes.length, 'characters')
      
      return { updateNotes: parsed.updateNotes };
    } catch (error: any) {
      console.error('💥 [OpenAI Service] Error generating release notes:', error);
      throw error;
    }
  }
}

export default new OpenAIService();
