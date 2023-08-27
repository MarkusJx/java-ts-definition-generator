package com.github.markusjx.ast;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import java.lang.reflect.Modifier;
import java.util.*;

@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public class ClassMethod {
    public final String name;
    public final FieldModifier[] modifiers;
    public final String[] parameters;
    public final String returnType;

    public static Map<String, List<ClassMethod>> readMethods(Class<?> cls) {
        Map<String, List<ClassMethod>> methods = new HashMap<>();
        for (var method : cls.getMethods()) {
            if (!Modifier.isPublic(method.getModifiers())) {
                continue;
            }

            String name = method.getName();
            String returnType = method.getReturnType().getTypeName();
            String[] parameters = Arrays.stream(method.getParameterTypes())
                                        .map(java.lang.Class::getTypeName)
                                        .toArray(String[]::new);

            List<FieldModifier> mods = new ArrayList<>();
            if (Modifier.isStatic(method.getModifiers())) {
                mods.add(FieldModifier.STATIC);
            }

            if (Modifier.isFinal(method.getModifiers())) {
                mods.add(FieldModifier.FINAL);
            }

            if (method.isDefault()) {
                mods.add(FieldModifier.DEFAULT);
            }

            if (methods.containsKey(name)) {
                methods.get(name)
                       .add(new ClassMethod(name, mods.toArray(FieldModifier[]::new),
                               parameters, returnType));
            } else {
                methods.put(name, new ArrayList<>(Collections.singletonList(
                        new ClassMethod(name, mods.toArray(FieldModifier[]::new),
                                parameters, returnType))));
            }
        }

        return methods;
    }
}
