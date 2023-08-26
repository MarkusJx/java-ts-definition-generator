export const isPrimitive = (type: string): boolean => {
    return [
        'boolean',
        'byte',
        'char',
        'short',
        'int',
        'long',
        'float',
        'double',
    ].includes(type);
};

export const primitiveToClassType = (type: string): string => {
    switch (type) {
        case 'boolean':
            return 'java.lang.Boolean';
        case 'byte':
            return 'java.lang.Byte';
        case 'char':
            return 'java.lang.Character';
        case 'short':
            return 'java.lang.Short';
        case 'int':
            return 'java.lang.Integer';
        case 'long':
            return 'java.lang.Long';
        case 'float':
            return 'java.lang.Float';
        case 'double':
            return 'java.lang.Double';
        default:
            return type;
    }
};

export const toObject = <T extends { name: string }>(
    val: T[]
): Record<string, T[]> => {
    const res = {} as Record<string, T[]>;
    val.forEach((v) => {
        if (Array.isArray(res[v.name])) {
            res[v.name].push(v);
        } else {
            res[v.name] = [v];
        }
    });

    return res;
};

export const getImportPath = (classname: string, importStmt: string) => {
    const thisSplit: (string | null)[] = classname.split('.');
    const importSplit: (string | null)[] = importStmt.split('.');

    for (let j = 0; j < thisSplit.length; j++) {
        if (importSplit[j] === thisSplit[j]) {
            thisSplit[j] = null;
            importSplit[j] = null;
        } else {
            break;
        }
    }

    return (
        './' +
        thisSplit
            .filter((e) => !!e)
            .map(() => '')
            .join('../') +
        importSplit.filter((e) => !!e).join('/')
    );
};

export const getSimpleName = (i: string) => i.substring(i.lastIndexOf('.') + 1);

export const hashMapToRecord = <T>(
    input: Record<string, T>
): Record<string, T> => {
    //console.time('hashMapToRecord');
    try {
        if (
            Object.hasOwn(input, 'keySetSync') &&
            typeof input['keySetSync'] === 'function'
        ) {
            const res = {} as Record<string, T>;
            // @ts-ignore
            const keys: string[] = input.keySetSync().toArraySync();
            for (const name of keys) {
                // @ts-ignore
                const val = input.getSync(name);
                res[name] = val;
            }

            return res;
        } else {
            return input;
        }
    } finally {
        //console.timeEnd('hashMapToRecord');
    }
};
