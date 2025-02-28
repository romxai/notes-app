import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Instance from "@/lib/models/instance";
import { withAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const type = searchParams.get("type");

    const query: any = { userId: payload.userId };
    if (folderId) query.folderId = folderId;
    if (type) query.type = type;

    const instances = await Instance.find(query).sort({ createdAt: -1 });
    return NextResponse.json(instances);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch instances" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const data = await request.json();

    // Initialize content based on instance type
    let content = {};
    if (data.type === "chat") {
      content = {
        lastMessage: null,
        messageCount: 0,
      };
    } else if (data.type === "quiz") {
      content = {
        questions: [],
        score: null,
      };
    } else if (data.type === "flashcard") {
      content = {
        cards: [],
        lastReviewed: null,
      };
    }

    const instance = await Instance.create({
      ...data,
      userId: payload.userId,
      content,
      messages: [],
    });
    return NextResponse.json(instance);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create instance" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const data = await request.json();
    const { id, ...updateData } = data;

    const instance = await Instance.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      updateData,
      { new: true }
    );

    if (!instance) {
      return NextResponse.json(
        { error: "Instance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(instance);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update instance" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Instance ID is required" },
        { status: 400 }
      );
    }

    const instance = await Instance.findOneAndDelete({
      _id: id,
      userId: payload.userId,
    });

    if (!instance) {
      return NextResponse.json(
        { error: "Instance not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Instance deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete instance" },
      { status: 500 }
    );
  }
}
