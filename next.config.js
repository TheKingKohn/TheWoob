/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	output: "standalone",
	images: {
		remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
		domains: ["localhost"],
		unoptimized: true,
	},
};
module.exports = nextConfig;
