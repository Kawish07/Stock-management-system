import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The route handler at src/app/api/erpnext/[...path]/route.ts handles all
   * proxying with cookie stripping (removes Secure/Domain so cookies work over
   * HTTP on localhost). No rewrites needed — they would bypass the route handler
   * and forward ERPNext's raw Secure cookies directly to the browser.
   */

  images: {
    remotePatterns: [
      // Allow ERPNext-hosted user images
      ...(process.env.ERPNEXT_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.ERPNEXT_URL).hostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
