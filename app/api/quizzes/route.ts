import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import File from "@/lib/models/file";
import Quiz from "@/lib/models/quiz";
import { withAuth } from "@/lib/auth";
import mongoose from "mongoose";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  sourceFileId?: mongoose.Types.ObjectId;
}

interface FileQuizData {
  title: string;
  questions: QuizQuestion[];
}

export async function GET(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) return payload;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId");

    if (!instanceId) {
      return NextResponse.json(
        { error: "Instance ID is required" },
        { status: 400 }
      );
    }

    const quiz = await Quiz.findOne({ instanceId });
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) return payload;

    await dbConnect();
    const { fileIds, folderId, instanceId } = await request.json();
    console.log("Received quiz generation request:", {
      fileIds,
      folderId,
      instanceId,
    });

    // Get all files from database
    const files = await File.find({ _id: { $in: fileIds } });
    if (files.length === 0) {
      console.error("No files found for IDs:", fileIds);
      return NextResponse.json({ error: "Files not found" }, { status: 404 });
    }
    console.log(
      "Found files:",
      files.map((f) => f.displayName)
    );

    // Generate quiz for each file
    const allQuestions: QuizQuestion[] = [];
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    for (const file of files) {
      console.log(`Processing file: ${file.displayName}`);
      const fileData = await fileManager.getFile(file.name);

      // Generate quiz using Gemini
      const result = await model.generateContent([
        {
          fileData: {
            fileUri: fileData.uri,
            mimeType: file.mimeType,
          },
        },
        `Generate a well-structured JSON output for a multiple-choice quiz designed for studying and revision. Ensure the output strictly follows this format:
        {
          "title": "Quiz Title Here",
          "questions": [
            {
              "id": 1,
              "question": "Question text here?",
              "options": [
                { "id": "a", "text": "Option A text" },
                { "id": "b", "text": "Option B text" },
                { "id": "c", "text": "Option C text" },
                { "id": "d", "text": "Option D text" }
              ],
              "correctAnswer": "b"
            }
          ]
        }
        Guidelines:
        - The title should be relevant to the subject matter in the document
        - Each question must have four multiple-choice options labeled "a", "b", "c", and "d"
        - The correctAnswer field must store the correct option's letter
        - Generate a balanced mix of conceptual and factual questions
        - Keep the structure consistent for easy parsing
        - Generate at least 5 questions`,
      ]);

      const response = await result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : text;
        const fileQuizData = JSON.parse(jsonString) as FileQuizData;

        // Add source file ID to each question
        const questionsWithSource = fileQuizData.questions.map((q) => ({
          ...q,
          sourceFileId: file._id,
        }));
        allQuestions.push(...questionsWithSource);
      } catch (error) {
        console.error(
          `Failed to parse quiz data for file ${file.displayName}:`,
          error
        );
      }
    }

    // Create combined quiz
    const quizData = {
      title: `Quiz on ${files.length} Document${files.length > 1 ? "s" : ""}`,
      questions: allQuestions.map((q, idx) => ({ ...q, id: idx + 1 })),
      fileIds: fileIds,
      fileId: fileIds[0], // Set the first file as the primary fileId for backward compatibility
      folderId,
      instanceId,
    };

    // Create quiz in database
    console.log("Creating quiz in database with data:", quizData);
    const quiz = await Quiz.create(quizData);
    console.log("Quiz created successfully:", quiz);

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      {
        error: "Failed to generate quiz",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
