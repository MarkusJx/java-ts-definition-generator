import isCi from 'is-ci';
import { spawn } from 'child_process';
import path from 'path';

export const shouldIncreaseTimeout =
    isCi &&
    (process.arch === 'arm64' ||
        process.arch === 'arm' ||
        process.env.INCREASE_TIMEOUT === 'true');
export const forceRunAllTests = process.env.FORCE_RUN_ALL_TESTS === 'true';

interface CliRunResult {
    out: string;
    exitCode: number;
}

export function runCli(args: string[] = []): Promise<CliRunResult> {
    return new Promise<CliRunResult>((resolve) => {
        const child = spawn('node', [
            path.join(__dirname, '..', 'dist', 'java-ts-gen.js'),
            ...args,
        ]);

        let out = '';
        child.stdout?.on('data', (data) => {
            out += data;
        });

        child.stderr?.on('data', (data) => {
            out += data;
        });

        child.on('exit', (exitCode) => {
            resolve({ out, exitCode: exitCode ?? -1 });
        });
    });
}
