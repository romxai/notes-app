import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Folder from "@/lib/models/folder";
import Instance from "@/lib/models/instance";
import { withAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const folders = await Folder.find({ userId: payload.userId }).sort({
      createdAt: -1,
    });
    return NextResponse.json(folders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch folders" },
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
    const folder = await Folder.create({
      ...data,
      userId: payload.userId,
    });
    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create folder" },
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

    const folder = await Folder.findOneAndUpdate(
      { _id: id, userId: payload.userId },
      updateData,
      { new: true }
    );

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update folder" },
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
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Delete all instances associated with this folder
    await Instance.deleteMany({ folderId: id, userId: payload.userId });

    // Delete the folder
    const folder = await Folder.findOneAndDelete({
      _id: id,
      userId: payload.userId,
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Folder deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
