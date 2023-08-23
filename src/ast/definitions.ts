import { importClassAsync } from 'java-bridge';
import { JavaClass, JavaDefinitions } from './types';
import Class from './class';
import { ClassClass } from '../util/declarations';
import { ModuleDeclaration } from '../TypescriptDefinitionGenerator';
import { GeneratorOpts } from '../util/options';

export default class Definitions implements JavaDefinitions {
    private constructor(
        public readonly root: string,
        public readonly classes: JavaClass[]
    ) {}

    public convert(opts: Required<GeneratorOpts>, callback: (val: string) => void): ModuleDeclaration[] {
        return this.classes.map((c) => {
            callback('Converting to typescript: ' + c.name);
            return {
            name: c.name,
            contents: Class.fromJavaClass(c).convert(opts),
        }});
    }

    public static async readDefinitions(name: string, callback: (val: string) => void): Promise<Definitions> {
        const queue: string[] = [name];
        const resolvedClasses: string[] = [];
        const classes: JavaClass[] = [];

        let cur: string | undefined = queue.pop();
        while (!!cur) {
            callback('Creating AST for: ' + cur);
            resolvedClasses.push(cur);
            const cls = await importClassAsync(cur);
            const resolved = await Class.readClass(
                cls.class as ClassClass,
                cur
            );
            classes.push(resolved);

            queue.push(
                ...resolved.imports.filter((v) => !resolvedClasses.includes(v))
            );
            cur = queue.pop();
        }

        return new Definitions(name, classes);
    }
}
