import { lt } from 'semver';
import { defaultGeneratorOpts, GeneratorOpts, TargetVersion } from './options';
import { mergeObjects } from './util';

export const javaBridgeVersion = require('java-bridge/package.json').version;

export const parseVersion = (version: string): TargetVersion => {
    if (lt(version, TargetVersion.VER_2_4_0)) {
        return TargetVersion.VER_2_0_0;
    } else {
        return TargetVersion.VER_2_4_0;
    }
};

const checkAllowedOptions = (
    opts: GeneratorOpts,
    version: string,
    disallowedOpts: (keyof Exclude<GeneratorOpts, 'targetVersion'>)[]
) => {
    for (const key of disallowedOpts) {
        if (opts[key] !== undefined || opts[key] !== null) {
            throw new Error(
                `Option '${key}' is not compatible with target version ${version}`
            );
        }
    }
};

export const checkOptionsForVersion = (opts: GeneratorOpts) => {
    const version = opts.targetVersion || javaBridgeVersion;
    const parsedVersion = parseVersion(version);

    switch (parsedVersion) {
        case TargetVersion.VER_2_0_0:
            checkAllowedOptions(opts, version, [
                'asyncSuffix',
                'customInspect',
                'syncSuffix',
            ]);
            break;
    }
};

export const checkAndMergeOptions = (
    opts: GeneratorOpts
): Required<GeneratorOpts> => {
    checkOptionsForVersion(opts);
    return mergeObjects(opts, defaultGeneratorOpts);
};
