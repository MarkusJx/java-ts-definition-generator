import { importClassAsync } from 'java-bridge';
import { ClassClass, ModifierClass } from '../util/declarations';
import { JavaClass, JavaConstructor, JavaField, JavaMethod } from './types';
import Field from './field';
import Constructor from './constructor';
import Method from './method';
import { unique } from '../util/util';
import Converter from '../conversion/converter';
import { primitiveToClassType, toObject } from '../conversion/helpers';
import { GeneratorOpts } from '../util/options';

const basicTypes = [
    /*'boolean',
    'byte',
    'char',
    'short',
    'int',
    'long',
    'float',
    'double',*/
    'void',
    /*'java.lang.Integer',
    'java.lang.Float',
    'java.lang.Double',
    'java.lang.Byte',
    'java.lang.Short',
    'java.lang.Long',
    'java.lang.Character',
    'java.lang.String',
    'java.lang.Boolean',*/
    'java.lang.Void',
    'java.lang.Object',
];

const noBasicTypes = (key: string) => !basicTypes.includes(key);
const toObjects = (key: string): string => primitiveToClassType(key);
const noArrays = (key: string) => key.replaceAll('[', '').replaceAll(']', '');

export default class Class implements JavaClass {
    private constructor(
        public readonly name: string,
        public readonly simpleName: string,
        public readonly isInterface: boolean,
        public readonly isAbstractOrInterface: boolean,
        public readonly methods: Record<string, JavaMethod[]>,
        public readonly fields: JavaField[],
        public readonly constructors: JavaConstructor[],
        public readonly imports: string[] = []
    ) {
        if (this.imports.length === 0) {
            this.updateImports();
        }
    }

    public static fromJavaClass(cls: JavaClass): Class {
        if (cls instanceof Class) {
            return cls;
        }

        return new Class(
            cls.name,
            cls.simpleName,
            cls.isInterface,
            cls.isAbstractOrInterface,
            cls.methods,
            cls.fields,
            cls.constructors,
            cls.imports
        );
    }

    private updateImports(): void {
        this.imports.length = 0;
        const imports: string[] = [];

        for (const method of Object.values(this.methods).flatMap((m) => m)) {
            imports.push(...method.parameters, method.returnType);
        }

        for (const field of this.fields) {
            imports.push(field.type);
        }

        for (const constructor of this.constructors) {
            imports.push(...constructor.parameters);
        }

        this.imports.push(
            ...imports
                .map(noArrays)
                .filter(noBasicTypes)
                .map(toObjects)
                .filter(unique)
        );
    }

    private convertMethods(converter: Converter): void {
        for (const [name, methods] of Object.entries(this.methods)) {
            converter.convertClassMethods(methods, name);
        }
    }

    public convert(opts: Required<GeneratorOpts>): string {
        const converter = new Converter(this.name, this.simpleName, opts);

        this.convertMethods(converter);
        converter.convertClassFields(this.fields);

        if (!this.isAbstractOrInterface) {
            converter.convertConstructors(this.constructors);
        }

        if (this.isInterface) {
            converter.createInterfaceDeclaration(this.methods);
        }

        return converter.createSourceText(this.isAbstractOrInterface);
    }

    public static async readClass(
        cls: ClassClass,
        name: string
    ): Promise<Class> {
        const simpleName = name.substring(name.lastIndexOf('.') + 1);

        const Modifier = await importClassAsync<typeof ModifierClass>(
            'java.lang.reflect.Modifier'
        );

        const isAbstractOrInterface =
            (await cls.isInterface()) ||
            (await Modifier.isAbstract(await cls.getModifiers()));
        const isInterface = await cls.isInterface();

        return new Class(
            name,
            simpleName,
            isInterface,
            isAbstractOrInterface,
            toObject(await Method.readMethods(cls)),
            await Field.readFields(cls),
            await Constructor.readConstructors(cls)
        );
    }
}
