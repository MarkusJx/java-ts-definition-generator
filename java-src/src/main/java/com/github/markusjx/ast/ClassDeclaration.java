package com.github.markusjx.ast;

import com.github.markusjx.json.JsonConvertible;
import com.github.markusjx.util.Helpers;

import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Stream;

public class ClassDeclaration implements JsonConvertible {
    public final String name;
    public final String simpleName;
    public final boolean isInterface;
    public final boolean isAbstractOrInterface;
    public final Map<String, ClassMethod[]> methods;
    public final ClassField[] fields;
    public final ClassConstructor[] constructors;
    public final String[] imports;

    public ClassDeclaration(String name, String simpleName, boolean isInterface,
                            boolean isAbstractOrInterface,
                            Map<String, ClassMethod[]> methods,
                            ClassField[] fields, ClassConstructor[] constructors
    ) {
        this.name = name;
        this.simpleName = simpleName;
        this.isInterface = isInterface;
        this.isAbstractOrInterface = isAbstractOrInterface;
        this.methods = methods;
        this.fields = fields;
        this.constructors = constructors;
        this.imports = this.calculateImports();
    }

    public static ClassDeclaration readClass(String name) throws ClassNotFoundException {
        Class<?> cls = Class.forName(name);
        String simpleName = name.substring(name.lastIndexOf('.') + 1);

        boolean isAbstractOrInterface = cls.isInterface() || Modifier.isAbstract(
                cls.getModifiers());
        boolean isInterface = cls.isInterface();

        return new ClassDeclaration(name, simpleName, isInterface, isAbstractOrInterface,
                Helpers.convertMap(ClassMethod.readMethods(cls), ClassMethod[]::new),
                ClassField.readFields(cls),
                ClassConstructor.readConstructors(cls));
    }

    private String[] calculateImports() {
        return Stream.concat(this.methods.values()
                                         .stream()
                                         .flatMap(Arrays::stream)
                                         .flatMap(m -> Stream.concat(Arrays.stream(
                                                 m.parameters), Stream.of(m.returnType)
                                                                      .filter(Helpers::nonPrimitive))),
                             Stream.concat(Arrays.stream(this.fields)
                                                 .map(f -> f.type)
                                                 .filter(Helpers::nonPrimitive),
                                     Arrays.stream(this.constructors)
                                           .flatMap(c -> Arrays.stream(c.parameters))))
                     .map(s -> s.replaceAll("\\[", "").replaceAll("]", ""))
                     .filter(Helpers::notObjectOrVoid)
                     .map(Helpers::primitiveToClassType)
                     .filter(s -> !s.equals(this.name))
                     .distinct()
                     .toArray(String[]::new);
    }
}
