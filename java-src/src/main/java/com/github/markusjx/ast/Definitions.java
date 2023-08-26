package com.github.markusjx.ast;

import com.github.markusjx.json.JsonConvertible;
import com.github.markusjx.util.Either;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.function.Consumer;

@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public class Definitions implements JsonConvertible {
    public final String[] root;
    public final Class[] classes;

    public static Definitions createSyntaxTree(String... name
    ) throws ClassNotFoundException {
        return createSyntaxTree(name, new String[0], null);
    }

    public static Definitions createSyntaxTree(String[] name,
                                               String[] alreadyResolvedClasses,
                                               Either<Consumer<String>, Consumer<Class>> consumer
    ) throws ClassNotFoundException {
        var res = new ArrayList<Class>();
        var queue = new LinkedBlockingQueue<>(Arrays.asList(name));
        var resolvedClasses = new HashSet<>(Arrays.asList(alreadyResolvedClasses));

        var cur = queue.poll();
        while (cur != null) {
            resolvedClasses.add(cur);
            var resolved = Class.readClass(cur);

            if (consumer != null) {
                consumer.acceptLeftIfPresent(c -> c.accept(resolved.toJson()));
                consumer.acceptRightIfPresent(c -> c.accept(resolved));
            }

            queue.addAll(Arrays.stream(resolved.imports)
                               .filter(s -> !resolvedClasses.contains(
                                       s) && !queue.contains(s))
                               .toList());
            res.add(resolved);
            cur = queue.poll();
        }

        return new Definitions(name, res.toArray(Class[]::new));
    }
}
