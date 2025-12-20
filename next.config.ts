import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  typescript: {
    ignoreBuildErrors: true,
  },
  // cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
