import { isMainThread, parentPort } from 'worker_threads';
import TypescriptDefinitionGenerator from '../TypescriptDefinitionGenerator';
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
    syncSuffix,
    asyncSuffix,
    customInspect,
    targetVersion,
    output,
    classpath,
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

    parentPort?.postMessage({
        type: 'startSpinner',
    } as StartSpinner);

    for (const classname of classnames) {
        const generator = new TypescriptDefinitionGenerator(
            classname,
            {
                syncSuffix,
                asyncSuffix,
                customInspect,
                targetVersion: targetVersion
                    ? parseVersion(targetVersion)
                    : null,
            },
            (name) => {
                lastClassResolved = name;
                resolvedCounter++;
                setText();
            },
            resolvedImports
        );
        const generated = await generator.generate();
        numResolved += generated.length;

        parentPort?.postMessage({
            type: 'updateSpinner',
            args: {
                lastClassResolved,
                numResolved,
                resolvedCounter,
                resolvedImports,
                text: 'saving results',
            },
        } as UpdateSpinner);

        await TypescriptDefinitionGenerator.save(generated, output);
    }

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
