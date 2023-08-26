import { JavaClassDefinitions } from '../ast/types';
import { ConvertCallback, ModuleDeclaration } from '../types';
import { GeneratorOpts, defaultGeneratorOpts } from '../util/options';
import { checkAndMergeOptions } from '../util/versions';

/**
 * A class which will create typescript definitions
 * for Java classes.
 *
 * @see {@link JavaDefinitionGenerator}
 * @see {@link TsDefinitionGenerator}
 */
export interface DefinitionGeneratorIf {
    /**
     * Create typescript module declarations. This will create {@link ModuleDeclaration}s
     * for all classes specified in the constructor and their dependencies.
     *
     * The callback will be called every time a new class is converted
     * to typescript definitions.
     *
     * The result may be saved to the disk using {@link TypescriptDefinitionGenerator.save}.
     *
     * ## Example
     * ```ts
     * import {
     *   TypescriptDefinitionGenerator,
     *   TsDefinitionGenerator
     * } from 'java-ts-definition-generator';
     *
     * const generator = new TsDefinitionGenerator('java.lang.String');
     * const definitions = await generator.generate();
     *
     * await TypescriptDefinitionGenerator.save(definitions, './project');
     * ```
     *
     * @param callback an optional {@link ConvertCallback}
     * @returns the module declarations grouped by class
     */
    createModuleDeclarations(
        callback?: ConvertCallback | null
    ): Promise<ModuleDeclaration[]>;

    /**
     * Create a list of {@link JavaClassDefinitions} for all classes specified.
     * {@link JavaClassDefinitions} are the raw java class definitions
     * which can be used to create the typescript definitions.
     *
     * The callback will be called every time a new class is converted
     * to a {@link JavaClassDefinition}.
     *
     * You may want to use {@link JavaDefinitions.createModuleDeclaration}
     * to convert the {@link JavaClassDefinitions} to typescript definitions.
     * Or just use {@link createModuleDeclarations} to do both at once.
     *
     * ## Example
     * ```ts
     * import {
     *   TypescriptDefinitionGenerator,
     *   JavaDefinitions
     * } from 'java-ts-definition-generator';
     * import fs from 'fs/promises';
     *
     * const generator = new TypescriptDefinitionGenerator('java.lang.String');
     * const definitions = await generator.createDefinitionTree();
     *
     * await fs.writeFile('./project/definitions.json', JSON.stringify(definitions));
     *
     * // Later...
     * const definitions = JSON.parse(await fs.readFile('./project/definitions.json'));
     * const declarations = JavaDefinitions.fromJavaDefinitions(definitions).createModuleDeclaration();
     * ```
     *
     * @param callback an optional {@link ConvertCallback}
     * @returns the extracted java class definitions
     */
    createDefinitionTree(
        callback?: ConvertCallback | null
    ): Promise<JavaClassDefinitions>;
}

/**
 * A base class for any classes implementing {@link DefinitionGeneratorIf}.
 */
export abstract class DefinitionGenerator implements DefinitionGeneratorIf {
    protected readonly classnames: string[];
    protected readonly opts: Required<GeneratorOpts>;

    /**
     * Create a new typescript definition generator instance.
     *
     * This will check if the options are valid for the specified
     * {@link TargetVersion} and merge the options with the
     * default options specified by {@link defaultGeneratorOpts}.
     *
     * @param classnames the names of the classes to resolve
     * @param opts import options to use
     * @param resolvedClasses full names of any previously resolved classes
     */
    public constructor(
        classnames: string | string[],
        opts: GeneratorOpts = {},
        protected readonly resolvedClasses: string[] = []
    ) {
        if (Array.isArray(classnames)) {
            this.classnames = classnames;
        } else {
            this.classnames = [classnames];
        }

        this.opts = checkAndMergeOptions(opts);
    }

    public abstract createModuleDeclarations(
        callback?: ConvertCallback | null
    ): Promise<ModuleDeclaration[]>;

    public abstract createDefinitionTree(
        callback?: ConvertCallback | null
    ): Promise<JavaClassDefinitions>;
}
