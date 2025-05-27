// backend/src/controllers/openAIController.ts
import { Request, Response, NextFunction } from "express";
import openAIServiceInstance from "../services/openAIService.js"; // Import the default instance
// Or if you exported the class: import { OpenAIService } from "../services/openAIService.js";
// const openAIService = new OpenAIService(); // And instantiate it here

import {
  BackendAnalysisRequest,
  BackendUpdateNotesRequest,
} from "../types/ai.types.js";

export const analyzeCommitsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Basic input validation (can be enhanced with libraries like Joi or Zod)
    const requestBody: BackendAnalysisRequest = req.body;
    if (
      !requestBody ||
      !requestBody.commitBundle ||
      !Array.isArray(requestBody.commitBundle) ||
      requestBody.commitBundle.length === 0
    ) {
      res.status(400).json({
        message:
          "Invalid request: 'commitBundle' (non-empty array) is required.",
      });
      return;
    }
    if (!requestBody.language || typeof requestBody.language !== "string") {
      res
        .status(400)
        .json({ message: "Invalid request: 'language' (string) is required." });
      return;
    }

    const analysisResponse = await openAIServiceInstance.analyzeCommits(
      requestBody
    );
    res.status(200).json(analysisResponse);
  } catch (error) {
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
  try {
    const requestBody: BackendUpdateNotesRequest = req.body;
    if (
      !requestBody ||
      !requestBody.analysisResults ||
      !Array.isArray(requestBody.analysisResults) ||
      requestBody.analysisResults.length === 0
    ) {
      res.status(400).json({
        message:
          "Invalid request: 'analysisResults' (non-empty array) is required.",
      });
      return;
    }
    if (!requestBody.language || typeof requestBody.language !== "string") {
      res
        .status(400)
        .json({ message: "Invalid request: 'language' (string) is required." });
      return;
    }
    // isAuthorIncluded is optional, so no strict check unless it has specific invalid values

    const updateNotesResponse =
      await openAIServiceInstance.generateReleaseNotes(requestBody);
    res.status(200).json(updateNotesResponse);
  } catch (error) {
    next(error);
  }
};
