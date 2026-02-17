
import { GoogleGenAI } from "@google/genai";
import { VehicleCategory, WeatherState } from "../types";

export interface Detection {
  box: [number, number, number, number]; // [x, y, w, h] as percentages
  label: string;
  speed?: number;
  behavior?: string;
  id: string;
}

export interface Incident {
  type: 'accident' | 'near-miss' | 'erratic_driving' | 'obstruction';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: number;
}

export interface ForensicReport {
  detections: Detection[];
  incidents: Incident[];
  aggressionScore: number;
  riskScore: number;
  summary: string;
  infrastructureAdvice: string;
  isRateLimited?: boolean;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AIAnalysisResult {
  vehicleNumber: string;
  vehicleType: VehicleCategory;
  estimatedSpeed: number;
  riderCount: number;
  helmetDetected: boolean;
  seatbeltDetected: boolean;
  confidence: { overall: number; localization: number; ocr: number; patternMatch: number };
  rawOcr: string;
  processingSteps: string[];
  boundingBox?: BoundingBox;
  plateBoundingBox?: BoundingBox;
}

export interface EnhancementResult {
  confidence: number;
  forensicSummary: string;
}

/**
 * Utility to handle API calls with exponential backoff for rate limits (429 errors).
 */
async function callAIWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export const analyzeRouteSafety = async (source: string, destination: string, weather: WeatherState): Promise<string> => {
  return callAIWithRetry(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Perform a tactical traffic safety audit for a route from ${source} to ${destination} in an Indian city context during ${weather} weather.
        Identify 1 specific road safety risk (e.g., specific junction accidents, waterlogging, or high-speed curves) and give 1 actionable advice for the driver.
        Keep it under 30 words.`
      });
      return response.text.trim();
    } catch (error) {
      return "Caution: Dynamic traffic density detected. Maintain standard safe distance.";
    }
  });
};

export const analyzeTrafficVideoFrame = async (base64Image: string, weather: WeatherState, historySummary?: string): Promise<ForensicReport | null> => {
  try {
    return await callAIWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
            { text: `Act as a specialized traffic vision system. Analyze this frame from a traffic feed. 
            Context: Weather is ${weather}. 
            Previous Context (for tracking): ${historySummary || 'None'}.

            Detect and return a JSON object with:
            1. 'detections': Array of detected objects (car, motorcycle, pedestrian, truck, debris). 
               Include 'box' [x, y, w, h] as percentages, 'label', 'speed' (estimate in km/h), 'behavior' (braking, turning, accelerating, stationary), and a consistent 'id' if possible.
            2. 'incidents': Array of current anomalies. Types: 'accident' (collisions, flipped vehicles), 'near-miss' (dangerous proximity), 'erratic_driving' (lane weaving, sudden stops), 'obstruction' (debris, stalled vehicle).
            3. 'aggressionScore': 0-100 score for overall traffic flow chaos.
            4. 'riskScore': 0-100 safety risk level.
            5. 'summary': A concise one-sentence status (e.g., "Flowing smoothly" or "Accident detected in lane 2").
            6. 'infrastructureAdvice': Practical urban engineering suggestion based on visible congestion or behavior.

            If NO accident is detected, return an empty 'incidents' array. Do not invent accidents.
            Return ONLY valid JSON.` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const text = response.text;
      return text ? JSON.parse(text) : null;
    }, 1); // Only 1 retry for real-time video to avoid excessive lag
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return {
        detections: [],
        incidents: [],
        aggressionScore: 0,
        riskScore: 0,
        summary: "Neural link throttled by API quota limits.",
        infrastructureAdvice: "Increase compute quota or optimize frame intervals.",
        isRateLimited: true
      };
    }
    console.error("Neural Analysis Failed:", error);
    return null;
  }
};

export const analyzeVehicleImage = async (base64Image: string): Promise<AIAnalysisResult | null> => {
  return callAIWithRetry(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
            { text: `Analyze this vehicle image for forensic traffic data extraction. Provide vehicleNumber, vehicleType, estimatedSpeed, riderCount, helmetDetected (boolean), seatbeltDetected (boolean), confidence scores, boundingBox, and plateBoundingBox (each with x, y, w, h in percentages). Return as JSON.` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const text = response.text;
      return text ? JSON.parse(text) : null;
    } catch (error) {
      return null;
    }
  });
};

export const enhanceCCTVImage = async (base64Image: string): Promise<EnhancementResult | null> => {
  return callAIWithRetry(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
            { text: `Perform forensic enhancement on this CCTV frame. Improve clarity for identification. Provide a confidence score (0-1) and a forensicSummary string of the improvements and visible details. Return as JSON.` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const text = response.text;
      return text ? JSON.parse(text) : null;
    } catch (error) {
      return null;
    }
  });
};

export const getSmartRecommendations = async (stats: any): Promise<string[]> => {
  return callAIWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these traffic stats: ${JSON.stringify(stats)}, generate 5 actionable infrastructure recommendations for city planners. Keep each recommendation short and specific.`
    });
    return response.text.split('\n').filter(l => l.length > 5);
  });
};
