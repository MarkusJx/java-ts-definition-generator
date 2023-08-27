import {
    ModuleDeclaration,
    TypescriptDefinitionGenerator,
    DefinitionGeneratorIf,
    JavaDefinitionGenerator,
    TsDefinitionGenerator,
} from '../.';
import { expect } from 'chai';
import ts from 'typescript';
import path from 'path';
import * as fs from 'fs';
import { forceRunAllTests, runCli, shouldIncreaseTimeout } from './testUtil';
import isCi from 'is-ci';

interface Diagnostics {
    message: string;
    file: string;
    category: string;
    code: number;
}

const timeoutMs: number = shouldIncreaseTimeout ? 1200e3 : 60e3;

function checkTypescriptSyntax(baseDirectory: string): Diagnostics[] {
    const program = ts.createProgram([path.join(baseDirectory, 'index.ts')], {
        checkJs: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node16,
        allowJs: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        strictPropertyInitialization: true,
        noFallthroughCasesInSwitch: true,
        noImplicitOverride: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        forceConsistentCasingInFileNames: true,
        allowSyntheticDefaultImports: true,
        strictBindCallApply: true,
        alwaysStrict: true,
    });

    const categoryToString = (category: ts.DiagnosticCategory): string => {
        switch (category) {
            case ts.DiagnosticCategory.Error:
                return 'error';
            case ts.DiagnosticCategory.Warning:
                return 'warning';
            case ts.DiagnosticCategory.Message:
                return 'message';
            case ts.DiagnosticCategory.Suggestion:
                return 'suggestion';
            default:
                return `unknown (${category})`;
        }
    };

    return ts.getPreEmitDiagnostics(program).map((d) => ({
        message: d.messageText as string,
        file: d.file?.fileName ?? 'unknown',
        category: categoryToString(d.category),
        code: d.code,
    }));
}

async function checkDeclarations(
    declarations: ModuleDeclaration[],
    indexContents: string
) {
    const dir = fs.mkdtempSync('java-bridge');
    await TypescriptDefinitionGenerator.save(declarations, dir);

    await fs.promises.writeFile(
        path.join(dir, 'index.ts'),
        indexContents
            .trim()
            .split(/\r?\n/gi)
            .map((l) => l.trim())
            .join('\n')
    );

    const diagnostics = checkTypescriptSyntax(dir);
    await fs.promises.rm(dir, { recursive: true });

    expect(fs.existsSync(dir)).to.be.false;
    expect(diagnostics, JSON.stringify(diagnostics, null, 4)).to.be.empty;
}

type DefinitionGeneratorConstructor = {
    new (classnames: string | string[]): DefinitionGeneratorIf;
};

const testGenerateIteratorDefinitions = async (
    gen: DefinitionGeneratorConstructor
) => {
    const generator = new TypescriptDefinitionGenerator(
        new gen('java.util.Iterator')
    );

    const declarations = await generator.createModuleDeclarations();
    expect(declarations.map((d) => d.name)).members([
        'java.util.Iterator',
        'java.util.function.Consumer',
    ]);
    expect(declarations.every((d) => d.contents.length > 0)).to.be.true;

    await checkDeclarations(
        declarations,
        `
            import { Iterator } from './java/util/Iterator';

            const iterator: Iterator | null = null;
            iterator!.instanceOf(Iterator);
            `
    );
};

const testGenerateFileOutputStreamDefinitions = async (
    gen: DefinitionGeneratorConstructor
) => {
    const generator = new TypescriptDefinitionGenerator(
        new gen('java.io.FileOutputStream')
    );

    const declarations = await generator.createModuleDeclarations();
    await checkDeclarations(
        declarations,
        `
            import { FileOutputStream } from './java/io/FileOutputStream';

            FileOutputStream.nullOutputStreamSync()!.flushSync();
            `
    );
};

const testGenerateIteratorDefTree = async (
    gen: DefinitionGeneratorConstructor
) => {
    const generator = new TypescriptDefinitionGenerator(
        new gen('java.util.Iterator')
    );

    const tree = await generator.createDefinitionTree();
    expect(tree).to.be.not.null;
    expect(tree.root).members(['java.util.Iterator']);
    expect(tree.classes.map((c) => c.name)).members([
        'java.util.Iterator',
        'java.util.function.Consumer',
    ]);
    expect(tree.classes[0].name).to.equal('java.util.Iterator');
    expect(tree.classes[0].imports).to.have.members([
        'java.util.function.Consumer',
    ]);
    expect(tree.classes[1].name).to.equal('java.util.function.Consumer');
    expect(tree.classes[1].imports).to.be.empty;
};

describe('TypescriptDefinitionGenerator test', () => {
    it("Generate 'java.util.Iterator' definitions using java implementation", async () => {
        await testGenerateIteratorDefinitions(JavaDefinitionGenerator);
    }).timeout(timeoutMs);

    it("Generate 'java.util.Iterator' definitions using ts implementation", async () => {
        await testGenerateIteratorDefinitions(TsDefinitionGenerator);
    }).timeout(timeoutMs);

    it("Generate 'java.util.Iterator' definition tree using java implementation", async () => {
        await testGenerateIteratorDefTree(JavaDefinitionGenerator);
    }).timeout(timeoutMs);

    it("Generate 'java.util.Iterator' definition tree using ts implementation", async () => {
        await testGenerateIteratorDefTree(TsDefinitionGenerator);
    }).timeout(timeoutMs);

    it("Generate 'java.io.FileOutputSteam' definitions using java implementation", async function () {
        if (isCi && !forceRunAllTests) {
            this.skip();
        }

        await testGenerateFileOutputStreamDefinitions(JavaDefinitionGenerator);
    }).timeout(timeoutMs * 4);

    it("Generate 'java.io.FileOutputSteam' definitions using ts implementation", async function () {
        if (isCi && !forceRunAllTests) {
            this.skip();
        }

        await testGenerateFileOutputStreamDefinitions(TsDefinitionGenerator);
    }).timeout(timeoutMs * 4);
});

describe('CLI Test', () => {
    it('Check CLI', async () => {
        const { out, exitCode } = await runCli();

        expect(exitCode).to.be.equal(1);
        expect(out).to.contain('java-ts-gen.js <output> <classnames..>');
    });
});
