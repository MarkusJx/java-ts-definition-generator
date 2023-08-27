import { importClassAsync } from 'java-bridge';
import { ClassClass, ModifierClass } from '../util/declarations';
import { JavaFieldDefinition, JavaModifier } from './types';

function onlyUnique<T extends { getNameSync(): string }>(
    value: T,
    index: number,
    self: T[]
): boolean {
    return (
        self.findIndex((el) => value.getNameSync() === el.getNameSync()) ===
        index
    );
}

export default class JavaField implements JavaFieldDefinition {
    private constructor(
        public readonly type: string,
        public readonly name: string,
        public readonly modifiers: JavaModifier[]
    ) {}

    public static async readFields(cls: ClassClass): Promise<JavaField[]> {
        const fields = (await cls.getFields()).filter(onlyUnique);
        const Modifier = await importClassAsync<typeof ModifierClass>(
            'java.lang.reflect.Modifier'
        );

        const res: JavaField[] = [];
        for (const field of fields) {
            const javaModifiers = await field.getModifiers();
            if (!(await Modifier.isPublic(javaModifiers))) {
                continue;
            }

            const modifiers: JavaModifier[] = [];
            const name = await field.getName();
            const type = await field.getType();
            const typeName = await type.getTypeName();

            if (await Modifier.isStatic(javaModifiers)) {
                modifiers.push(JavaModifier.static);
            }
            if (await Modifier.isFinal(javaModifiers)) {
                modifiers.push(JavaModifier.final);
            }

            res.push(new JavaField(typeName, name, modifiers));
        }

        return res;
    }
}
