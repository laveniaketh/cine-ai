import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: true, data: "Vapi generate route works!" },
    { status: 200 }
  );
}
