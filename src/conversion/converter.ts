import ts, { SyntaxKind } from 'typescript';
import {
    JavaConstructorDefinition,
    JavaFieldDefinition,
    JavaMethodDefinition,
    JavaModifier,
} from '../ast/types';
import { GeneratorOpts } from '../util/options';
import { importClass } from 'java-bridge';
import { ClassClass } from '../util/declarations';
import {
    createClassDecl,
    createConstructorDecl,
    createExportStatement,
    createInterfaceImports,
    createMethodComment,
    createType,
    getSourceText,
} from './tsHelpers';
import {
    getImportPath,
    getSimpleName,
    isPrimitive,
    primitiveToClassType,
} from './helpers';
import ClassMembers from './members';
import { unique } from '../util/util';

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

export default class Converter {
    private usesBasicOrJavaType: boolean = false;
    private usesNewProxy: boolean = false;
    private usesInterfaceProxy: boolean = false;
    private readonly importsToResolve: string[] = [];
    private readonly interfaceImports: string[] = [];

    private readonly members = new ClassMembers();

    public constructor(
        private readonly classname: string,
        private readonly simpleName: string,
        private readonly options: Required<GeneratorOpts>
    ) {}

    public createSourceText(isAbstractOrInterface: boolean): string {
        const tsClass = createClassDecl(this.simpleName, this.members);
        return getSourceText([
            this.getImports(),
            ...this.getAdditionalImports(),
            null,
            tsClass,
            ...this.members.interfaceDeclaration,
            null,
            ...createExportStatement(
                this.simpleName,
                isAbstractOrInterface,
                this.classname,
                this.options
            ),
        ]);
    }

    private getAdditionalImports(): ts.ImportDeclaration[] {
        return this.importsToResolve
            .filter((i) => i != this.classname)
            .filter(unique)
            .map((i) =>
                ts.factory.createImportDeclaration(
                    undefined,
                    ts.factory.createImportClause(
                        false,
                        undefined,
                        ts.factory.createNamedImports([
                            ts.factory.createImportSpecifier(
                                false,
                                ts.factory.createIdentifier(getSimpleName(i)),
                                ts.factory.createIdentifier(
                                    i.replaceAll('.', '_')
                                )
                            ),
                            ...createInterfaceImports(
                                this.interfaceImports,
                                this.classname,
                                i
                            ),
                        ])
                    ),
                    ts.factory.createStringLiteral(
                        getImportPath(this.classname, i)
                    )
                )
            );
    }

    public createInterfaceDeclaration(
        methods: Record<string, JavaMethodDefinition[]>
    ) {
        let decl = ts.factory.createInterfaceDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            this.simpleName + 'Interface',
            undefined,
            [],
            this.createInterfaceMethodSignatures(methods)
        );

        decl = ts.addSyntheticLeadingComment(
            decl,
            ts.SyntaxKind.MultiLineCommentTrivia,
            '*\n * This interface just defines types for creating proxies,\n' +
                ` * you should use {@link create${this.simpleName}Proxy} for actually creating the proxies.\n` +
                ' *\n' +
                ' * Optional methods in here may still be required by java.\n' +
                ' * This is caused by typescript not allowing to have both optional and\n' +
                ' * non-optional signatures for the same interface member.\n' +
                ' *\n' +
                ' * This was generated by java-bridge.\n * You should probably not edit this.\n ',
            true
        );

        this.members.addInterfaceDeclaration(
            null,
            decl,
            null,
            this.createNewProxyMethod()
        );
    }

    public convertConstructors(
        constructors: JavaConstructorDefinition[]
    ): void {
        constructors
            .map((c) => c.parameters)
            .forEach((parameters, i) => {
                const params = parameters.map(this.convertParameter.bind(this));

                this.members.addMembers(
                    createConstructorDecl(params, parameters, i),
                    this.createMethod(
                        {
                            returnType: this.classname,
                            parameters: parameters,
                            name: 'newInstanceAsync',
                            modifiers: [JavaModifier.static],
                        },
                        i,
                        false,
                        true
                    )
                );
            });
    }

    public convertClassFields(fields: JavaFieldDefinition[]): void {
        for (const field of fields) {
            const tsModifiers: ts.ModifierLike[] = [
                ts.factory.createModifier(SyntaxKind.PublicKeyword),
            ];
            if (field.modifiers.includes(JavaModifier.static)) {
                tsModifiers.push(
                    ts.factory.createModifier(SyntaxKind.StaticKeyword)
                );
            }

            if (field.modifiers.includes(JavaModifier.final)) {
                tsModifiers.push(
                    ts.factory.createModifier(SyntaxKind.ReadonlyKeyword)
                );
            }

            let declaration = ts.factory.createPropertyDeclaration(
                tsModifiers,
                field.name,
                undefined,
                this.javaTypeToTypescriptType(field.type, true),
                undefined
            );

            declaration = ts.addSyntheticLeadingComment(
                declaration,
                ts.SyntaxKind.SingleLineCommentTrivia,
                ` ================== Field ${field.name} ==================`,
                true
            );

            this.members.addMembers(
                ts.addSyntheticLeadingComment(
                    declaration,
                    ts.SyntaxKind.MultiLineCommentTrivia,
                    `*\n * Original type: '${field.type}'\n `,
                    true
                )
            );
        }
    }

    public convertClassMethods(
        methods: JavaMethodDefinition[],
        methodName: string
    ): void {
        methods.forEach((method, i) => {
            if (methodName === 'toString') {
                return;
            }

            const nonNullReturnType = nonNullReturnMethods.includes(methodName);
            this.members.addMembers(
                this.createMethod(method, i, false, nonNullReturnType),
                this.createMethod(method, i, true, nonNullReturnType)
            );
        });
    }

    private getImports(): ts.ImportDeclaration {
        const importElements = [
            ts.factory.createImportSpecifier(
                false,
                undefined,
                ts.factory.createIdentifier('importClass')
            ),
            ts.factory.createImportSpecifier(
                false,
                undefined,
                ts.factory.createIdentifier('JavaClass')
            ),
        ];

        if (this.usesBasicOrJavaType) {
            importElements.push(
                ts.factory.createImportSpecifier(
                    false,
                    undefined,
                    ts.factory.createIdentifier('BasicOrJavaType')
                )
            );
        }

        if (this.usesNewProxy) {
            importElements.push(
                ts.factory.createImportSpecifier(
                    false,
                    undefined,
                    ts.factory.createIdentifier('newProxy')
                ),
                ts.factory.createImportSpecifier(
                    false,
                    undefined,
                    ts.factory.createIdentifier('InterfaceProxyOptions')
                )
            );
        }

        if (this.usesInterfaceProxy) {
            importElements.push(
                ts.factory.createImportSpecifier(
                    false,
                    undefined,
                    ts.factory.createIdentifier('JavaInterfaceProxy')
                )
            );
        }

        const imports = ts.factory.createNamedImports(importElements);
        return ts.factory.createImportDeclaration(
            undefined,
            ts.factory.createImportClause(false, undefined, imports),
            ts.factory.createStringLiteral('java-bridge')
        );
    }

    private createInterfaceMethodSignatures(
        interfaceMethods: Record<string, JavaMethodDefinition[]>
    ): ts.MethodSignature[] {
        return Object.entries(interfaceMethods)
            .map(([key, method]) => ({
                key,
                method: method.filter(
                    (m) => !m.modifiers.includes(JavaModifier.static)
                ),
            }))
            .flatMap(({ key, method }) =>
                method.map((m, i) =>
                    this.createMethodSignature(
                        m,
                        key,
                        i,
                        method.some((m) =>
                            m.modifiers.includes(JavaModifier.default)
                        ),
                        nonNullReturnMethods.includes(key)
                    )
                )
            );
    }

    private createMethodSignature(
        m: JavaMethodDefinition,
        name: string,
        i: number,
        isDefault: boolean,
        nonNullReturnType: boolean
    ): ts.MethodSignature {
        let declaration = ts.factory.createMethodSignature(
            [],
            name,
            isDefault
                ? ts.factory.createToken(SyntaxKind.QuestionToken)
                : undefined,
            undefined,
            this.convertParameters(m),
            this.javaTypeToTypescriptType(
                m.returnType,
                false,
                !nonNullReturnType
            )
        );

        if (i === 0) {
            declaration = ts.addSyntheticLeadingComment(
                declaration,
                ts.SyntaxKind.SingleLineCommentTrivia,
                ` ================== Method ${name} ==================`,
                true
            );
        }

        let requiredNote = '';
        if (!m.modifiers.includes(JavaModifier.default) && isDefault) {
            requiredNote =
                ' * **Note: Although this method is marked as optional, it actually must be implemented.**\n *\n';
        }

        return ts.addSyntheticLeadingComment(
            declaration,
            ts.SyntaxKind.MultiLineCommentTrivia,
            createMethodComment(m, requiredNote),
            true
        );
    }

    private createNewProxyMethod(): ts.FunctionDeclaration {
        this.usesNewProxy = true;
        this.usesInterfaceProxy = true;
        const interfaceName = this.simpleName + 'Interface';
        let decl = ts.factory.createFunctionDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            undefined,
            `create${this.simpleName}Proxy`,
            undefined,
            [
                ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    'methods',
                    undefined,
                    ts.factory.createTypeReferenceNode(interfaceName)
                ),
                ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    'opts',
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    ts.factory.createTypeReferenceNode('InterfaceProxyOptions')
                ),
            ],
            ts.factory.createTypeReferenceNode('JavaInterfaceProxy', [
                ts.factory.createTypeReferenceNode(interfaceName),
            ]),
            ts.factory.createBlock(
                [
                    ts.factory.createReturnStatement(
                        ts.factory.createCallExpression(
                            ts.factory.createIdentifier('newProxy'),
                            [ts.factory.createTypeReferenceNode(interfaceName)],
                            [
                                ts.factory.createStringLiteral(
                                    this.classname,
                                    true
                                ),
                                ts.factory.createIdentifier('methods'),
                                ts.factory.createIdentifier('opts'),
                            ]
                        )
                    ),
                ],
                true
            )
        );

        return ts.addSyntheticLeadingComment(
            decl,
            ts.SyntaxKind.MultiLineCommentTrivia,
            `*\n * Create a proxy for the {@link ${this.simpleName}} interface.\n` +
                ` * All required methods in {@link ${this.simpleName}Interface} must be implemented.\n` +
                ` *\n` +
                ` * @param methods the methods to implement\n` +
                ` * @param opts the proxy options\n` +
                ` * @return the proxy\n `,
            true
        );
    }

    private javaTypeToTypescriptType(
        javaType: string,
        isParam: boolean,
        strictNullTypes: boolean = true
    ): ts.TypeNode {
        switch (javaType) {
            case 'byte[]':
            case 'java.lang.Byte[]':
                return createType(
                    strictNullTypes,
                    ts.factory.createTypeReferenceNode('Buffer')
                );
        }

        if (javaType.endsWith('[]')) {
            return createType(
                strictNullTypes,
                ts.factory.createArrayTypeNode(
                    this.javaTypeToTypescriptType(
                        javaType.substring(0, javaType.length - 2),
                        isParam
                    )
                )
            );
        }

        const createTypeReferenceNode = (name: string): ts.TypeNode[] => {
            const isInterface = (
                importClass(name).class as ClassClass
            ).isInterfaceSync();
            const interfaceProxy: ts.TypeNode[] = [];
            if (isInterface && isParam) {
                this.usesInterfaceProxy = true;
                if (!this.interfaceImports.includes(name)) {
                    this.interfaceImports.push(name);
                }

                interfaceProxy.push(
                    ts.factory.createTypeReferenceNode('JavaInterfaceProxy', [
                        ts.factory.createTypeReferenceNode(
                            name === this.classname
                                ? name.substring(name.lastIndexOf('.') + 1) +
                                      'Interface'
                                : name.replaceAll('.', '_') + 'Interface'
                        ),
                    ])
                );
            }

            this.importsToResolve.push(name);
            const isSelf = name === this.classname && isParam;
            return [
                ts.factory.createTypeReferenceNode(
                    name === this.classname
                        ? name.substring(name.lastIndexOf('.') + 1) +
                              (isSelf ? 'Class' : '')
                        : name.replaceAll('.', '_')
                ),
                ...interfaceProxy,
            ];
        };

        const createUnion = (
            type: ts.KeywordTypeSyntaxKind,
            ...additionalTypes: ts.KeywordTypeSyntaxKind[]
        ): ts.UnionTypeNode => {
            const types: ts.TypeNode[] = [
                ts.factory.createKeywordTypeNode(type),
            ];

            if (!isPrimitive(javaType) && strictNullTypes) {
                types.push(
                    ts.factory.createLiteralTypeNode(ts.factory.createNull())
                );
            }

            if (!isParam) {
                return ts.factory.createUnionTypeNode(types);
            }

            return ts.factory.createUnionTypeNode([
                ...createTypeReferenceNode(primitiveToClassType(javaType)),
                ...additionalTypes.map((t) =>
                    ts.factory.createKeywordTypeNode(t)
                ),
                ...types,
            ]);
        };

        switch (javaType) {
            case 'int':
            case 'java.lang.Integer':
            case 'float':
            case 'java.lang.Float':
            case 'double':
            case 'java.lang.Double':
            case 'byte':
            case 'java.lang.Byte':
            case 'short':
            case 'java.lang.Short':
                return createUnion(SyntaxKind.NumberKeyword);
            case 'long':
            case 'java.lang.Long':
                return createUnion(
                    SyntaxKind.NumberKeyword,
                    SyntaxKind.BigIntKeyword
                );
            case 'char':
            case 'java.lang.Character':
            case 'java.lang.String':
                return createType(
                    strictNullTypes,
                    ts.factory.createKeywordTypeNode(SyntaxKind.StringKeyword)
                );
            case 'boolean':
            case 'java.lang.Boolean':
                return createUnion(SyntaxKind.BooleanKeyword);
            case 'void':
            case 'java.lang.Void':
                return ts.factory.createKeywordTypeNode(SyntaxKind.VoidKeyword);
            case 'java.lang.Object':
                this.usesBasicOrJavaType = true;
                return createType(
                    strictNullTypes,
                    ts.factory.createTypeReferenceNode('BasicOrJavaType')
                );
            default:
                return createType(
                    strictNullTypes,
                    ...createTypeReferenceNode(javaType)
                );
        }
    }

    private createMethod(
        m: JavaMethodDefinition,
        i: number,
        isSync: boolean,
        nonNullReturnType: boolean
    ): ts.MethodDeclaration {
        const publicMod = ts.factory.createModifier(
            ts.SyntaxKind.PublicKeyword
        );
        const staticMod = ts.factory.createModifier(
            ts.SyntaxKind.StaticKeyword
        );

        const modifiers: ts.Modifier[] = [publicMod];
        if (m.modifiers.includes(JavaModifier.static)) {
            modifiers.push(staticMod);
        }

        let returnType = this.javaTypeToTypescriptType(
            m.returnType,
            false,
            !nonNullReturnType
        );
        if (!isSync) {
            returnType = ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier('Promise'),
                [returnType]
            );
        }

        const name = m.name;
        let suffix = '';
        if (name !== 'newInstanceAsync') {
            if (isSync) {
                suffix = this.options.syncSuffix;
            } else {
                suffix = this.options.asyncSuffix;
            }
        }

        let declaration = ts.factory.createMethodDeclaration(
            modifiers,
            undefined,
            name + suffix,
            undefined,
            undefined,
            this.convertParameters(m),
            returnType,
            undefined
        );

        if (i === 0) {
            declaration = ts.addSyntheticLeadingComment(
                declaration,
                ts.SyntaxKind.SingleLineCommentTrivia,
                ` ================== Method ${name} ==================`,
                true
            );
        }

        return ts.addSyntheticLeadingComment(
            declaration,
            ts.SyntaxKind.MultiLineCommentTrivia,
            createMethodComment(m),
            true
        );
    }

    private convertParameter(
        param: string,
        index: number
    ): ts.ParameterDeclaration {
        const name = 'var' + index;
        const type = this.javaTypeToTypescriptType(param, true);
        return ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            name,
            undefined,
            type
        );
    }

    private convertParameters(params: JavaMethodDefinition) {
        return params.parameters.map(this.convertParameter.bind(this));
    }
}
