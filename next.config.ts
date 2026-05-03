import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.AWS_S3_BUCKET ?? "supertvstoreapp"}.s3.${process.env.AWS_S3_REGION ?? "us-west-1"}.amazonaws.com`,
      },
    ],
  },
};

export default nextConfig;
