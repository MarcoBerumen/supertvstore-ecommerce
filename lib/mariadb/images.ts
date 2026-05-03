import { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 7 days — the AWS-imposed maximum for SigV4 presigned URLs. Pages built from
// these URLs are cached by Next for at most ~1h (see cacheLife in queries/), so
// the URL we hand out always outlives the cache entry that contains it.
const PRESIGN_TTL_SECONDS = 60 * 60 * 24 * 7;

let cachedClient: S3Client | null = null;

function s3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const region = process.env.AWS_S3_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 env not configured: set AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY",
    );
  }
  cachedClient = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

export function firstImagePath(images: string | null | undefined): string | null {
  if (!images) return null;
  const first = images.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

export async function presignProductImage(
  rawPath: string | null | undefined,
): Promise<string | null> {
  if (!rawPath) return null;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: rawPath });
  return getSignedUrl(s3Client(), cmd, { expiresIn: PRESIGN_TTL_SECONDS });
}

export async function presignProductImages(
  rawPaths: string[],
): Promise<string[]> {
  const out = await Promise.all(rawPaths.map((p) => presignProductImage(p)));
  return out.filter((u): u is string => u !== null);
}
