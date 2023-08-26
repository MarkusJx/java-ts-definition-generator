package com.github.markusjx;

import com.github.markusjx.ast.Definitions;
import com.github.markusjx.util.Either;

public class Main {
    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();

        var string = Definitions.createSyntaxTree(new String[]{"java.lang.String"}, new String[0],
                Either.left(json -> {
                    //var def = gson.fromJson(json, Class.class);
                    //System.out.println(def.name);
                    //System.out.println(json);
                    //integer.incrementAndGet();
                }));
        string.toJson();

        long end = System.currentTimeMillis();
        System.out.println(end - start + "ms");
    }
}