package com.github.markusjx.util;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;

import java.util.Optional;
import java.util.function.Consumer;

@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public class Either<A, B> {
    private final Optional<A> a;
    private final Optional<B> b;

    public static <A, B> Either<A, B> left(A a) {
        return new Either<>(Optional.of(a), Optional.empty());
    }

    public static <A, B> Either<A, B> right(B b) {
        return new Either<>(Optional.empty(), Optional.of(b));
    }

    public boolean isLeft() {
        return a.isPresent();
    }

    public boolean isRight() {
        return b.isPresent();
    }

    public A getLeft() {
        return a.orElseThrow();
    }

    public B getRight() {
        return b.orElseThrow();
    }

    public void acceptLeftIfPresent(Consumer<A> consumer) {
        a.ifPresent(consumer);
    }

    public void acceptRightIfPresent(Consumer<B> consumer) {
        b.ifPresent(consumer);
    }
}
