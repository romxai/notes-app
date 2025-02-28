import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user";
import { withAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const payload = await withAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    await dbConnect();
    const user = await User.findById(payload.userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
