import { importClassAsync } from 'java-bridge';
import JavaClass from './JavaClass';
import { ClassClass } from '../util/declarations';

export default class ClassConverter {
    public readonly queue: string[];

    public constructor(
        initial: string | string[],
        private readonly callback: (cls: JavaClass) => void,
        private readonly resolvedClasses: string[] = []
    ) {
        this.queue = Array.isArray(initial) ? initial.concat() : [initial];
    }

    public async createClassDefinitionTree(name: string) {
        this.resolvedClasses.push(name);
        const cls = await importClassAsync(name);
        const resolved = await JavaClass.readClass(
            cls.class as ClassClass,
            name
        );
        this.callback(resolved);

        this.queue.push(
            ...resolved.imports.filter(
                (v) =>
                    !this.resolvedClasses.includes(v) && !this.queue.includes(v)
            )
        );
    }

    public popQueue(): string | null {
        return this.queue.pop() ?? null;
    }

    public get queueLength(): number {
        return this.queue.length;
    }

    public clearQueue(): void {
        this.queue.length = 0;
    }
}
