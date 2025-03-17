/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true, // Add trailing slashes for better static export compatibility
  // We're not using exportPathMap anymore to allow for dynamic routes
}

export default nextConfig

