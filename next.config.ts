import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/ask',
        destination: 'https://clownfish-app-sawhl.ondigitalocean.app/ask',
      },
    ];
  },
};

module.exports = nextConfig;


export default nextConfig;
