// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * THE CORE AUDIT FUNCTION
 * Synchronized with your LLM_API_KEY and LLM_MODEL variables.
 */
export const analyzePII = async (data: any) => {
  try {
    // 1. Grab the key from your env.ts file
    const apiKey = env.LLM_API_KEY; 
    
    if (!apiKey) {
      logger.error("[AI Audit] CRITICAL: LLM_API_KEY is missing in env.ts");
      return fallbackResponse("Missing API Key");
    }

    // 2. Initialize using your loaded key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 3. Use the model specified in your .env (gemini-flash-latest)
    const model = genAI.getGenerativeModel({ model: env.LLM_MODEL || "gemini-1.5-flash" });

    const dataString = JSON.stringify(data).substring(0, 10000);

    const prompt = `
      Perform a deep security audit on this JSON dataset. 
      Identify Personally Identifiable Information (PII) such as Names, UIDs (like 24BCS10257), Emails, or Phone Numbers.
      
      DATASET:
      ${dataString}

      RESPONSE FORMAT (STRICT JSON ONLY):
      {
        "riskScore": number,
        "riskLevel": "low" | "medium" | "high" | "critical",
        "summary": "string",
        "anomalies": ["string"]
      }
    `;

    logger.info(`[AI Audit] Sending request using model: ${env.LLM_MODEL}`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse the response
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(cleanedText);

    return {
      riskScore: analysis.riskScore || 0,
      riskLevel: analysis.riskLevel || "low",
      summary: analysis.summary || "Scan complete.",
      anomalies: analysis.anomalies || []
    };

  } catch (error: any) {
    logger.error(`[AI Audit Error] ${error.message}`);
    return fallbackResponse(error.message);
  }
};

function fallbackResponse(reason: string) {
  return {
    riskScore: 0,
    riskLevel: "low",
    summary: `Audit failed: ${reason}`,
    anomalies: []
  };
}