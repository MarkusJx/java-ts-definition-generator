import {
    JavaInterfaceProxy,
    classpath,
    importClass,
    newProxy,
} from 'java-bridge';
import { JavaClassDefinition, JavaClassDefinitions } from '../ast/types';
import {
    ConsumerProxy,
    DefinitionsClass,
    EitherCallback,
    EitherClass,
} from './javaClasses';
import JavaClass from '../ast/JavaClass';
import path from 'path';
import {
    DefinitionGenerator,
    DefinitionGeneratorIf,
} from './DefinitionGenerator';
import { ConvertCallback, ModuleDeclaration } from '../types';

/**
 * A class which can be used to generate typescript definitions
 * for Java classes. This class will use a java library to evaluate
 * the java class declarations. This is much faster than
 * {@link TsDefinitionGenerator}, but requires Java 16 or higher.
 *
 * If a method from this class is called when the java library
 * is not available, an error will be thrown. The java library
 * may not be available if the java version is lower than 11
 * or if the library could not be found.
 *
 * The library is loaded from the file `ASTGenerator.jar` in the
 * `dist` directory once a method is called.
 *
 * @see {@link TsDefinitionGenerator}
 */
export class JavaDefinitionGenerator
    extends DefinitionGenerator
    implements DefinitionGeneratorIf
{
    private static _either: typeof EitherClass | null = null;
    private static _javaDefinitions: typeof DefinitionsClass | null = null;

    public async createModuleDeclarations(
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
    ): Promise<JavaClassDefinitions> {
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
        callback: (cur: JavaClass) => void
    ): JavaInterfaceProxy<ConsumerProxy<string>> {
        return newProxy<ConsumerProxy<string>>('java.util.function.Consumer', {
            accept: (value) => {
                const parsed: JavaClassDefinition = JSON.parse(value);
                const cls = JavaClass.fromJavaClass(parsed);

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
