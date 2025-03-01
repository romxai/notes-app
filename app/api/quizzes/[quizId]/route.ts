import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Quiz from "@/lib/models/quiz";
import { withAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) return payload;

    await dbConnect();
    const quiz = await Quiz.findById(params.quizId);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
} 