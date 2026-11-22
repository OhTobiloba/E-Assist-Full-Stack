/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // INPUT NEEDED (later, Phase 1+ with real backend): if profile photos / task photos are served
  // from Cloudinary and you use <Image>, add the domain here, e.g.
  // images: { remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }] },
};
export default nextConfig;
