import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i1.sndcdn.com", 
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", 
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;