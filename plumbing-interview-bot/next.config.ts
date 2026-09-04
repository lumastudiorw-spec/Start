import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a subdirectory alongside an unrelated sibling project
  // that has its own lockfile at the repo root — pin the workspace root
  // explicitly so Next.js/Turbopack doesn't have to guess.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
