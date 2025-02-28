import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { ChatMessage } from "@/types/chat";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing Gemini API key");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Safety settings to filter harmful content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const generationConfig = {
  temperature: 0.7, // Adjusted for more balanced responses
  topK: 5,
  topP: 0.95,
  maxOutputTokens: 4096, // Increased for more detailed responses
};

/**
 * Generates an AI response from the Gemini API.
 */
export async function generateResponse(
  prompt: string,
  history: ChatMessage[] = [],
  attachment?: { url: string; type: "document" | "image"; name: string }
) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig,
      safetySettings,
    });

    let contentParts: any[] = [];

    if (attachment) {
      console.log(
        `Processing attachment: ${attachment.name} (${attachment.type})`
      );

      try {
        // Fetch file from Cloudinary URL
        const fileResponse = await fetch(attachment.url);
        const fileBuffer = await fileResponse.arrayBuffer();
        const base64Data = Buffer.from(fileBuffer).toString("base64");

        // Determine MIME type
        const mimeType = getMimeType(attachment.name, attachment.type);

        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });
      } catch (fetchError) {
        console.error("Error fetching attachment:", fetchError);
        return "I encountered an issue processing the file. Please check the file format and try again.";
      }
    }

    // Add user prompt
    contentParts.push({
      text: prompt || getDefaultPrompt(attachment?.type, attachment?.name),
    });

    // Send request to AI model
    const result = await model.generateContent(contentParts);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    return text;
  } catch (error: any) {
    console.error("Error generating response:", error);
    return "An error occurred while generating the response. Please try again later.";
  }
}

/**
 * Processes an uploaded file, extracts content, and generates a study-oriented summary.
 */
export async function processFile(file: File, prompt?: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig,
      safetySettings,
    });

    console.log(`Processing uploaded file: ${file.name} (${file.type})`);

    // Convert file to base64
    const base64Data = await fileToBase64(file);

    // Create structured request data
    const fileData = {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    };

    const result = await model.generateContent([
      fileData,
      { text: prompt || getDefaultPrompt("document", file.name) },
    ]);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    return text;
  } catch (error: any) {
    console.error("Error processing file:", error);
    return "I encountered an issue processing the file. Please check the file format and try again.";
  }
}

/**
 * Converts a file to a base64 string.
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Determines the MIME type of a file.
 */
function getMimeType(fileName: string, type: "document" | "image"): string {
  if (type === "image") return "image/jpeg";

  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  switch (fileExtension) {
    case "pdf":
      return "application/pdf";
    case "txt":
      return "text/plain";
    case "doc":
      return "application/pdf";
    case "docx":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

/**
 * Generates a default prompt tailored for study assistance.
 */
function getDefaultPrompt(
  type?: "document" | "image",
  fileName?: string
): string {
  if (type === "image") {
    return "Analyze this image and describe its key educational aspects.";
  }

  return `Please analyze this document (${
    fileName || "file"
  }) and provide a structured study guide with:
  
1. **Main Topic & Purpose**  
2. **Key Concepts (bullet points)**  
3. **Detailed Explanation**  
4. **Important Takeaways & Examples**  
5. **Related Topics for Further Study**  
6. **Summarized Notes** (concise revision points)  
7. **Possible Exam Questions** (if applicable)`;
}
