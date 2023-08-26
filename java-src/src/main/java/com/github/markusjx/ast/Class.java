package com.github.markusjx.ast;

import com.github.markusjx.json.JsonConvertible;
import com.github.markusjx.util.Helpers;

import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Stream;

public class Class implements JsonConvertible {
    public final String name;
    public final String simpleName;
    public final boolean isInterface;
    public final boolean isAbstractOrInterface;
    public final Map<String, ClassMethod[]> methods;
    public final ClassField[] fields;
    public final ClassConstructor[] constructors;
    public final String[] imports;

    public Class(String name, String simpleName, boolean isInterface,
                 boolean isAbstractOrInterface, Map<String, ClassMethod[]> methods,
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

    public static Class readClass(String name) throws ClassNotFoundException {
        var cls = java.lang.Class.forName(name);
        var simpleName = name.substring(name.lastIndexOf('.') + 1);

        var isAbstractOrInterface = cls.isInterface() || Modifier.isAbstract(
                cls.getModifiers());
        var isInterface = cls.isInterface();

        return new Class(name, simpleName, isInterface, isAbstractOrInterface,
                Helpers.convertMap(ClassMethod.readMethods(cls), ClassMethod[]::new),
                ClassField.readFields(cls).toArray(ClassField[]::new),
                ClassConstructor.readConstructors(cls).toArray(ClassConstructor[]::new));
    }

    private String[] calculateImports() {
        return Stream.concat(this.methods.values()
                                         .stream()
                                         .flatMap(Arrays::stream)
                                         .flatMap(m -> Stream.concat(Arrays.stream(
                                                 m.parameters), Stream.of(m.returnType))),
                             Stream.concat(Arrays.stream(this.fields).map(f -> f.type),
                                     Arrays.stream(this.constructors)
                                           .flatMap(c -> Arrays.stream(c.parameters))))
                     .map(s -> s.replaceAll("\\[", "").replaceAll("]", ""))
                     .filter(Helpers::notObjectOrVoid)
                     .map(Helpers::primitiveToClassType)
                     .distinct()
                     .toArray(String[]::new);
    }
}
