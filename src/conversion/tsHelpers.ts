import ts from 'typescript';
import { JavaMethodDefinition } from '../ast/types';
import ClassMembers from './members';
import { getSimpleName } from './helpers';
import { GeneratorOpts, defaultGeneratorOpts } from '../util/options';
import { deepEquals } from '../util/util';

const sourceFile = ts.createSourceFile(
    'source.ts',
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
);

export const createMethodComment = (
    declaration: JavaMethodDefinition,
    additionalComment: string = ''
): string => {
    return (
        '*\n' +
        additionalComment +
        declaration.parameters
            .map((p, i) => ` * @param var${i} original type: '${p}'\n`)
            .join('') +
        ` * @return original return type: '${declaration.returnType}'\n `
    );
};

export const createType = (
    strictNullTypes: boolean,
    ...type: ts.TypeNode[]
): ts.TypeNode => {
    if (strictNullTypes) {
        return ts.factory.createUnionTypeNode([
            ...type,
            ts.factory.createLiteralTypeNode(ts.factory.createNull()),
        ]);
    } else if (type.length > 1) {
        return ts.factory.createUnionTypeNode(type);
    } else {
        return type[0];
    }
};

export const createConstructorDecl = (
    params: ts.ParameterDeclaration[],
    t: string[],
    i: number
) => {
    let declaration = ts.factory.createConstructorDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
        params,
        undefined
    );
    if (i === 0) {
        declaration = ts.addSyntheticLeadingComment(
            declaration,
            ts.SyntaxKind.SingleLineCommentTrivia,
            ` ================== Constructors ==================`,
            true
        );
    }

    if (t.length > 0) {
        declaration = ts.addSyntheticLeadingComment(
            declaration,
            ts.SyntaxKind.MultiLineCommentTrivia,
            '*\n' +
                t
                    .map((p, i) => ` * @param var${i} original type: '${p}'\n`)
                    .join('') +
                ' ',
            true
        );
    }

    return declaration;
};

export const createClassDecl = (
    simpleName: string,
    members: ClassMembers
): ts.ClassDeclaration => {
    let tsClass = ts.factory.createClassDeclaration(
        [
            ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
            ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword),
        ],
        simpleName + 'Class',
        undefined,
        [
            ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
                ts.factory.createExpressionWithTypeArguments(
                    ts.factory.createIdentifier('JavaClass'),
                    undefined
                ),
            ]),
        ],
        members.classMembers
    );

    return ts.addSyntheticLeadingComment(
        tsClass,
        ts.SyntaxKind.MultiLineCommentTrivia,
        `*\n * This class just defines types, you should import {@link ${simpleName}} instead of this.\n` +
            ' * This was generated by java-bridge.\n' +
            ' * You should probably not edit this.\n ',
        true
    );
};

export const getSourceText = (nodes: (ts.Node | null)[]) => {
    return nodes
        .map(
            (n) =>
                (n &&
                    ts
                        .createPrinter({ newLine: ts.NewLineKind.LineFeed })
                        .printNode(ts.EmitHint.Unspecified, n, sourceFile)) ||
                ''
        )
        .join('\n');
};

export const createInterfaceImports = (
    interfaceImports: string[],
    classname: string,
    importStmt: string
) =>
    interfaceImports.includes(importStmt) && importStmt !== classname
        ? [
              ts.factory.createImportSpecifier(
                  false,
                  ts.factory.createIdentifier(
                      getSimpleName(importStmt) + 'Interface'
                  ),
                  ts.factory.createIdentifier(
                      importStmt.replaceAll('.', '_') + 'Interface'
                  )
              ),
          ]
        : [];

export const createPrivateConstructor = (): ts.ClassElement => {
    const declaration = ts.factory.createConstructorDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.PrivateKeyword)],
        [],
        ts.factory.createBlock(
            [
                ts.factory.createExpressionStatement(
                    ts.factory.createCallExpression(
                        ts.factory.createSuper(),
                        [],
                        []
                    )
                ),
            ],
            true
        )
    );

    return ts.addSyntheticLeadingComment(
        declaration,
        ts.SyntaxKind.MultiLineCommentTrivia,
        '*\n * Private constructor to prevent instantiation\n' +
            ' * as this is either an abstract class or an interface\n ',
        true
    );
};

export const createExportStatement = (
    simpleName: string,
    isAbstractOrInterface: boolean,
    classname: string,
    options: Required<GeneratorOpts>
) => {
    let importOpts = '';
    if (!deepEquals(options, defaultGeneratorOpts)) {
        importOpts = `, {
                syncSuffix: '${options.syncSuffix}',
                asyncSuffix: '${options.asyncSuffix}',
                customInspect: ${options.customInspect},
            }`;
    }

    const statement = ts.factory.createClassDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        simpleName,
        undefined,
        [
            ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
                ts.factory.createExpressionWithTypeArguments(
                    ts.factory.createIdentifier(
                        `importClass<typeof ${simpleName}Class>('${classname}'${importOpts})`
                    ),
                    undefined
                ),
            ]),
        ],
        isAbstractOrInterface ? [createPrivateConstructor()] : []
    );

    return [
        ts.addSyntheticLeadingComment(
            statement,
            ts.SyntaxKind.MultiLineCommentTrivia,
            `*\n * Class ${classname}.\n *\n` +
                ' * This actually imports the java class for further use.\n' +
                ` * The class {@link ${simpleName}Class} only defines types, this is the class you should actually import.\n` +
                ' * Please note that this statement imports the underlying java class at runtime, which may take a while.\n' +
                ' * This was generated by java-bridge.\n * You should probably not edit this.\n ',
            true
        ),
        ts.factory.createExportDefault(ts.factory.createIdentifier(simpleName)),
    ];
};
