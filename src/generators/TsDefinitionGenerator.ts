import JavaDefinitions from '../ast/JavaDefinitions';
import { JavaClassDefinitions } from '../ast/types';
import { ConvertCallback, ModuleDeclaration } from '../types';
import {
    DefinitionGenerator,
    DefinitionGeneratorIf,
} from './DefinitionGenerator';

/**
 * A class which can be used to generate typescript definitions
 * for Java classes. This class will use {@link JavaDefinitions}
 * to create the typescript definitions.
 *
 * This means, the class definitions are fetched from java
 * purely in javascript and then converted to typescript.
 * This is quite slow, but works on all java versions.
 *
 * A faster alternative is {@link JavaDefinitionGenerator},
 *
 * @see {@link JavaDefinitions}
 */
export class TsDefinitionGenerator
    extends DefinitionGenerator
    implements DefinitionGeneratorIf
{
    public createModuleDeclarations(
        callback?: ConvertCallback | null
    ): Promise<ModuleDeclaration[]> {
        return JavaDefinitions.createModuleDeclarationForClass(
            this.classnames,
            this.opts,
            callback
        );
    }

    public createDefinitionTree(
        callback?: ConvertCallback | null
    ): Promise<JavaClassDefinitions> {
        return JavaDefinitions.createDefinitionTree(this.classnames, callback);
    }
}
