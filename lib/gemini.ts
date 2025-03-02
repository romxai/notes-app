import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing Gemini API key");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
  temperature: 0.7,
  topK: 20,
  topP: 0.8,
  maxOutputTokens: 4096,
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  attachments?: { type: "document" | "image"; url: string; name: string }[];
};

const INITIAL_CONTEXT = `You are a helpful Study Assistant. Your goal is to help students understand concepts, explain topics clearly, and provide relevant examples. Be concise but thorough in your explanations. Format your responses in markdown for better readability.`;

// Helper function to map our roles to Gemini roles
function mapRole(role: "user" | "assistant"): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

export async function generateResponse(
  prompt: string,
  history: Message[] = [],
  attachment?: { url: string; type: "document" | "image"; name: string },
  folderFiles: any[] = []
) {
  try {
    console.log("Generating response with:", {
      prompt,
      historyLength: history.length,
      attachment: attachment
        ? `${attachment.type} - ${attachment.name}`
        : "none",
      folderFilesCount: folderFiles.length,
    });

    const modelName = "gemini-1.5-pro";
    console.log(`Using model: ${modelName}`);

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig,
      safetySettings,
    });

    // Prepare content parts array
    let contentParts = [];

    // First, add all file data parts
    if (folderFiles.length > 0) {
      // Add each file's data as a separate part
      for (const file of folderFiles) {
        if (file.fileData?.uri) {
          contentParts.push({
            fileData: {
              fileUri: file.fileData.uri,
              mimeType: file.mimeType,
            },
          });
        }
      }
    }

    // Add current attachment if present
    if (attachment) {
      try {
        const fileResponse = await fetch(attachment.url);
        const fileBuffer = await fileResponse.arrayBuffer();
        const base64Data = Buffer.from(fileBuffer).toString("base64");
        const mimeType = getMimeType(attachment.name, attachment.type);

        contentParts.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });
      } catch (fetchError) {
        console.error("Error fetching attachment:", fetchError);
      }
    }

    // Add file list context and prompt as the final text part
    const fileListContext =
      folderFiles.length > 0
        ? `Available files:\n${folderFiles
            .map((file) => `- ${file.displayName}`)
            .join("\n")}\n\n`
        : "";

    contentParts.push({
      text: `${fileListContext}${prompt}`,
    });

    // Map history to Gemini's expected format
    const mappedHistory = history.map((msg) => ({
      role: mapRole(msg.role),
      parts: [{ text: msg.content }],
    }));

    console.log("Starting chat with history:", {
      historyLength: mappedHistory.length,
      roles: mappedHistory.map((msg) => msg.role),
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: INITIAL_CONTEXT }],
        },
        ...mappedHistory,
      ],
      generationConfig,
      safetySettings,
    });

    console.log("Sending message to Gemini with content parts:", {
      numParts: contentParts.length,
      types: contentParts.map((part) => Object.keys(part)[0]),
    });

    const result = await chat.sendMessage(contentParts);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    console.log("Received response from Gemini:", {
      responseLength: text.length,
      firstLine: text.split("\n")[0],
    });

    return text;
  } catch (error: any) {
    console.error("Error generating response:", error);
    throw error;
  }
}

function getMimeType(fileName: string, type: "document" | "image"): string {
  if (type === "image") {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      default:
        return "image/jpeg";
    }
  }

  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

function getDefaultPrompt(
  type?: "document" | "image",
  fileName?: string
): string {
  if (type === "image") {
    return "Please analyze this image and provide a detailed explanation of its educational content, key concepts, and any important observations.";
  }

  return `Please analyze this document (${
    fileName || "file"
  }) and provide a comprehensive study guide with:

1. **Main Topic & Key Concepts**
2. **Detailed Explanation**
3. **Important Points & Examples**
4. **Summary & Review Notes**
5. **Practice Questions**

Please format the response in markdown for better readability.`;
}
