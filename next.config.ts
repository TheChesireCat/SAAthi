import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // add picsum.photos to the allowed image domains
  images: {
    domains: ["picsum.photos"],
  },
};

export default nextConfig;
