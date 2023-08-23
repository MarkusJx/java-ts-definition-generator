import { importClassAsync } from 'java-bridge';
import { ClassClass, ModifierClass } from '../util/declarations';
import { JavaConstructor } from './types';

export default class Constructor implements JavaConstructor {
    private constructor(public readonly parameters: string[]) {}

    public static async readConstructors(
        cls: ClassClass
    ): Promise<Constructor[]> {
        const Modifier = await importClassAsync<typeof ModifierClass>(
            'java.lang.reflect.Modifier'
        );

        const res: Constructor[] = [];
        for (const constructor of await cls.getDeclaredConstructors()) {
            const modifiers = await constructor.getModifiers();
            if (!(await Modifier.isPublic(modifiers))) {
                continue;
            }

            const parameterTypes = await constructor.getParameterTypes();
            const params = await Promise.all(
                parameterTypes.map((p) => p.getTypeName())
            );

            res.push(new Constructor(params));
        }

        return res;
    }
}
