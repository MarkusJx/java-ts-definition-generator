# Java typescript definition generator

This is the typescript definition generator for the [`java-bridge`](https://github.com/MarkusJx/node-java-bridge) package.
It generates typescript definitions for java classes and interfaces.

It can either be invoked from the command line or used as a library.

## Installation

_Note: You need to install `java-bridge` separately_

```bash
npm install -g java-ts-definition-generator java-bridge
```

## Command line usage

```
java-ts-gen <output> <classnames..>

Positionals:
  classnames  The fully qualified class name(s) to convert              [string]
  output      The output file                                           [string]

Options:
  --help             Show help                                         [boolean]
  --version          Show version number                               [boolean]
  --classpath, --cp  The classpath to use                               [string]
  --syncSuffix       The sync suffix                                    [string]
  --asyncSuffix      The async suffix                                   [string]
  --customInspect    Whether to enable the 'customInspect' option      [boolean]
```

### Notes

-   The classpath argument can be supplied multiple times to add multiple jars to the classpath
-   Multiple class names can be supplied to generate definitions for multiple classes
-   The generated typescript files will automatically import all classes once the module is loaded.

### Examples

#### Generate definitions for a single class

Generate definitions for the `java.lang.String` class and all its referenced classes and save them to `./project`:

```bash
java-ts-gen ./project java.lang.String
```

This will create a directory called `java` containing the definitions for the `java.lang.String` class and all its
dependencies all inside subdirectories. The `java.lang.String` class will be saved to `./project/java/lang/String.ts`.
Thus, the folder structure of `project` will look something like this:

```
.
├── ...
├── java
│   ├── lang
│   │   ├── String.ts
│   │   ├── Object.ts
│   │   └── ...
│   ├── util
│   │   └── ...
│   └── ...
└── ...
```

#### Generate definitions for multiple classes

Generate definitions for the `java.lang.String` and `java.util.ArrayList` classes and all of their dependencies
and save them to `./project`:

```bash
java-ts-gen ./project java.lang.String java.util.ArrayList
```

## Library usage

```ts
import { TypescriptDefinitionGenerator } from 'java-ts-definition-generator';

const generator = new TypescriptDefinitionGenerator('java.lang.String');
// Generate the typescript definitions
const definitions = await generator.generate();

// Save the definitions to a directory
await TypescriptDefinitionGenerator.save(definitions, './project');
```

### Generate definitions for multiple classes

```ts
const generator = new TypescriptBulkDefinitionGenerator();

// Generate definitions for the provided modules
await generator.generate([
    'java.lang.String',
    'java.util.List',
    'java.util.Map',
    'java.io.FileOutputStream',
    'java.io.FileInputStream',
    'java.io.File',
    'java.lang.System',
]);

// Save the definitions to a directory
await generator.save('javaDefinitions');
```
