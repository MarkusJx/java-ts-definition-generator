package com.github.markusjx.ast;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;

@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public class ClassConstructor {
    public final String[] parameters;

    public static List<ClassConstructor> readConstructors(java.lang.Class<?> cls) {
        return Arrays.stream(cls.getDeclaredConstructors())
                     .filter(c -> Modifier.isPublic(c.getModifiers()))
                     .map(c -> Arrays.stream(c.getParameterTypes())
                                     .map(java.lang.Class::getTypeName)
                                     .toArray(String[]::new))
                     .map(ClassConstructor::new)
                     .toList();
    }
}
