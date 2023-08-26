package com.github.markusjx.json;

import com.google.gson.Gson;

public abstract class Json {
    private static final Gson gson = new Gson();

    public static String toJson(Object obj) {
        return gson.toJson(obj);
    }
}
