package com.github.markusjx.json;

public interface JsonConvertible {
    default String toJson() {
        return Json.toJson(this);
    }
}
