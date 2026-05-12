import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const VIDEO_EXTS = [".mp4", ".mov", ".m4v", ".avi", ".mkv"];

export async function GET() {
  const res = await s3.send(
    new ListObjectsV2Command({ Bucket: process.env.AWS_S3_BUCKET! })
  );

  const keys = (res.Contents ?? [])
    .map((o) => o.Key!)
    .filter((k) => VIDEO_EXTS.some((ext) => k.toLowerCase().endsWith(ext)));

  return NextResponse.json({ keys });
}
