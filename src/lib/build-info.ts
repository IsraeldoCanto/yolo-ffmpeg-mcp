import packageJson from '../../package.json';

// Get git commit hash for development
const getGitCommit = (): string => {
  if (typeof window !== 'undefined') return 'dev'; // Client side
  
  try {
    const { execSync } = require('child_process');
    const gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return gitCommit;
  } catch {
    return 'dev';
  }
};

export const BUILD_INFO = {
  version: packageJson.version,
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT?.substring(0, 7) || getGitCommit(),
  buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER || 'local'
};

export const getBuildDisplayString = (): string => {
  const buildTime = new Date(BUILD_INFO.buildTime).toLocaleString();
  return `v${BUILD_INFO.version}-${BUILD_INFO.buildNumber} (${BUILD_INFO.gitCommit}) - ${buildTime}`;
};