import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user";
import { signJWT } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log("Connected to MongoDB");
    const { email, password } = await request.json();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signJWT({
      userId: user._id,
      email: user.email,
      username: user.username,
    });

    // Set cookie
    cookies().set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    // Return user data without password
    return NextResponse.json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error); // Log the error
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
