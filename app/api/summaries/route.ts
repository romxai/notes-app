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

interface Chapter {
  title: string;
  content: string;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();

    // Extract folderId from query parameters
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId"); // Ensure folderId is defined

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    const summaries = await Summary.find({ folderId }).sort({ createdAt: -1 });

    // Transform any summaries that might be in the old format
    const transformedSummaries = summaries.map((summary) => {
      if (
        summary.chapters.length === 1 &&
        summary.chapters[0].title === "```json"
      ) {
        try {
          // Extract JSON from the content
          const jsonMatch = summary.chapters[0].content.match(/\[([\s\S]*)\]/);
          if (jsonMatch) {
            const parsedChapters: Chapter[] = JSON.parse(`[${jsonMatch[1]}]`);
            return {
              ...summary.toObject(),
              chapters: parsedChapters.map((chapter: Chapter) => ({
                title: String(chapter.title || "").trim(),
                content: String(chapter.content || "").trim(),
              })),
            };
          }
        } catch (error) {
          console.error("Error transforming summary:", error);
        }
      }
      return summary;
    });

    return NextResponse.json(transformedSummaries);
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
        `Please analyze this document and provide a structured chapter-wise summary. Format the response as a valid JSON array of chapters, where each chapter has a title and content. Example:
[
  {
    "title": "Chapter 1: Introduction",
    "content": "Summary of introduction..."
  },
  {
    "title": "Chapter 2: Main Concepts",
    "content": "Summary of main concepts..."
  }
]`,
      ]);

      const response = await result.response;
      const text = response.text();

      let chapters: Chapter[];
      try {
        // Parse the JSON response
        const jsonMatch = text.match(/```json\s*(\[[\s\S]*?\])\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : text;

        const parsedData = JSON.parse(jsonString);

        // Ensure we have an array of properly structured chapters
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          chapters = parsedData.map((chapter) => ({
            title: String(chapter.title || "").trim(),
            content: String(chapter.content || "").trim(),
          }));
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Failed to parse JSON response:", error);
        // Fallback parsing for non-JSON responses
        const sections = text.split(/(?=Chapter|Section|\d+\.)/g);
        chapters = sections
          .filter((section) => section.trim())
          .map((section) => {
            const lines = section.split("\n");
            return {
              title: lines[0].trim(),
              content: lines.slice(1).join("\n").trim(),
            };
          });
      }

      // Create summary document with parsed chapters
      const summary = await Summary.create({
        fileId: file._id,
        folderId,
        fileName: file.displayName,
        chapters,
      });

      summaries.push(summary);
    }

    return NextResponse.json({ data: summaries });
  } catch (error) {
    console.error("Error generating summaries:", error);
    return NextResponse.json(
      { error: "Failed to generate summaries" },
      { status: 500 }
    );
  }
}
