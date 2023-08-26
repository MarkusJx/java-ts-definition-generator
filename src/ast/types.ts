export enum JavaModifier {
    static = 'static',
    final = 'final',
    default = 'default',
}

export interface JavaFieldBase {
    name: string;
    modifiers: JavaModifier[];
}

export interface JavaField extends JavaFieldBase {
    type: string;
}

export interface JavaMethod extends JavaFieldBase {
    parameters: string[];
    returnType: string;
}

export interface JavaConstructor {
    parameters: string[];
}

export interface JavaClass {
    name: string;
    simpleName: string;
    isInterface: boolean;
    isAbstractOrInterface: boolean;
    methods: Record<string, JavaMethod[]>;
    fields: JavaField[];
    constructors: JavaConstructor[];
    imports: string[];
}

export interface JavaDefinitions {
    root: string[];
    classes: JavaClass[];
}
