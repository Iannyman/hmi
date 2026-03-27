/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Note: Cross-origin warnings for local network access are informational only.
   * The app works fine from other devices on your network.
   * This will be configurable in future Next.js versions. */

  // Explicitly mark packages as external to prevent bundling issues
  serverExternalPackages: ['node-opcua'],

  // Experimental settings for Next.js 16 stability
  experimental: {
    // Ensure server-only code doesn't leak to client
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
