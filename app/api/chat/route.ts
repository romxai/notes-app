import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Instance from "@/lib/models/instance";
import File from "@/lib/models/file";
import { withAuth } from "@/lib/auth";
import { generateResponse } from "@/lib/gemini";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

// Set timeout for the API request
const TIMEOUT = 55000; // 55 seconds (slightly less than Vercel's 60s limit)

// Helper function to handle timeouts
function timeoutPromise(promise: Promise<any>, ms: number) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms)
    ),
  ]);
}

export async function POST(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const { message, instanceId, attachment } = await request.json();

    // Find the chat instance
    const instance = await Instance.findOne({
      _id: instanceId,
      userId: payload.userId,
      type: "chat",
    }).lean();

    if (!instance) {
      return NextResponse.json(
        { error: "Chat instance not found" },
        { status: 404 }
      );
    }

    // Fetch all files from the folder (with lean for better performance)
    const folderFiles = await File.find({ folderId: instance.folderId }).lean();
    console.log(`Found ${folderFiles.length} files in folder`);

    // Prepare files data more efficiently
    const filesWithContent = folderFiles.map((file) => ({
      ...file,
      fileData: {
        uri: file.fileUri,
        mimeType: file.mimeType,
      },
    }));

    // Add user message
    const userMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date(),
      attachments: attachment ? [attachment] : undefined,
    };

    try {
      // Get AI response with timeout
      const aiResponse = await timeoutPromise(
        generateResponse(
          message,
          instance.messages || [],
          attachment,
          filesWithContent
        ),
        TIMEOUT
      );

      // Add AI message
      const aiMessage = {
        role: "assistant" as const,
        content: aiResponse,
        timestamp: new Date(),
      };

      // Update instance with new messages and content
      const updatedMessages = [
        ...(instance.messages || []),
        userMessage,
        aiMessage,
      ];
      await Instance.findByIdAndUpdate(
        instanceId,
        {
          $set: {
            messages: updatedMessages,
            content: {
              lastMessage: aiMessage.content,
              messageCount: updatedMessages.length,
            },
          },
        },
        { new: true }
      );

      return NextResponse.json({
        messages: [userMessage, aiMessage],
      });
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage =
        error.message === "Request timeout"
          ? "The request took too long to process. Please try again with a shorter message."
          : "Failed to generate AI response";

      return NextResponse.json(
        { error: errorMessage },
        { status: error.message === "Request timeout" ? 408 : 500 }
      );
    }
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");

    if (!instanceId) {
      return NextResponse.json(
        { error: "Instance ID is required" },
        { status: 400 }
      );
    }

    // Use lean() for better performance
    const instance = await Instance.findOne({
      _id: instanceId,
      userId: payload.userId,
      type: "chat",
    }).lean();

    if (!instance) {
      return NextResponse.json(
        { error: "Chat instance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      messages: instance.messages || [],
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}
