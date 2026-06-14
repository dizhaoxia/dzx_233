/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3202',
    NEXT_PUBLIC_SOCKET_URL: 'http://localhost:3202'
  }
};

module.exports = nextConfig;
