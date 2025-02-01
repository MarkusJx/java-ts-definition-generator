import { importClassAsync } from 'java-bridge';
import { minimatch } from 'minimatch';

/**
 * Find all classes matching the specified glob patterns
 *
 * @param jars the jars to find the classes in
 * @param patterns the glob patterns to match the class names against
 * @returns the resolved class names
 */
export async function findAllClassesMatching(
    jars: string[],
    patterns: string[]
): Promise<string[]> {
    const ZipInputStream = await importClassAsync(
        'java.util.zip.ZipInputStream'
    );
    const FileInputStream = await importClassAsync('java.io.FileInputStream');

    const classNames: string[] = [];
    for (const file of jars) {
        const zip = await ZipInputStream.newInstanceAsync(
            await FileInputStream.newInstanceAsync(file)
        );
        for (
            let entry = await zip.getNextEntry();
            entry != null;
            entry = await zip.getNextEntry()
        ) {
            if (
                !(await entry.isDirectory()) &&
                (await entry.getName()).endsWith('.class')
            ) {
                const name: string = await entry.getName();
                const classFileName = name.replaceAll('/', '.');
                const className = classFileName.substring(
                    0,
                    classFileName.length - '.class'.length
                );

                if (
                    !classNames.includes(className) &&
                    !name.endsWith('/module-info.class') &&
                    patterns.some((pattern) => minimatch(className, pattern))
                ) {
                    classNames.push(className);
                }
            }
        }
    }

    return classNames;
}
