import { readFileSync } from "fs";
import { S3Client, ListObjectsV2Command, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.split("=")[0].trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = env;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
  console.error("Missing one or more AWS env vars in .env.local");
  process.exit(1);
}

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
});

console.log(`Bucket : ${AWS_S3_BUCKET}`);
console.log(`Region : ${AWS_REGION}`);
console.log(`Key ID : ${AWS_ACCESS_KEY_ID.slice(0, 4)}…${AWS_ACCESS_KEY_ID.slice(-4)}\n`);

// 1. Bucket reachable
process.stdout.write("1. HeadBucket (credentials + bucket exist)… ");
try {
  await s3.send(new HeadBucketCommand({ Bucket: AWS_S3_BUCKET }));
  console.log("OK");
} catch (e) {
  console.log(`FAIL — ${e.message}`);
  process.exit(1);
}

// 2. List up to 5 objects
process.stdout.write("2. ListObjectsV2 (read permission)… ");
let firstKey = null;
try {
  const res = await s3.send(new ListObjectsV2Command({ Bucket: AWS_S3_BUCKET, MaxKeys: 5 }));
  const keys = (res.Contents ?? []).map((o) => o.Key);
  firstKey = keys[0] ?? null;
  if (keys.length === 0) {
    console.log("OK — bucket is empty");
  } else {
    console.log(`OK — ${res.KeyCount} object(s) found`);
    keys.forEach((k) => console.log(`   • ${k}`));
  }
} catch (e) {
  console.log(`FAIL — ${e.message}`);
  process.exit(1);
}

// 3. Generate a presigned URL (no network call to object, just signs)
process.stdout.write("3. GetSignedUrl (presigner works)… ");
const testKey = firstKey ?? "test-placeholder.mp4";
try {
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: AWS_S3_BUCKET, Key: testKey }),
    { expiresIn: 60 }
  );
  const preview = url.slice(0, 80) + "…";
  console.log(`OK\n   ${preview}`);
} catch (e) {
  console.log(`FAIL — ${e.message}`);
  process.exit(1);
}

console.log("\nAll checks passed. S3 is wired up correctly.");
