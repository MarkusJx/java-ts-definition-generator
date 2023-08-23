import ts from 'typescript';

export default class ClassMembers {
    public readonly classMembers: ts.ClassElement[] = [];
    public readonly interfaceDeclaration: (ts.Node | null)[] = [];

    public constructor() {}

    public addMembers(...members: ts.ClassElement[]) {
        this.classMembers.push(...members);
    }

    public addInterfaceDeclaration(...members: (ts.Node | null)[]) {
        this.interfaceDeclaration.push(...members);
    }
}
