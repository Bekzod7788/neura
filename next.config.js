/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false,        // Turbopack o‘rniga Webpack ishlatamiz
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Brauzer tomonida keraksiz Node modullarini bo‘shatib qo‘yamiz
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
