import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import File from "@/lib/models/file";
import Summary from "@/lib/models/summary";
import { withAuth } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export async function GET(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) return payload;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    const summaries = await Summary.find({ folderId }).sort({ createdAt: -1 });
    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Error fetching summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) return payload;

    await dbConnect();
    const { folderId } = await request.json();

    // Get all files in the folder that don't have summaries
    const existingSummaries = await Summary.find({ folderId });
    const summarizedFileIds = existingSummaries.map((s) => s.fileId.toString());

    const files = await File.find({
      folderId,
      _id: { $nin: summarizedFileIds },
    });

    if (files.length === 0) {
      return NextResponse.json({ message: "No new files to summarize" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const summaries = [];
    for (const file of files) {
      console.log(`Generating summary for file: ${file.displayName}`);

      // Get file content from Google AI File Manager
      const fileData = await fileManager.getFile(file.name);

      // Generate summary using Gemini
      const result = await model.generateContent([
        {
          fileData: {
            fileUri: fileData.uri,
            mimeType: file.mimeType,
          },
        },
        `Please analyze this document and provide a structured chapter-wise summary. Ensure the response is always in the following JSON format:
[
  {
    "title": "<Chapter Title>",
    "content": "<Concise but comprehensive summary of the chapter>"
  }
]

Guidelines:
- Each chapter or major section should have a unique "title" corresponding to the topic.
- The "content" should provide a well-structured, concise, but informative summary of that chapter.
- Do not include additional metadata or formatting outside of the JSON structure.
- Ensure the output remains consistent across all generations.`,
      ]);

      const response = await result.response;
      const text = response.text();

      
      // Parse the response into chapters (this is a simple example, adjust based on actual response format)
      const chapters = text.split("\n\n").map((chapter) => {
        const [title, ...content] = chapter.split("\n");
        return {
          title: title.trim(),
          content: content.join("\n").trim(),
        };
      });

      const parseChapters = (chapters) => {
        return chapters.flatMap((chapter) => {
          try {
            const parsedContent = JSON.parse(chapter.content); // Try parsing the JSON string
            if (Array.isArray(parsedContent)) {
              return parsedContent; // If it's an array, return it as the new chapters list
            }
          } catch (error) {
            console.warn("Failed to parse chapter content as JSON:", error);
          }
          return chapter; // If parsing fails, return the original chapter
        });
      };

      // Create summary document
      const summary = await Summary.create({
        fileId: file._id,
        folderId,
        fileName: file.displayName,
        chapters,
      });

      summaries.push(summary);
    }

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Error generating summaries:", error);
    return NextResponse.json(
      { error: "Failed to generate summaries" },
      { status: 500 }
    );
  }
}
