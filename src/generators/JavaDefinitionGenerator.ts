import {
    JavaInterfaceProxy,
    classpath,
    importClass,
    newProxy,
} from 'java-bridge';
import { ModuleDeclaration } from '../TypescriptDefinitionGenerator';
import { JavaClass, JavaDefinitions } from '../ast/types';
import {
    ConsumerProxy,
    DefinitionsClass,
    EitherCallback,
    EitherClass,
} from './javaClasses';
import Class from '../ast/class';
import path from 'path';
import { GeneratorOpts } from '../util/options';
import {
    ConvertCallback,
    DefinitionGenerator,
    DefinitionGeneratorIf,
} from './DefinitionGenerator';

export class JavaDefinitionGenerator
    extends DefinitionGenerator
    implements DefinitionGeneratorIf
{
    private static _either: typeof EitherClass | null = null;
    private static _javaDefinitions: typeof DefinitionsClass | null = null;

    public constructor(
        classnames: string | string[],
        opts: Required<GeneratorOpts>,
        resolvedClasses: string[] = []
    ) {
        super(classnames, opts, resolvedClasses);
    }

    public async createModuleDeclaration(
        callback?: ConvertCallback | null | undefined
    ): Promise<ModuleDeclaration[]> {
        const res: ModuleDeclaration[] = [];
        const consumer = JavaDefinitionGenerator.createConsumer((cls) => {
            if (callback) {
                callback(cls.name);
            }

            res.push({
                name: cls.name,
                contents: cls.convert(this.opts),
            });
        });

        const javaCallback: EitherCallback =
            await JavaDefinitionGenerator.either.left(consumer);

        await JavaDefinitionGenerator.javaDefinitions.createSyntaxTree(
            this.classnames,
            this.resolvedClasses,
            javaCallback
        );
        consumer.reset();

        return res;
    }

    public async createDefinitionTree(
        callback?: ConvertCallback | null | undefined
    ): Promise<JavaDefinitions> {
        let consumer: JavaInterfaceProxy<ConsumerProxy<string>> | null = null;
        let javaCallback: EitherCallback | null = null;

        if (callback) {
            consumer = JavaDefinitionGenerator.createConsumer((cls) => {
                if (callback) {
                    callback(cls.name);
                }
            });

            javaCallback = await JavaDefinitionGenerator.either.left(consumer);
        }

        const res =
            await JavaDefinitionGenerator.javaDefinitions.createSyntaxTree(
                this.classnames,
                this.resolvedClasses,
                javaCallback
            );
        consumer?.reset();

        return JSON.parse(await res.toJson());
    }

    private static createConsumer(
        callback: (cur: Class) => void
    ): JavaInterfaceProxy<ConsumerProxy<string>> {
        return newProxy<ConsumerProxy<string>>('java.util.function.Consumer', {
            accept: (value) => {
                const parsed: JavaClass = JSON.parse(value);
                const cls = Class.fromJavaClass(parsed);

                callback(cls);
            },
        });
    }

    private static ensureImports(): void {
        if (!this._either || !this._javaDefinitions) {
            const jar = path.join(__dirname, 'ASTGenerator.jar');

            classpath.append(jar);
            if (!classpath.get().includes(jar)) {
                throw new Error('Failed to load jar for fast type converter');
            }

            this._either = importClass<typeof EitherClass>(
                'com.github.markusjx.util.Either'
            );
            this._javaDefinitions = importClass<typeof DefinitionsClass>(
                'com.github.markusjx.ast.Definitions'
            );
        }
    }

    private static get either(): typeof EitherClass {
        this.ensureImports();
        return this._either!;
    }

    private static get javaDefinitions(): typeof DefinitionsClass {
        this.ensureImports();
        return this._javaDefinitions!;
    }
}
