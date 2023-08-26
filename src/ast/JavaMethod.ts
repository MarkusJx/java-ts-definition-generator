import { importClassAsync } from 'java-bridge';
import { ClassClass, ModifierClass } from '../util/declarations';
import { JavaMethodDefinition, JavaModifier } from './types';

export default class JavaMethod implements JavaMethodDefinition {
    private constructor(
        public readonly name: string,
        public readonly modifiers: JavaModifier[],
        public readonly parameters: string[],
        public readonly returnType: string
    ) {}

    public static async readMethods(cls: ClassClass): Promise<JavaMethod[]> {
        const methods = await cls.getMethods();
        const Modifier = await importClassAsync<typeof ModifierClass>(
            'java.lang.reflect.Modifier'
        );

        const result: JavaMethod[] = [];
        for (const method of methods) {
            const modifiers = await method.getModifiers();
            if (!(await Modifier.isPublic(modifiers))) {
                continue;
            }

            const name = await method.getName();
            const returnType = await method.getReturnType();
            const parameterTypes = await method.getParameterTypes();

            const mods: JavaModifier[] = [];
            if (await method.isDefault()) {
                mods.push(JavaModifier.default);
            }

            if (await Modifier.isStatic(modifiers)) {
                mods.push(JavaModifier.static);
            }

            result.push(
                new JavaMethod(
                    name,
                    mods,
                    await Promise.all(
                        parameterTypes.map((p) => p.getTypeName())
                    ),
                    await returnType.getTypeName()
                )
            );
        }

        return result;
    }
}
