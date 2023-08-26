import yargs from 'yargs';
import { performance } from 'perf_hooks';
import path from 'path';
import { version } from '../package.json';
import type { Ora } from 'ora';
import { javaBridgeVersion } from './util/versions';
import { Worker } from 'worker_threads';
import { Args, CommMessage, StartMessage } from './worker/comm';

type YargsHandler<T> = (args: yargs.ArgumentsCamelCase<T>) => Promise<void>;

const importOra = (): Promise<typeof import('ora').default> =>
    eval("import('ora').then(ora => ora.default)");
const importChalk = (): Promise<typeof import('chalk').default> =>
    eval("import('chalk').then(chalk => chalk.default)");

const builder: yargs.BuilderCallback<{}, Args> = (command) => {
    command
        .positional('classnames', {
            describe: 'The fully qualified class name(s) to convert',
            type: 'string',
        })
        .positional('output', {
            describe: 'The output file',
            type: 'string',
        })
        .option('classpath', {
            alias: 'cp',
            type: 'string',
            describe: 'The classpath to use',
        })
        .option('syncSuffix', {
            type: 'string',
            describe: 'The sync suffix',
        })
        .option('asyncSuffix', {
            type: 'string',
            describe: 'The async suffix',
        })
        .option('customInspect', {
            type: 'boolean',
            describe: "Whether to enable the 'customInspect' option",
        })
        .option('targetVersion', {
            type: 'string',
            describe: 'The version of java-bridge to target',
        })
        .option('fastConvert', {
            type: 'boolean',
            default: true,
            describe:
                'Use the faster converter if available (requires Java 16+)',
        });
};

const handler: YargsHandler<Args> = async (args) => {
    const { classnames, output } = args;

    let spinner: Ora | null = null;
    try {
        const startTime = performance.now();

        const chalk = await importChalk();
        const ora = await importOra();

        console.log(
            `Starting ${chalk.cyanBright('java-bridge')} ${chalk.greenBright(
                'v' + version
            )} Java definition generator`
        );

        console.log(
            `Using ${chalk.cyanBright(
                'java-bridge'
            )} version ${chalk.greenBright('v' + javaBridgeVersion)}`
        );

        console.log(
            `Converting classes ${classnames
                .map((c) => chalk.magentaBright(c))
                .join(
                    ', '
                )} to typescript and saving result to ${chalk.cyanBright(
                path.normalize(output)
            )}`
        );

        let resolvedCounter: number = 0;
        let numResolved: number = 0;

        let approximateTimeElapsed: number = 0;
        let lastClassResolved: string = '';
        const timeElapsedInterval = setInterval(() => {
            approximateTimeElapsed += 1;
            setText();
        }, 1000);

        const setText = () => {
            spinner!.text = chalk.gray(
                `Elapsed time: ${chalk.yellow(
                    approximateTimeElapsed
                )} seconds ${chalk.white('|')} Converted ${chalk.cyanBright(
                    resolvedCounter
                )} classes ${chalk.white(
                    '|'
                )} Converting class ${chalk.magentaBright(lastClassResolved)}`
            );
        };

        const worker = new Worker(path.join(__dirname, 'cliWorker.js'));
        worker.on('message', (msg: CommMessage) => {
            switch (msg.type) {
                case 'updateSpinner': {
                    ({ lastClassResolved, numResolved, resolvedCounter } =
                        msg.args);
                    if (msg.args.text) {
                        spinner!.text = msg.args.text!;
                    } else {
                        setText();
                    }
                    break;
                }
                case 'done': {
                    clearInterval(timeElapsedInterval);
                    const timeElapsed = (
                        (performance.now() - startTime) /
                        1000
                    ).toFixed(1);
                    spinner!.succeed(
                        `Success - Converted ${chalk.blueBright(
                            numResolved
                        )} classes in ${chalk.blueBright(timeElapsed)} seconds`
                    );
                    worker.terminate();
                    break;
                }
                case 'startSpinner': {
                    spinner = ora().start();
                    break;
                }
                case 'error': {
                    spinner?.fail('Failed to convert classes');
                    console.error(msg.error);
                    process.exit(1);
                    break;
                }
            }
        });

        worker.postMessage({
            type: 'start',
            args,
        } as StartMessage);
    } catch (e) {
        // @ts-expect-error
        spinner?.fail('Failed to convert classes');
        console.error(e);
        process.exit(1);
    }
};

yargs
    .command<Args>('* <output> <classnames..>', false, builder, handler)
    .parse();
