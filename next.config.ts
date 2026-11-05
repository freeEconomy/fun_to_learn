import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  outputFileTracingExcludes: { '/*': ['./data/**/*', './backups/**/*', './.env*'] },
  async rewrites() {
    return [{ source: '/architecture', destination: '/architecture.html' }];
  },
};
export default config;
