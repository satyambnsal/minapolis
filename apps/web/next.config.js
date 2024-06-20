/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['oqymtqolwjujkayjyxdt.supabase.co'],
},
  reactStrictMode: true,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
}

module.exports = nextConfig
