package com.github.markusjx.ast;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public class ClassField {
    public final String type;
    public final String name;
    public final FieldModifier[] modifiers;

    public static ClassField[] readFields(java.lang.Class<?> cls) {
        var res = new HashMap<String, ClassField>();
        for (var field : cls.getFields()) {
            if (!Modifier.isPublic(field.getModifiers())) {
                continue;
            }

            var type = field.getType().getTypeName();
            var name = field.getName();

            List<FieldModifier> mods = new ArrayList<>();
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) {
                mods.add(FieldModifier.STATIC);
            }

            if (java.lang.reflect.Modifier.isFinal(field.getModifiers())) {
                mods.add(FieldModifier.FINAL);
            }

            res.put(name, new ClassField(type, name, mods.toArray(FieldModifier[]::new)));
        }

        return res.values().toArray(ClassField[]::new);
    }
}
