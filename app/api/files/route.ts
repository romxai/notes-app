import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import dbConnect from "@/lib/db";
import File from "@/lib/models/file";
import { withAuth } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log("Starting file upload process...");
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;

    if (!file || !folderId) {
      console.error("Missing required fields:", {
        file: !!file,
        folderId: !!folderId,
      });
      return NextResponse.json(
        { error: "File and folder ID are required" },
        { status: 400 }
      );
    }

    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Create temporary directory if it doesn't exist
    const tempDir = path.join(process.cwd(), "/tmp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Generate a unique filename
    const tempFilePath = path.join(tempDir, `${uuidv4()}-${file.name}`);
    console.log("Temporary file path:", tempFilePath);

    try {
      // Convert File to Buffer and write to temporary file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(tempFilePath, buffer);
      console.log("File written to temporary location");

      // Upload to Google AI File Manager
      console.log("Uploading to Google AI File Manager...");
      const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: file.type,
        displayName: file.name,
      });
      console.log("Upload successful:", uploadResult);

      // Get file details
      console.log("Fetching uploaded file details...");
      const getResponse = await fileManager.getFile(uploadResult.file.name);
      console.log("File details retrieved:", {
        name: getResponse.name,
        displayName: getResponse.displayName,
        uri: getResponse.uri,
      });

      // Store file reference in database
      console.log("Storing file reference in database...");
      const fileDoc = await File.create({
        name: uploadResult.file.name,
        displayName: file.name,
        mimeType: file.type,
        fileUri: uploadResult.file.uri,
        folderId,
        userId: payload.userId,
        size: file.size,
      });
      console.log("File reference stored in database");

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
      console.log("Temporary file cleaned up");

      return NextResponse.json(fileDoc);
    } catch (error) {
      console.error("Error during file processing:", error);
      // Clean up temporary file if it exists
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log("Cleaned up temporary file after error");
      }
      throw error;
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching files...");
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      console.error("Missing folderId in request");
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    console.log("Querying database for files in folder:", folderId);
    const files = await File.find({
      folderId,
      userId: payload.userId,
    }).sort({ uploadedAt: -1 });

    console.log(`Found ${files.length} files`);
    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
