export enum JavaModifier {
    static = 'static',
    final = 'final',
    default = 'default',
}

export interface JavaFieldBase {
    name: string;
    modifiers: JavaModifier[];
}

export interface JavaFieldDefinition extends JavaFieldBase {
    type: string;
}

export interface JavaMethodDefinition extends JavaFieldBase {
    parameters: string[];
    returnType: string;
}

export interface JavaConstructorDefinition {
    parameters: string[];
}

export interface JavaClassDefinition {
    name: string;
    simpleName: string;
    isInterface: boolean;
    isAbstractOrInterface: boolean;
    methods: Record<string, JavaMethodDefinition[]>;
    fields: JavaFieldDefinition[];
    constructors: JavaConstructorDefinition[];
    imports: string[];
}

export interface JavaClassDefinitions {
    root: string[];
    classes: JavaClassDefinition[];
}
