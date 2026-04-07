// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["i.pravatar.cc", "iqa3-media-storage.s3.eu-north-1.amazonaws.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iqa3-media-storage.s3.eu-north-1.amazonaws.com",
      },
    ],
  },
};

module.exports = nextConfig;
