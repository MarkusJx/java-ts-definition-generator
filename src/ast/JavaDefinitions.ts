import { JavaClassDefinition, JavaClassDefinitions } from './types';
import JavaClass from './JavaClass';
import { GeneratorOpts } from '../util/options';
import ClassConverter from './ClassConverter';
import { ModuleDeclaration, ConvertCallback } from '../types';
import { checkAndMergeOptions } from '../util/versions';

/**
 * A class which represents {@link JavaClassDefinitions}.
 * This class can be used to convert the java definitions to typescript.
 *
 * @see {@link JavaClassDefinitions}
 */
export default class JavaDefinitions implements JavaClassDefinitions {
    private constructor(
        public readonly root: string[],
        public readonly classes: JavaClassDefinition[]
    ) {}

    /**
     * Create a {@link JavaDefinitions} instance from a {@link JavaClassDefinitions} instance.
     * If the passed instance is already a {@link JavaDefinitions} instance,
     * it will be returned as is. Otherwise, a new instance will be created.
     *
     * ## Example
     * ```ts
     * import { JavaDefinitions, JavaClassDefinitions } from 'java-ts-definition-generator';
     * import fs from 'fs';
     *
     * const definitions: JavaClassDefinitions = JSON.parse(fs.readFileSync('./definitions.json', 'utf-8'));
     * const javaDefinitions = JavaDefinitions.fromJavaDefinitions(definitions);
     * ```
     *
     * @param definitions the {@link JavaClassDefinitions} instance to convert
     */
    public static fromJavaDefinitions(
        definitions: JavaClassDefinitions
    ): JavaDefinitions {
        if (definitions instanceof JavaDefinitions) {
            return definitions;
        }

        return new JavaDefinitions(definitions.root, definitions.classes);
    }

    /**
     * Convert the {@link JavaClassDefinitions} to typescript definitions.
     * Or just use {@link createModuleDeclarationForClass} to do both at once.
     * This will check if the options are valid for the specified
     * {@link TargetVersion} and merge the options with the
     * default options specified by {@link defaultGeneratorOpts}.
     *
     * @see {@link DefinitionGeneratorIf.createModuleDeclaration}
     * @see {@link DefinitionGeneratorIf.createDefinitionTree}
     * @param options import options to use
     * @param callback an optional {@link ConvertCallback}
     * @returns the generated typescript definitions
     */
    public createModuleDeclaration(
        options: GeneratorOpts,
        callback?: ConvertCallback
    ): ModuleDeclaration[] {
        const opts = checkAndMergeOptions(options);
        return this.classes.map((c) => {
            if (callback) {
                callback(c.name);
            }

            return {
                name: c.name,
                contents: JavaClass.fromJavaClass(c).convert(opts),
            };
        });
    }

    /**
     * Create typescript definitions for the given class(es).
     * This will check if the options are valid for the specified
     * {@link TargetVersion} and merge the options with the
     * default options specified by {@link defaultGeneratorOpts}.
     * If the class has any dependencies, they will be resolved as well.
     *
     * This is used internally by {@link TsDefinitionGenerator.createModuleDeclarations}.
     * That method should probably be used instead of this one.
     *
     * @see {@link DefinitionGeneratorIf.createModuleDeclaration}
     * @param name the name(s) of the class(es) to resolve
     * @param options import options to use
     * @param callback an optional {@link ConvertCallback}
     * @param resolvedClasses full names of any previously resolved classes
     * @returns the generated typescript definitions
     */
    public static async createModuleDeclarationForClass(
        name: string | string[],
        options: GeneratorOpts,
        callback?: ConvertCallback | null,
        resolvedClasses: string[] = []
    ): Promise<ModuleDeclaration[]> {
        const res: ModuleDeclaration[] = [];
        const opts = checkAndMergeOptions(options);
        const converter = new ClassConverter(
            name,
            (cls) =>
                res.push({
                    name: cls.name,
                    contents: cls.convert(opts),
                }),
            resolvedClasses
        );

        let cur: string | null = converter.popQueue();
        while (cur) {
            if (converter.queueLength >= 1) {
                const queueCopy = [cur, ...converter.queue];
                converter.clearQueue();

                if (callback) {
                    callback(queueCopy);
                }

                await Promise.all(
                    queueCopy.map(
                        converter.createClassDefinitionTree.bind(converter)
                    )
                );
            } else {
                if (callback) {
                    callback(cur);
                }

                await converter.createClassDefinitionTree(cur);
            }

            cur = converter.popQueue();
        }

        return res;
    }

    /**
     * Create a {@link JavaDefinitions} instance for the given class(es).
     * If the class has any dependencies, they will be resolved as well.
     *
     * This is used internally by {@link TsDefinitionGenerator.createDefinitionTree}.
     * That method should probably be used instead of this one.
     *
     * @see {@link DefinitionGeneratorIf.createDefinitionTree}
     * @param name the name(s) of the class(es) to resolve
     * @param callback an optional {@link ConvertCallback}
     * @param resolvedClasses full names of any previously resolved classes
     */
    public static async createDefinitionTree(
        name: string | string[],
        callback?: ConvertCallback | null,
        resolvedClasses: string[] = []
    ): Promise<JavaDefinitions> {
        const classes: JavaClassDefinition[] = [];
        const converter = new ClassConverter(
            name,
            (cls) => classes.push(cls),
            resolvedClasses
        );

        let cur: string | null = converter.popQueue();
        while (cur) {
            if (callback) {
                callback(cur);
            }

            await converter.createClassDefinitionTree(cur);
            cur = converter.popQueue();
        }

        return new JavaDefinitions(
            Array.isArray(name) ? name : [name],
            classes
        );
    }
}
