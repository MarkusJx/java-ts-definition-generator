import { JavaDefinitions } from '../ast/types';
import { ConvertCallback, ModuleDeclaration } from '../types';
import { GeneratorOpts, defaultGeneratorOpts } from '../util/options';
import { mergeObjects } from '../util/util';
import { checkOptionsForVersion } from '../util/versions';

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
    createModuleDeclaration(
        callback?: ConvertCallback | null
    ): Promise<ModuleDeclaration[]>;

    /**
     * 
     * @param callback an optional {@link ConvertCallback}
     * @returns the extracted java class definitions
     */
    createDefinitionTree(
        callback?: ConvertCallback | null
    ): Promise<JavaDefinitions | JavaDefinitions[]>;
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

        checkOptionsForVersion(opts);
        this.opts = mergeObjects(opts, defaultGeneratorOpts);
    }

    public abstract createModuleDeclaration(
        callback?: ConvertCallback | null
    ): Promise<ModuleDeclaration[]>;

    public abstract createDefinitionTree(
        callback?: ConvertCallback | null
    ): Promise<JavaDefinitions | JavaDefinitions[]>;
}
