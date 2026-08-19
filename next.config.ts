import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Server Actions default to a 1MB request body limit, which is well
    // below MAX_UPLOAD_BYTES (8MB) in lib/upload-limits.ts — without this,
    // any compressed photo over ~1MB fails with a generic Next.js error
    // instead of the app's friendly "photo too large" message. 10mb gives
    // headroom above the 8MB backstop for multipart/form-data overhead.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
