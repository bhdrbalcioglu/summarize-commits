// backend/src/controllers/openAIController.ts
import { Request, Response, NextFunction } from "express";
import openAIServiceInstance from "../services/openAIService.js"; // Import the default instance
// Or if you exported the class: import { OpenAIService } from "../services/openAIService.js";
// const openAIService = new OpenAIService(); // And instantiate it here
import { analyticsService } from "../services/analyticsService.js";

import {
  BackendAnalysisRequest,
  BackendUpdateNotesRequest,
} from "../types/ai.types.js";

export const analyzeCommitsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('🎯 [OpenAI Controller] analyzeCommitsController called')
  console.log('📥 [OpenAI Controller] Request body keys:', Object.keys(req.body))
  console.log('📊 [OpenAI Controller] Commit bundle count:', req.body?.commitBundle?.length)
  console.log('🌐 [OpenAI Controller] Target language:', req.body?.language)
  
  try {
    // Basic input validation (can be enhanced with libraries like Joi or Zod)
    const requestBody: BackendAnalysisRequest = req.body;
    if (
      !requestBody ||
      !requestBody.commitBundle ||
      !Array.isArray(requestBody.commitBundle) ||
      requestBody.commitBundle.length === 0
    ) {
      console.log('❌ [OpenAI Controller] Invalid request: missing or empty commitBundle')
      res.status(400).json({
        status: "error",
        message: "Invalid request: 'commitBundle' (non-empty array) is required.",
      });
      return;
    }
    if (!requestBody.language || typeof requestBody.language !== "string") {
      console.log('❌ [OpenAI Controller] Invalid request: missing or invalid language')
      res.status(400).json({
        status: "error",
        message: "Invalid request: 'language' (string) is required.",
      });
      return;
    }

    console.log('✅ [OpenAI Controller] Request validation passed')
    console.log('🔄 [OpenAI Controller] Calling OpenAI service...')

    const startTime = Date.now();
    const analysisResponse = await openAIServiceInstance.analyzeCommits(
      requestBody
    );
    const processingTime = Date.now() - startTime;
    
    console.log('✅ [OpenAI Controller] OpenAI service response received')
    console.log('📊 [OpenAI Controller] Analysis results count:', analysisResponse.analysisResults?.length)
    console.log('📤 [OpenAI Controller] Sending response to frontend')

    // Track AI analysis event
    if (req.auth?.userId) {
      await analyticsService.trackEvent({
        event_type: "ai_analysis_requested",
        user_id: String(req.auth.userId),
        metadata: {
          analysis_type: "commit_summary",
          language: requestBody.language,
          commit_count: requestBody.commitBundle.length,
          processing_time_ms: processingTime,
          results_count: analysisResponse.analysisResults?.length || 0,
          provider: req.auth.provider,
          has_diffs: requestBody.commitBundle.some(c => c.diff && c.diff.length > 0)
        }
      });
    }
    
    res.status(200).json({
      status: "success",
      data: analysisResponse
    });
  } catch (error) {
    console.error('💥 [OpenAI Controller] Error in analyzeCommitsController:', error)

    // Track failed AI request
    if (req.auth?.userId) {
      await analyticsService.trackEvent({
        event_type: "ai_analysis_requested",
        user_id: String(req.auth.userId),
        metadata: {
          analysis_type: "commit_summary",
          language: req.body?.language,
          commit_count: req.body?.commitBundle?.length || 0,
          error: true,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          provider: req.auth.provider
        }
      });
    }

    // Forward error to the global error handler
    // The service should throw errors with appropriate messages/status codes if possible
    next(error);
  }
};

export const generateReleaseNotesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('📝 [OpenAI Controller] generateReleaseNotesController called')
  console.log('📥 [OpenAI Controller] Request body keys:', Object.keys(req.body))
  console.log('📊 [OpenAI Controller] Analysis results count:', req.body?.analysisResults?.length)
  console.log('🌐 [OpenAI Controller] Target language:', req.body?.language)
  console.log('👤 [OpenAI Controller] Include author:', req.body?.isAuthorIncluded)
  
  try {
    const requestBody: BackendUpdateNotesRequest = req.body;
    if (
      !requestBody ||
      !requestBody.analysisResults ||
      !Array.isArray(requestBody.analysisResults) ||
      requestBody.analysisResults.length === 0
    ) {
      console.log('❌ [OpenAI Controller] Invalid request: missing or empty analysisResults')
      res.status(400).json({
        status: "error",
        message: "Invalid request: 'analysisResults' (non-empty array) is required.",
      });
      return;
    }
    if (!requestBody.language || typeof requestBody.language !== "string") {
      console.log('❌ [OpenAI Controller] Invalid request: missing or invalid language')
      res.status(400).json({
        status: "error",
        message: "Invalid request: 'language' (string) is required.",
      });
      return;
    }
    // isAuthorIncluded is optional, so no strict check unless it has specific invalid values

    console.log('✅ [OpenAI Controller] Request validation passed')
    console.log('🔄 [OpenAI Controller] Calling OpenAI service for notes generation...')

    const startTime = Date.now();
    const updateNotesResponse =
      await openAIServiceInstance.generateReleaseNotes(requestBody);
    const processingTime = Date.now() - startTime;
      
    console.log('✅ [OpenAI Controller] OpenAI service response received')
    console.log('📊 [OpenAI Controller] Notes length:', updateNotesResponse.updateNotes?.length, 'characters')
    console.log('📤 [OpenAI Controller] Sending response to frontend')

    // Track release notes generation event
    if (req.auth?.userId) {
      await analyticsService.trackEvent({
        event_type: "commit_summary_generated",
        user_id: String(req.auth.userId),
        metadata: {
          analysis_type: "release_notes",
          language: requestBody.language,
          analysis_results_count: requestBody.analysisResults.length,
          include_author: requestBody.isAuthorIncluded,
          processing_time_ms: processingTime,
          output_length: updateNotesResponse.updateNotes?.length || 0,
          provider: req.auth.provider
        }
      });
    }
    
    res.status(200).json({
      status: "success",
      data: updateNotesResponse
    });
  } catch (error) {
    console.error('💥 [OpenAI Controller] Error in generateReleaseNotesController:', error)

    // Track failed release notes generation
    if (req.auth?.userId) {
      await analyticsService.trackEvent({
        event_type: "commit_summary_generated",
        user_id: String(req.auth.userId),
        metadata: {
          analysis_type: "release_notes",
          language: req.body?.language,
          analysis_results_count: req.body?.analysisResults?.length || 0,
          include_author: req.body?.isAuthorIncluded,
          error: true,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          provider: req.auth.provider
        }
      });
    }

    // Forward error to the global error handler
    // The service should throw errors with appropriate messages/status codes if possible
    next(error);
  }
};
