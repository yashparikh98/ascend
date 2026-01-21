const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Stub optional pretty logger deps pulled by walletconnect/pino so build doesn't fail
      "pino-pretty": path.join(__dirname, "lib/pino-pretty-stub.js"),
      "pino-abstract-transport": path.join(
        __dirname,
        "lib/pino-pretty-stub.js"
      )
    };
    return config;
  }
};

module.exports = nextConfig;
