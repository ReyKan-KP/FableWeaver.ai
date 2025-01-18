/** @type {import('next').NextConfig} */
const nextConfig = {
  // rewrites: async () => {
  //   return [
  //     {
  //       source: "/api/py/:path*",
  //       destination:
  //         process.env.NODE_ENV === "development"
  //           ? "http://127.0.0.1:8000/api/py/:path*"
  //           : "/api/",
  //     },
  //     {
  //       source: "/docs",
  //       destination:
  //         process.env.NODE_ENV === "development"
  //           ? "http://127.0.0.1:8000/api/py/docs"
  //           : "/api/py/docs",
  //     },
  //     {
  //       source: "/openapi.json",
  //       destination:
  //         process.env.NODE_ENV === "development"
  //           ? "http://127.0.0.1:8000/api/py/openapi.json"
  //           : "/api/py/openapi.json",
  //     },
  //   ];
  // },
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api-cdn.myanimelist.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.myanimelist.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.kitsu.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**", // This allows any hostname
      },
    ],
  },
};

module.exports = nextConfig;
