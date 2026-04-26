import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Firebase is transpiled as a single module instance across
  // server and client bundles — prevents the "Expected type 'Firestore$1'"
  // error caused by Turbopack creating separate module copies.
  transpilePackages: ["firebase"],
  // For Turbopack (dev mode)
  turbopack: {
    root: "/Users/jingwei/Desktop/side-project/health-tracker",
  },
  // For standard Next.js builds
  outputFileTracingRoot: "/Users/jingwei/Desktop/side-project/health-tracker",
};

export default nextConfig;
