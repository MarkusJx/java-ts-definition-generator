import { JavaClass, JavaInterfaceProxy } from 'java-bridge';
import { JavaClass as JavaClassDef } from '../ast/types';

export declare class EitherClass<A, B> extends JavaClass {
    private readonly a?: A;
    private readonly b?: B;

    public static left<C, D>(c: C): Promise<EitherClass<C, D>>;
    public static right<C, D>(d: D): Promise<EitherClass<C, D>>;
}

export declare class DefinitionsClass extends JavaClass {
    public static createSyntaxTree(
        classname: string[],
        resolvedImports: string[],
        callback: EitherCallback | null
    ): Promise<DefinitionsClass>;

    public toJson(): Promise<string>;
    public toJsonSync(): string;
}

export declare interface ConsumerProxy<T extends string | JavaClassDef> {
    accept(value: T): void;
}

export type EitherCallback = EitherClass<
    JavaInterfaceProxy<ConsumerProxy<string>>,
    JavaInterfaceProxy<ConsumerProxy<JavaClassDef>>
>;
