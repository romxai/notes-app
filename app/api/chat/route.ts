import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Instance from "@/lib/models/instance";
import File from "@/lib/models/file";
import { withAuth } from "@/lib/auth";
import { generateResponse } from "@/lib/gemini";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

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
    });

    if (!instance) {
      return NextResponse.json(
        { error: "Chat instance not found" },
        { status: 404 }
      );
    }

    // Fetch all files from the folder
    const folderFiles = await File.find({ folderId: instance.folderId });
    console.log(`Found ${folderFiles.length} files in folder`);

    // Get file contents from Google AI File Manager
    const filesWithContent = await Promise.all(
      folderFiles.map(async (file) => {
        try {
          // We only need the file URI and mime type for Gemini
          return {
            ...file.toObject(),
            fileData: {
              uri: file.fileUri,
              mimeType: file.mimeType,
            },
          };
        } catch (error) {
          console.error(`Error preparing file data for ${file.name}:`, error);
          return file.toObject();
        }
      })
    );

    // Add user message with attachment if present
    const userMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date(),
      attachments: attachment ? [attachment] : undefined,
    };

    try {
      // Get AI response with conversation history and folder files
      const aiResponse = await generateResponse(
        message,
        instance.messages || [],
        attachment,
        filesWithContent
      );

      // Add AI message
      const aiMessage = {
        role: "assistant" as const,
        content: aiResponse,
        timestamp: new Date(),
      };

      // Update instance with new messages and content
      instance.messages = [
        ...(instance.messages || []),
        userMessage,
        aiMessage,
      ];
      instance.content = {
        lastMessage: aiMessage.content,
        messageCount: instance.messages.length,
      };
      await instance.save();

      return NextResponse.json({
        messages: [userMessage, aiMessage],
      });
    } catch (error) {
      console.error("Error generating response:", error);
      return NextResponse.json(
        { error: "Failed to generate AI response" },
        { status: 500 }
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

    // Find the chat instance
    const instance = await Instance.findOne({
      _id: instanceId,
      userId: payload.userId,
      type: "chat",
    });

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
