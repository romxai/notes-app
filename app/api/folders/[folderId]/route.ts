// app/api/folders/[folderId]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Folder from "@/lib/models/folder";
import { withAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    console.log("Fetching folder details for:", params.folderId);
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const folder = await Folder.findOne({
      _id: params.folderId,
      userId: payload.userId,
    });

    if (!folder) {
      console.error("Folder not found:", params.folderId);
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    console.log("Found folder:", folder);
    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Failed to fetch folder" },
      { status: 500 }
    );
  }
}
