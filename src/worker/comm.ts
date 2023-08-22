export interface Args {
    classnames: string[];
    output: string;
    classpath?: string | string[];
    syncSuffix?: string;
    asyncSuffix?: string;
    customInspect?: boolean;
    targetVersion?: string;
}

interface Message {
    type: string;
}

export interface StartMessage extends Message {
    type: 'start';
    args: Args;
}

export interface UpdateSpinner extends Message {
    type: 'updateSpinner';
    args: {
        text?: string;
        lastClassResolved: string;
        resolvedCounter: number;
        numResolved: number;
        resolvedImports: string[];
    };
}

export interface DoneMessage extends Message {
    type: 'done';
}

export interface StartSpinner extends Message {
    type: 'startSpinner';
}

export interface ErrorMessage extends Message {
    type: 'error';
    error: any;
}

export type CommMessage =
    | StartMessage
    | UpdateSpinner
    | DoneMessage
    | StartSpinner
    | ErrorMessage;
