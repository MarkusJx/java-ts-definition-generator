import { importClassAsync } from 'java-bridge';
import { ClassClass, ModifierClass } from '../util/declarations';
import { JavaConstructorDefinition } from './types';

export default class JavaConstructor implements JavaConstructorDefinition {
    private constructor(public readonly parameters: string[]) {}

    public static async readConstructors(
        cls: ClassClass
    ): Promise<JavaConstructor[]> {
        const Modifier = await importClassAsync<typeof ModifierClass>(
            'java.lang.reflect.Modifier'
        );

        const res: JavaConstructor[] = [];
        for (const constructor of await cls.getDeclaredConstructors()) {
            const modifiers = await constructor.getModifiers();
            if (!(await Modifier.isPublic(modifiers))) {
                continue;
            }

            const parameterTypes = await constructor.getParameterTypes();
            const params = await Promise.all(
                parameterTypes.map((p) => p.getTypeName())
            );

            res.push(new JavaConstructor(params));
        }

        return res;
    }
}
