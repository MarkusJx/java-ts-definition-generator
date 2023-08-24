import { JavaClass, JavaDefinitions } from './types';
import Class from './class';
import { ModuleDeclaration } from '../TypescriptDefinitionGenerator';
import { GeneratorOpts } from '../util/options';
import ClassConverter from './classConverter';

export type ConvertCallback = (classNames: string | string[]) => void;

export default class Definitions implements JavaDefinitions {
    private constructor(
        public readonly root: string,
        public readonly classes: JavaClass[]
    ) {}

    public static fromJavaDefinitions(
        definitions: JavaDefinitions
    ): Definitions {
        if (definitions instanceof Definitions) {
            return definitions;
        }

        return new Definitions(definitions.root, definitions.classes);
    }

    public convert(
        opts: Required<GeneratorOpts>,
        callback?: ConvertCallback
    ): ModuleDeclaration[] {
        return this.classes.map((c) => {
            if (callback) {
                callback(c.name);
            }

            return {
                name: c.name,
                contents: Class.fromJavaClass(c).convert(opts),
            };
        });
    }

    public static async readAndConvert(
        name: string,
        opts: Required<GeneratorOpts>,
        callback?: ConvertCallback
    ): Promise<ModuleDeclaration[]> {
        const res: ModuleDeclaration[] = [];
        const converter = new ClassConverter(name, (cls) =>
            res.push({
                name: cls.name,
                contents: cls.convert(opts),
            })
        );

        let cur: string | null = converter.popQueue();
        while (cur) {
            if (converter.queueLength > 1) {
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

    public static async createSyntaxTree(
        name: string,
        callback?: ConvertCallback
    ): Promise<Definitions> {
        const classes: JavaClass[] = [];
        const converter = new ClassConverter(name, (cls) => classes.push(cls));

        let cur: string | null = converter.popQueue();
        while (cur) {
            if (callback) {
                callback(cur);
            }

            await converter.createClassDefinitionTree(cur);
            cur = converter.popQueue();
        }

        return new Definitions(name, classes);
    }
}
