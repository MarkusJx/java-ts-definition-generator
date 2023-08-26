package com.github.markusjx.util;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.IntFunction;

public abstract class Helpers {
    public static String primitiveToClassType(String type) {
        return switch (type) {
            case "boolean" -> "java.lang.Boolean";
            case "byte" -> "java.lang.Byte";
            case "char" -> "java.lang.Character";
            case "short" -> "java.lang.Short";
            case "int" -> "java.lang.Integer";
            case "long" -> "java.lang.Long";
            case "float" -> "java.lang.Float";
            case "double" -> "java.lang.Double";
            default -> type;
        };
    }

    public static boolean nonPrimitive(String type) {
        return switch (type) {
            case "boolean", "byte", "char", "short", "int", "long", "float", "double" ->
                    false;
            default -> true;
        };
    }

    public static <T> Map<String, T[]> convertMap(Map<String, List<T>> map,
                                                  IntFunction<T[]> generator
    ) {
        var res = new HashMap<String, T[]>();
        for (var entry : map.entrySet()) {
            res.put(entry.getKey(), entry.getValue().toArray(generator));
        }

        return res;
    }

    public static boolean notObjectOrVoid(String type) {
        return !type.equals("java.lang.Object") && !type.equals("void") && !type.equals(
                "java.lang.Void");
    }
}
