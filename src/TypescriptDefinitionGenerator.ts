import { getJavaVersionSync } from 'java-bridge';
import path from 'path';
import { ConvertCallback } from './ast/definitions';
import { JavaDefinitions } from './ast/types';
import { DefinitionGeneratorIf } from './generators/DefinitionGenerator';
import { JavaDefinitionGenerator } from './generators/JavaDefinitionGenerator';
import { TsDefinitionGenerator } from './generators/TsDefinitionGenerator';
import { GeneratorOpts } from './util/options';
import fs from 'fs';

/**
 * A java class declaration converted to typescript
 */
export interface ModuleDeclaration {
    /**
     * The fully-qualified class name
     */
    name: string;
    /**
     * The generated typescript code
     */
    contents: string;
}

/**
 * A class to generate typescript definitions for java classes.
 * Converts the given class and all of its dependencies to typescript.
 *
 * ## Example
 * ```ts
 * import { TypescriptDefinitionGenerator } from 'java-ts-definition-generator';
 *
 * const generator = new TypescriptDefinitionGenerator('java.lang.String');
 * // Generate the typescript definitions
 * const definitions = await generator.generate();
 *
 * // Save the definitions to a directory
 * await TypescriptDefinitionGenerator.save(definitions, './project');
 * ```
 */
export default class TypescriptDefinitionGenerator
    implements DefinitionGeneratorIf
{
    public readonly impl: DefinitionGeneratorIf;
    public generatedDeclarations: ModuleDeclaration[] | null = null;

    public constructor(impl: DefinitionGeneratorIf);
    public constructor(
        classnames: string | string[],
        opts: Required<GeneratorOpts>,
        resolvedClasses?: string[]
    );
    public constructor(
        classnamesOrImpl: string | string[] | DefinitionGeneratorIf,
        opts?: Required<GeneratorOpts>,
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
                opts!,
                resolvedClasses
            );
        }
    }

    public static getImpl(
        classnames: string | string[],
        opts: Required<GeneratorOpts>,
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

    public async createModuleDeclaration(
        callback?: ConvertCallback | null | undefined
    ): Promise<ModuleDeclaration[]> {
        this.generatedDeclarations =
            await this.impl.createModuleDeclaration(callback);
        return this.generatedDeclarations;
    }

    public createDefinitionTree(
        callback?: ConvertCallback | null | undefined
    ): Promise<JavaDefinitions | JavaDefinitions[]> {
        return this.impl.createDefinitionTree(callback);
    }

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
