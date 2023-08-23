import ts from 'typescript';
import { JavaClass, JavaMethod } from './ast/types';

/**
 * A list of methods which probably never return null
 */
const nonNullReturnMethods: string[] = [
    'toString',
    'wait',
    'getClass',
    'hashCode',
    'notify',
    'notifyAll',
    'equals',
];

export default class DefinitionGenerator {
    public constructor(private readonly data: JavaClass) {}

    private static convertMethod(name: string, method: JavaMethod[]) {
        const res: ts.MethodDeclaration[] = [];

        for (let i = 0; i < method.length; i++) {
            const m = method[i];

            const nonNullReturnType = nonNullReturnMethods.includes(name);
            res.push(
                this.createMethod(m, name, i, false, nonNullReturnType),
                this.createMethod(m, name, i, true, nonNullReturnType)
            );
        }

        return res;
    }

    public convert() {
        for (const [name, method] of Object.entries(this.data.methods)) {
            DefinitionGenerator.convertMethod(name, method);
        }
    }
}
