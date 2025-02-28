import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user";

export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log("Connected to MongoDB");
    const data = await request.json();
    console.log("Data:", data);

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
    });

    // Remove password from response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: error.message },
      { status: 500 }
    );
  }
}
