/** @type {import('next').NextConfig} */
const nextConfig = {
  // Electron loads this as plain static files (loadFile), the same way
  // it loaded the old hand-built HTML dashboard -- no Next.js server
  // process needs to run alongside Python + Electron. Safe here since
  // there are no API routes, server actions, or middleware anywhere in
  // this app (confirmed before adding this).
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
