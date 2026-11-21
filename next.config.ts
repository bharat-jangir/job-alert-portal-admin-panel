import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BACKEND_API_BASE_URL: process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

export default nextConfig;
