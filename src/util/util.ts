export const deepEquals = <T extends {}>(a: T, b: T): boolean => {
    return (Object.keys(a) as (keyof T)[]).every((key) => {
        if (
            typeof a[key] === 'object' &&
            !!a[key] &&
            typeof b[key] === 'object' &&
            !!b[key]
        ) {
            return deepEquals(a[key] as object, b[key] as object);
        } else {
            return a[key] === b[key];
        }
    });
};

export const mergeObjects = <T extends {}>(
    obj: T,
    defaultObj: Required<T>
): Required<T> => {
    return (Object.keys(defaultObj) as (keyof T)[])
        .map((o) => ({
            name: o,
            value: !!obj[o] ? obj[o] : defaultObj[o],
        }))
        .reduce(
            (prev, cur) => ({
                ...prev,
                [cur.name]: cur.value,
            }),
            {} as Required<T>
        );
};

export const unique = <T>(value: T, index: number, array: T[]): boolean => {
    return array.indexOf(value) === index;
};
