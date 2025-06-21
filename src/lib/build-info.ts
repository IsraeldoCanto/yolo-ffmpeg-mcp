import packageJson from '../../package.json';

export const BUILD_INFO = {
  version: packageJson.version,
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT?.substring(0, 7) || 'dev',
  buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER || 'local'
};

export const getBuildDisplayString = (): string => {
  return `v${BUILD_INFO.version}-${BUILD_INFO.buildNumber} (${BUILD_INFO.gitCommit})`;
};