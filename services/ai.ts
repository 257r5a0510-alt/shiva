
import { GoogleGenAI } from "@google/genai";
import { VehicleCategory, WeatherState, AdvancedAIResponse, CityIntelligence, EnhancementResult } from "../types";

// Export EnhancementResult so it can be imported from this module as expected by components
export type { EnhancementResult };

async function callAIWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export const getHyderabadIntelligence = async (): Promise<CityIntelligence | null> => {
  return callAIWithRetry(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an advanced Smart City Traffic Vision AI configured specifically for Hyderabad, India.
Analyze the traffic conditions and fetch real-time weather for Hyderabad.
Include: Madhapur, Gachibowli, Banjara Hills, Kukatpally, LB Nagar, Secunderabad, Charminar, Hitech City, Mehdipatnam.
Return STRICT JSON ONLY:
{
  "city": "Hyderabad",
  "areas": [
    {
      "name": "Area Name",
      "risk_percentage": 0-100,
      "risk_level": "Low/Medium/High"
    }
  ],
  "current_weather": {
    "temperature": "XX°C",
    "condition": "Sunny/Rainy/Cloudy/Foggy",
    "humidity": "XX%",
    "wind_speed": "X km/h",
    "last_updated": "Timestamp"
  }
}`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        },
      });
      return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
      console.error("Hyderabad Intelligence API Failed:", error);
      return null;
    }
  });
};

export const analyzeTrafficVideoFrame = async (base64Image: string, weather: WeatherState): Promise<AdvancedAIResponse | null> => {
  try {
    return await callAIWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
            { text: `You are an advanced Smart City Traffic Vision AI optimized for real-time monitoring.
Analyze the provided traffic video frame and perform:
1. VEHICLE DETECTION: Detect every vehicle (car, motorcycle, auto rickshaw, truck, bus). Assign tracking ID. Provide bbox [x1, y1, x2, y2] in percentages.
2. ANPR: Extract the license plate number for EVERY detected vehicle if visible. Format: Indian [A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}.
3. BEHAVIOR: Detect abnormal motion or sudden speed drops.
4. COLLISION DETECTION: Identify accidents using vehicle-to-vehicle overlap and impact motion analysis.

Weather context: ${weather}.

Return ONLY STRICT JSON matching this schema:
{
  "vehicles": [{"id": "string", "type": "string", "confidence": number, "speed_estimated_kmph": number, "bbox": [number, number, number, number], "status": "normal|abnormal", "plate": "string|null"}],
  "collision_detected": boolean,
  "collision_confidence": number,
  "collision_zone_coordinates": [number, number, number, number],
  "vehicles_involved": ["string"],
  "alert_level": "LOW|MEDIUM|HIGH",
  "warning_message": "string"
}` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      return response.text ? JSON.parse(response.text) : null;
    }, 1);
  } catch (error) {
    console.error("Advanced Vision API Failed:", error);
    return null;
  }
};

export const analyzeVehicleImage = async (base64Image: string): Promise<any | null> => {
  return callAIWithRetry(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
            { text: `You are an advanced traffic vision AI acting as a full ANPR pipeline (YOLO/OpenCV + EasyOCR).
Analyze the uploaded image and perform the following simulated pipeline steps:
1. Detect the vehicle and license plate region using simulated YOLO object detection.
2. Crop and preprocess the plate image (grayscale, threshold).
3. Apply simulated OCR (EasyOCR/Tesseract) to extract the vehicle number.
4. Clean the extracted text: Remove spaces, Convert to uppercase, Remove special characters.
5. Validate the plate using Indian format Pattern: [A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}.
6. If multiple plates are found, choose the clearest and highest confidence one.
7. If detection confidence is below 70%, mark as LOW_CONFIDENCE.

Return ONLY JSON in this format:
{
  "vehicle_type": "string",
  "plate_detected": boolean,
  "plate_number": "string",
  "confidence_score": number,
  "validation_status": "VALID / INVALID / LOW_CONFIDENCE",
  "error_message": "string | null"
}` }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
      console.error("Vehicle Analysis Error:", error);
      return null;
    }
  });
};

export const analyzeRouteSafety = async (source: string, destination: string, weather: WeatherState, coords?: { lat: number, lng: number }) => {
  return callAIWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Route safety audit from ${source} to ${destination} in Hyderabad during ${weather} weather. Use Google Maps data for current hazards.`,
      config: { 
        tools: [{ googleMaps: {} }],
        ...(coords && { toolConfig: { retrievalConfig: { latLng: { latitude: coords.lat, longitude: coords.lng } } } })
      },
    });
    return { 
      text: response.text || "Safe passage predicted.", 
      links: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(c => c.maps).map(c => ({ title: c.maps?.title || "Map", uri: c.maps?.uri || "" })) || []
    };
  });
};

export const analyzeVideoUnderstanding = async (frames: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts = frames.map(f => ({ inlineData: { mimeType: 'image/jpeg', data: f.split(',')[1] } }));
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [...parts, { text: "Explain the high-level traffic narrative and key safety takeaways from this video sequence." }] }
  });
  return response.text;
};

export const enhanceCCTVImage = async (img: string): Promise<EnhancementResult | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: img.split(',')[1] } }, { text: "Perform forensic enhancement. Return JSON with confidence and forensicSummary." }] },
    config: { responseMimeType: "application/json" }
  });
  return response.text ? JSON.parse(response.text) : null;
};

export const getSmartRecommendations = async (stats: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Infrastructure advice for: ${JSON.stringify(stats)}`
  });
  return response.text.split('\n').filter(l => l.length > 5);
};
