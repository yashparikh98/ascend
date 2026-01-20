import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const secret = process.env.MOONPAY_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing MoonPay secret" },
      { status: 500 }
    );
  }

  const signature = crypto
    .createHmac("sha256", secret)
    .update(url)
    .digest("base64");

  return NextResponse.json({ signature });
}
