import { importClassAsync } from 'java-bridge';
import { ClassClass, ModifierClass } from '../util/declarations';
import {
    JavaClassDefinition,
    JavaConstructorDefinition,
    JavaFieldDefinition,
    JavaMethodDefinition,
} from './types';
import JavaField from './JavaField';
import JavaConstructor from './JavaConstructor';
import JavaMethod from './JavaMethod';
import { unique } from '../util/util';
import Converter from '../conversion/converter';
import {
    isPrimitive,
    noArrays,
    nonPrimitive,
    notObjectOrVoid,
    primitiveToClassType,
    toObject,
} from '../conversion/helpers';
import { GeneratorOpts } from '../util/options';

export default class JavaClass implements JavaClassDefinition {
    public readonly imports: string[];

    private constructor(
        public readonly name: string,
        public readonly simpleName: string,
        public readonly isInterface: boolean,
        public readonly isAbstractOrInterface: boolean,
        public readonly methods: Record<string, JavaMethodDefinition[]>,
        public readonly fields: JavaFieldDefinition[],
        public readonly constructors: JavaConstructorDefinition[],
        imports?: string[]
    ) {
        if (imports) {
            this.imports = imports;
        } else {
            this.imports = this.calculateImports();
        }
    }

    public static fromJavaClass(cls: JavaClassDefinition): JavaClass {
        if (cls instanceof JavaClass) {
            return cls;
        }

        return new JavaClass(
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

    private calculateImports(): string[] {
        return Object.values(this.methods)
            .flatMap((m) => m)
            .flatMap((m) =>
                isPrimitive(m.returnType)
                    ? m.parameters
                    : m.parameters.concat(m.returnType)
            )
            .concat(this.fields.map((f) => f.type).filter(nonPrimitive))
            .concat(this.constructors.flatMap((c) => c.parameters))
            .map(noArrays)
            .filter(notObjectOrVoid)
            .map(primitiveToClassType)
            .filter((s) => s !== this.name)
            .filter(unique);
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
    ): Promise<JavaClass> {
        const simpleName = name.substring(name.lastIndexOf('.') + 1);

        const Modifier = await importClassAsync<typeof ModifierClass>(
            'java.lang.reflect.Modifier'
        );

        const isAbstractOrInterface =
            (await cls.isInterface()) ||
            (await Modifier.isAbstract(await cls.getModifiers()));
        const isInterface = await cls.isInterface();

        return new JavaClass(
            name,
            simpleName,
            isInterface,
            isAbstractOrInterface,
            toObject(await JavaMethod.readMethods(cls)),
            await JavaField.readFields(cls),
            await JavaConstructor.readConstructors(cls)
        );
    }
}
