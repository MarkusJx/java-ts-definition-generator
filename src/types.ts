/**
 * A java class declaration converted to typescript
 */
export interface ModuleDeclaration {
    /**
     * The fully-qualified class name
     */
    name: string;
    /**
     * The generated typescript code
     */
    contents: string;
}

/**
 * A callback which is called every time typescript
 * definitions are generated for a java class.
 *
 * @param currentClass the class(es) which are currently converted
 */
export type ConvertCallback = (currentClass: string | string[]) => void;
