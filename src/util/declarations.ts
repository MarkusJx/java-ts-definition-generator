import { JavaClass } from 'java-bridge';

export declare class ModifierClass extends JavaClass {
    public static isPublic(val: number): Promise<boolean>;
    public static isStatic(val: number): Promise<boolean>;
    public static isStaticSync(val: number): boolean;
    public static isFinal(val: number): Promise<boolean>;
    public static isAbstract(val: number): Promise<boolean>;
}

export declare class TypeClass extends JavaClass {
    public getTypeName(): Promise<string>;
}

/**
 * @ignore
 */
export declare class DeclaredMethodClass extends JavaClass {
    public getModifiers(): Promise<number>;
    public getName(): Promise<string>;
    public getReturnType(): Promise<TypeClass>;
    public getParameterTypes(): Promise<TypeClass[]>;
    public isDefault(): Promise<boolean>;
}

/**
 * @ignore
 */
export declare class DeclaredConstructorClass extends JavaClass {
    public getModifiers(): Promise<number>;
    public getParameterTypes(): Promise<TypeClass[]>;
}

/**
 * @ignore
 */
export declare class ClassClass extends JavaClass {
    public getMethods(): Promise<DeclaredMethodClass[]>;
    public getDeclaredConstructors(): Promise<DeclaredConstructorClass[]>;
    public getFields(): Promise<FieldClass[]>;
    public getModifiers(): Promise<number>;
    public isInterface(): Promise<boolean>;
    public isInterfaceSync(): boolean;
}

/**
 * @ignore
 */
export declare class FieldClass extends JavaClass {
    public getModifiers(): Promise<number>;
    public getName(): Promise<string>;
    public getNameSync(): string;
    public getType(): Promise<TypeClass>;
}
