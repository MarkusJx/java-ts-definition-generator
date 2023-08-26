import { getJavaVersionSync } from 'java-bridge';
import path from 'path';
import { JavaClassDefinitions } from './ast/types';
import { DefinitionGeneratorIf } from './generators/DefinitionGenerator';
import { JavaDefinitionGenerator } from './generators/JavaDefinitionGenerator';
import { TsDefinitionGenerator } from './generators/TsDefinitionGenerator';
import { GeneratorOpts } from './util/options';
import fs from 'fs';
import { ConvertCallback, ModuleDeclaration } from './types';

/**
 * A class to generate typescript definitions for java classes.
 * Converts the given class and all of its dependencies to typescript.
 *
 * This is a wrapper around the {@link JavaDefinitionGenerator} and
 * {@link TsDefinitionGenerator} instances. A valid instance can either
 * be manually passed to the constructor or will be chosen based on
 * the current java version, as {@link JavaDefinitionGenerator}
 * requires Java 16 or higher.
 *
 * ## Example
 * ```ts
 * import { TypescriptDefinitionGenerator } from 'java-ts-definition-generator';
 *
 * const generator = new TypescriptDefinitionGenerator('java.lang.String');
 * // Generate the typescript definitions
 * await generator.generate();
 *
 * // Save the definitions to a directory
 * await generator.save('./project');
 * ```
 */
export default class TypescriptDefinitionGenerator
    implements DefinitionGeneratorIf
{
    /**
     * The {@link DefinitionGeneratorIf} instance,
     * which is used to generate the typescript definitions.
     */
    public readonly impl: DefinitionGeneratorIf;

    /**
     * The typescript module declarations generated
     * by {@link createModuleDeclarations}.
     */
    public generatedDeclarations: ModuleDeclaration[] | null = null;

    /**
     * Create a {@link TypescriptDefinitionGenerator} instance from another
     * {@link DefinitionGeneratorIf} instance. Currently, the passed instance
     * can either be a {@link JavaDefinitionGenerator} or a {@link TsDefinitionGenerator},
     * but custom implementations are also possible.
     *
     * ## Example
     * ```ts
     * import {
     *   TypescriptDefinitionGenerator,
     *   JavaDefinitionGenerator
     * } from 'java-ts-definition-generator';
     *
     * const generator = new TypescriptDefinitionGenerator(
     *   new JavaDefinitionGenerator('java.lang.String')
     * );
     * ```
     *
     * @param impl the instance to create the {@link TypescriptDefinitionGenerator} from
     */
    public constructor(impl: DefinitionGeneratorIf);

    /**
     * Create a {@link TypescriptDefinitionGenerator} instance using the
     * implementation chosen by {@link getImpl}.
     *
     * ## Example
     * ```ts
     * import { TypescriptDefinitionGenerator } from 'java-ts-definition-generator';
     *
     * const generator = new TypescriptDefinitionGenerator('java.lang.String');
     * ```
     *
     * @see {@link getImpl}
     * @param classnames the names of the classes to resolve
     * @param opts the import options
     * @param resolvedClasses the full names of any previously resolved classes
     */
    public constructor(
        classnames: string | string[],
        opts?: GeneratorOpts,
        resolvedClasses?: string[]
    );

    public constructor(
        classnamesOrImpl: string | string[] | DefinitionGeneratorIf,
        opts: GeneratorOpts = {},
        resolvedClasses: string[] = []
    ) {
        if (
            typeof classnamesOrImpl === 'object' &&
            !Array.isArray(classnamesOrImpl)
        ) {
            this.impl = classnamesOrImpl;
        } else {
            this.impl = TypescriptDefinitionGenerator.getImpl(
                classnamesOrImpl,
                opts,
                resolvedClasses
            );
        }
    }

    /**
     * Get a {@link DefinitionGeneratorIf} instance, which matches the
     * current system properties. Will return an instance of
     * {@link JavaDefinitionGenerator} if the version of the currently
     * used JVM is greater than or equal to 16, a {@link TsDefinitionGenerator}
     * instance will be returned otherwise.
     *
     * This does not guarantee the returned instance will actually work,
     * {@link JavaDefinitionGenerator} may not work in all cases. Consult
     * the documentation of that class for further information.
     *
     * This method should also not be called directly, the constructor
     * of {@link TypescriptDefinitionGenerator} should be used insted.
     *
     * @param classnames the names of the classes to resolve
     * @param opts the import options
     * @param resolvedClasses the full names of any previously resolved classes
     * @returns the {@link DefinitionGeneratorIf} instance
     */
    public static getImpl(
        classnames: string | string[],
        opts: GeneratorOpts = {},
        resolvedClasses: string[] = []
    ): DefinitionGeneratorIf {
        const version = Number(getJavaVersionSync().split('.')[0]);

        if (version >= 16) {
            return new JavaDefinitionGenerator(
                classnames,
                opts,
                resolvedClasses
            );
        } else {
            return new TsDefinitionGenerator(classnames, opts, resolvedClasses);
        }
    }

    public async createModuleDeclarations(
        callback?: ConvertCallback | null | undefined
    ): Promise<ModuleDeclaration[]> {
        this.generatedDeclarations =
            await this.impl.createModuleDeclarations(callback);
        return this.generatedDeclarations;
    }

    public createDefinitionTree(
        callback?: ConvertCallback | null | undefined
    ): Promise<JavaClassDefinitions> {
        return this.impl.createDefinitionTree(callback);
    }

    /**
     * Save the converted classes to the given directory.
     * This requires {@link createModuleDeclarations} to be called first.
     * An error will be thrown if that method has not been called first.
     *
     * @throws if {@link createModuleDeclaration} has not been called yet
     * @param sourceDir the directory to save the files to
     */
    public save(sourceDir: string): Promise<void> {
        if (!this.generatedDeclarations) {
            throw new Error(
                "No declarations have been generated yet, call 'createModuleDeclaration' first"
            );
        }

        return TypescriptDefinitionGenerator.save(
            this.generatedDeclarations,
            sourceDir
        );
    }

    /**
     * Save the converted classes to the given directory.
     *
     * @param declarations the declarations to save
     * @param sourceDir the directory to save the files to
     */
    public static async save(
        declarations: ModuleDeclaration[],
        sourceDir: string
    ): Promise<void> {
        for (const declaration of declarations) {
            const p = declaration.name.split('.');
            p[p.length - 1] = p[p.length - 1] + '.ts';

            const filePath = path.join(sourceDir, ...p);
            await fs.promises.mkdir(path.dirname(filePath), {
                recursive: true,
            });
            await fs.promises.writeFile(filePath, declaration.contents, {
                encoding: 'utf8',
            });
        }
    }
}

export { TypescriptDefinitionGenerator };
