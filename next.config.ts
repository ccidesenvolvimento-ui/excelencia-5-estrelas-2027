import type { NextConfig } from "next";

const pages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "github-pages";
const basePath = pages ? "/excelencia-5-estrelas-2027" : "";

const nextConfig: NextConfig = {
  ...(pages ? { output: "export" as const, basePath, trailingSlash: true } : {}),
  images: { unoptimized: true },
};

export default nextConfig;
