import { isMainThread, parentPort } from 'worker_threads';
import { parseVersion } from '../util/versions';
import {
    Args,
    CommMessage,
    DoneMessage,
    ErrorMessage,
    StartSpinner,
    UpdateSpinner,
} from './comm';
import java, { ensureJvm, getJavaInstance } from 'java-bridge';
import TypescriptDefinitionGenerator from '../TypescriptDefinitionGenerator';
import { TsDefinitionGenerator } from '../generators/TsDefinitionGenerator';

if (isMainThread) {
    throw new Error('Cannot start worker in main thread');
}

let lastClassResolved = '';
let resolvedCounter = 0;
let numResolved = 0;
const resolvedImports: string[] = [];

const setText = () => {
    parentPort?.postMessage({
        type: 'updateSpinner',
        args: {
            lastClassResolved,
            numResolved,
            resolvedCounter,
            resolvedImports,
        },
    } as UpdateSpinner);
};

const importChalk = (): Promise<typeof import('chalk').default> =>
    eval("import('chalk').then(chalk => chalk.default)");

const convert = async ({
    classnames,
    fastConvert,
    output,
    classpath,
    targetVersion,
    ...otherOpts
}: Args) => {
    ensureJvm();

    if (classpath) {
        java.classpath.append(classpath);
    }

    const chalk = await importChalk();

    const javaInstance = getJavaInstance()!;
    const loadedJars = java.classpath.get();
    if (loadedJars.length > 0) {
        console.log(
            `Started JVM with version ${chalk.cyanBright(
                javaInstance.version
            )} and classpath '${loadedJars
                .map((j) => chalk.cyanBright(j))
                .join(';')}'`
        );
    }

    const opts = {
        targetVersion: targetVersion ? parseVersion(targetVersion) : null,
        ...otherOpts,
    };

    parentPort?.postMessage({
        type: 'startSpinner',
    } as StartSpinner);

    let generator: TypescriptDefinitionGenerator;
    if (!fastConvert) {
        generator = new TypescriptDefinitionGenerator(
            new TsDefinitionGenerator(classnames, opts)
        );
    } else {
        generator = new TypescriptDefinitionGenerator(classnames, opts);
    }

    await generator.createModuleDeclaration((cur) => {
        if (Array.isArray(cur)) {
            lastClassResolved = `${cur[0]} and ${cur.length - 1} more`;
            setText();
            resolvedCounter += cur.length;
            numResolved += cur.length;
        } else {
            lastClassResolved = cur as string;
            setText();
            resolvedCounter++;
            numResolved++;
        }
    });

    await generator.save(output);

    parentPort?.postMessage({
        type: 'done',
    } as DoneMessage);
};

parentPort?.on('message', (msg: CommMessage) => {
    switch (msg.type) {
        case 'start':
            convert(msg.args).catch(
                (error) =>
                    parentPort?.postMessage({
                        type: 'error',
                        error,
                    } as ErrorMessage)
            );
            break;
    }
});
