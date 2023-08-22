export interface GeneratorOpts {
    asyncSuffix?: string;
    syncSuffix?: string;
    customInspect?: boolean;
    targetVersion?: TargetVersion | null;
}

export const defaultGeneratorOpts: Required<GeneratorOpts> = {
    asyncSuffix: '',
    syncSuffix: 'Sync',
    customInspect: false,
    targetVersion: null,
};

export enum TargetVersion {
    /**
     * Target version 2.0.0
     */
    VER_2_0_0 = '2.0.0',
    /**
     * Target version 2.4.0
     */
    VER_2_4_0 = '2.4.0',
}
