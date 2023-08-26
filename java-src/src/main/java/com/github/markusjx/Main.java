package com.github.markusjx;

import com.github.markusjx.ast.Definitions;

public class Main {
    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();

        var string = Definitions.createSyntaxTree("java.lang.String");
        string.toJson();

        long end = System.currentTimeMillis();
        System.out.println(end - start + "ms");
    }
}