import { ModuleDeclaration } from '../TypescriptDefinitionGenerator';
import { JavaDefinitions } from '../ast/types';
import { GeneratorOpts } from '../util/options';

export type ConvertCallback = (currentClass: string | string[]) => void;

export interface DefinitionGeneratorIf {
    createModuleDeclaration(
        callback?: ConvertCallback | null
    ): Promise<ModuleDeclaration[]>;

    createDefinitionTree(
        callback?: ConvertCallback | null
    ): Promise<JavaDefinitions | JavaDefinitions[]>;
}

export abstract class DefinitionGenerator implements DefinitionGeneratorIf {
    protected readonly classnames: string[];

    public constructor(
        classnames: string | string[],
        protected readonly opts: Required<GeneratorOpts>,
        protected readonly resolvedClasses: string[] = []
    ) {
        if (Array.isArray(classnames)) {
            this.classnames = classnames;
        } else {
            this.classnames = [classnames];
        }
    }

    public abstract createModuleDeclaration(
        callback?: ConvertCallback | null
    ): Promise<ModuleDeclaration[]>;

    public abstract createDefinitionTree(
        callback?: ConvertCallback | null
    ): Promise<JavaDefinitions | JavaDefinitions[]>;
}
