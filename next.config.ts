import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  async redirects() {
    // Routes from the placeholder site, kept alive for any links in the wild.
    return [
      { source: "/lakewood-ranch", destination: "/neighborhoods?market=lakewood-ranch", permanent: true },
      { source: "/lakewood-ranch/:slug", destination: "/neighborhoods/:slug", permanent: true },
      { source: "/relocate", destination: "/buy", permanent: true },
    ];
  },
};

export default nextConfig;
