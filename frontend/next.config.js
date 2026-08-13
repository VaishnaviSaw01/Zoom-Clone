/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the API URL to be set via environment variable
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
