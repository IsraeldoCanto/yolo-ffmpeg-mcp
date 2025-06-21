import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_NUMBER: process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || 'local',
    NEXT_PUBLIC_GIT_COMMIT: process.env.GITHUB_SHA || process.env.GIT_COMMIT || 'dev',
  },
};

export default nextConfig;
