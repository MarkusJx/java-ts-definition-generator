import { ModuleDeclaration } from '../TypescriptDefinitionGenerator';
import Definitions from '../ast/definitions';
import { JavaDefinitions } from '../ast/types';
import {
    ConvertCallback,
    DefinitionGenerator,
    DefinitionGeneratorIf,
} from './DefinitionGenerator';

export class TsDefinitionGenerator
    extends DefinitionGenerator
    implements DefinitionGeneratorIf
{
    public createModuleDeclaration(
        callback?: ConvertCallback | null
    ): Promise<ModuleDeclaration[]> {
        return Definitions.readAndConvert(this.classnames, this.opts, callback);
    }

    public createDefinitionTree(
        callback?: ConvertCallback | null
    ): Promise<JavaDefinitions | JavaDefinitions[]> {
        return Definitions.createDefinitionTree(this.classnames, callback);
    }
}
