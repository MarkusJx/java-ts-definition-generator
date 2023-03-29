import isCi from 'is-ci';

export const shouldIncreaseTimeout =
    isCi &&
    (process.arch === 'arm64' ||
        process.arch === 'arm' ||
        process.env.INCREASE_TIMEOUT === 'true');
export const forceRunAllTests = process.env.FORCE_RUN_ALL_TESTS === 'true';
