import { GoogleGenAI } from "@google/genai";
import { useState } from 'react'

const initGeminiAI = (apiKey) => {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }
  return new GoogleGenAI({ apiKey });
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateThumbnailWithGemini = async ({
  apiKey,
  style = "youtube-gaming",
  text = "",
  description = "",
  referenceImage = null,
  objectImages = [],
  count = 3
}) => {
  try {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }

    const ai = initGeminiAI(apiKey);
    
    let basePrompt = buildThumbnailPrompt({
      style,
      text,
      description,
      objectImages
    });

    const thumbnails = [];

    for (let i = 0; i < count; i++) {
      const prompt = await buildPromptWithImages({
        basePrompt: `${basePrompt} (Variation ${i + 1})`,
        referenceImage,
        objectImages
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: prompt,
      });

      const imageData = extractImageFromResponse(response);
      
      if (imageData) {
        thumbnails.push({
          id: i + 1,
          url: `data:image/png;base64,${imageData}`,
          prompt: basePrompt
        });
      }
    }

    return {
      success: true,
      thumbnails,
      count: thumbnails.length
    };

  } catch (error) {
    console.error("Gemini thumbnail generation failed:", error);
    return {
      success: false,
      error: error.message,
      thumbnails: []
    };
  }
};

const buildThumbnailPrompt = ({ style, text, description, objectImages }) => {
  const stylePrompts = {
    "youtube-gaming": "Epic gaming YouTube thumbnail with vibrant neon colors (#FF0080, #7928CA, #FF4081), explosive effects, dramatic lighting, and gaming elements. Bold, eye-catching design optimized for high click-through rate.",
    
    "youtube-tech": "Clean tech review YouTube thumbnail with modern gadgets, blue and white color scheme (#00D4FF, #5B73DE, #9D50BB), minimalist design, professional tech aesthetics.",
    
    "youtube-tutorial": "Educational tutorial YouTube thumbnail with clear instructional design, arrows pointing to key elements, step-by-step visual layout, bright orange and yellow colors (#FF6B35, #F7931E, #FFD23F).",
    
    "youtube-vlog": "Personal vlog YouTube thumbnail with warm pastel colors (#FF9A9E, #FECFEF), friendly atmosphere, lifestyle vibes, inviting and approachable design.",
    
    "youtube-music": "Music video YouTube thumbnail with vibrant artistic colors (#A8EDEA, #FED6E3, #D299C2), musical elements like notes or instruments, creative and energetic design.",
    
    "youtube-fitness": "Fitness YouTube thumbnail with energetic red-orange gradient (#FF416C, #FF4B2B, #FF8E53), dynamic action poses, motivational design, high-energy feel.",
    
    "youtube-food": "Food and cooking YouTube thumbnail with appetizing warm colors (#FDBB2D, #22C1C3, #FF9472), delicious food presentation, cozy kitchen vibes, mouth-watering appeal.",
    
    "youtube-business": "Professional business YouTube thumbnail with sophisticated gradient colors (#667eea, #764ba2, #f093fb), corporate style elements like charts or graphs, success-oriented design."
  };

  let prompt = stylePrompts[style] || stylePrompts["youtube-gaming"];

  if (text.trim()) {
    prompt += ` The thumbnail must prominently feature the text "${text}" in bold, readable font that stands out against the background.`;
  }

  if (description.trim()) {
    prompt += ` Additional style requirements: ${description}`;
  }

  if (objectImages.length > 0) {
    prompt += ` The thumbnail should incorporate ${objectImages.length} specific object(s) that will be provided as reference images.`;
  }

  prompt += " The image should be in 16:9 aspect ratio (1280x720 pixels), optimized for YouTube thumbnail visibility, with high contrast and eye-catching composition that performs well on mobile devices.";

  return prompt;
};

const buildPromptWithImages = async ({ basePrompt, referenceImage, objectImages }) => {
  const promptParts = [{ text: basePrompt }];

  if (referenceImage) {
    let imageData;
    
    if (referenceImage instanceof File) {
      imageData = await fileToBase64(referenceImage);
    } else if (typeof referenceImage === 'string' && referenceImage.startsWith('data:image')) {
      imageData = referenceImage.split(',')[1];
    } else {
      console.warn("Invalid reference image format");
    }

    if (imageData) {
      promptParts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageData,
        },
      });
      
      promptParts.push({
        text: "Use this reference image as style inspiration while creating the thumbnail."
      });
    }
  }

  for (let i = 0; i < objectImages.length; i++) {
    const obj = objectImages[i];
    let imageData;
    
    if (obj.file instanceof File) {
      imageData = await fileToBase64(obj.file);
    } else if (typeof obj.url === 'string' && obj.url.startsWith('data:image')) {
      imageData = obj.url.split(',')[1];
    } else {
      continue;
    }

    if (imageData) {
      promptParts.push({
        inlineData: {
          mimeType: "image/png",
          data: imageData,
        },
      });
      
      promptParts.push({
        text: `Integrate this object (${obj.name || `Object ${i + 1}`}) naturally into the thumbnail composition.`
      });
    }
  }

  return promptParts;
};

const extractImageFromResponse = (response) => {
  try {
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to extract image from response:", error);
    return null;
  }
};

export const useGeminiThumbnailGenerator = (apiKey) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateThumbnails = async (params) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateThumbnailWithGemini({
        apiKey,
        ...params
      });
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || "Failed to generate thumbnails";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        thumbnails: []
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateThumbnails,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
};