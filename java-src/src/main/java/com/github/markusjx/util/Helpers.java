package com.github.markusjx.util;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.IntFunction;

public abstract class Helpers {
    public static String primitiveToClassType(String type) {
        switch (type) {
            case "boolean":
                return "java.lang.Boolean";
            case "byte":
                return "java.lang.Byte";
            case "char":
                return "java.lang.Character";
            case "short":
                return "java.lang.Short";
            case "int":
                return "java.lang.Integer";
            case "long":
                return "java.lang.Long";
            case "float":
                return "java.lang.Float";
            case "double":
                return "java.lang.Double";
            default:
                return type;
        }
    }

    public static boolean nonPrimitive(String type) {
        switch (type) {
            case "boolean":
            case "byte":
            case "char":
            case "short":
            case "int":
            case "long":
            case "float":
            case "double":
                return false;
            default:
                return true;
        }
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
