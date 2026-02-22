import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // ajustar al bucket de almacenamiento en producción
      },
    ],
  },
};

export default nextConfig;
