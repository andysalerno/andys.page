---
title: "Can I borrow a feeling?"
date: 2022-11-05T20:35:43-07:00
draft: true
---

Consider the following two functions:

```rust
fn borrow_something_1<T>(thing: &'static T) { ... }

fn borrow_something_2<T: 'static>(thing: &T) { ... }
```

My question to you is: how would you rate your ability to explain the difference between those two function signatures?

1. "I understand it perfectly well and could confidently explain it to a novice."
1. "I generally understand borrowing and lifetimes, but I'm not 100% sure in this case."
1. "I am completely at a loss and could not begin to explain the difference."

There's a reason I'm asking this. I'm asking because I was in that same position recently, and got a bit of a reality check. I thought I understood exactly the difference, but then when I began reaching for the words to explain it, I realized I couldn't.

I was particularly surprised at this hole in my knowledge because I do, in general, understand the concept of lifetimes. But the semantic distinction between `&'a` and `T: 'a` eluded me until only recently. Of course, I have encountered *both* syntaxes in my years of using Rust. I've typed those symbols. I have a mental model that guides me to use those in certain cases. But when I interrogate my mental model and ask it *why*, it doesn't always know the answer.

My goal, then, is to clear up my own confusion, and possibly guide other Rustaceans with the same confusion.

Before diving into details, let's try giving the final answer:

`&'a` is a marr

To begin understanding how they are different, let's imagine the following code:

```rust
trait FooFactory {
    fn make_foo(self) -> Foo;
}

fn work<T: FooFactory>(factory: T) {
    let foo = factory.make_foo();
}

```

We have:

- some trait `FooFactory`
- a function `work` that lets you pass any type by value, as long as that type is a `FooFactory`.  

Let's say we want to update `work` so that it executes in another thread:

```rust
fn work<T: FooFactory + Send>(factory: T) {
    thread::spawn(move || factory.make_foo());
}
```

Looks good, right? We even constrained `T` as `T: Send` to make sure it's something we can move to a thread.

There's a problem.

Once you spawn a thread, you have no way of knowing when it will end.

Maybe it will exit immediately. Maybe it will run for the rest of your program.

The problem is, the method `work` will accept **any** T, as long as it is a `FooFactory`.

But what about this implementation:

```rust
struct MyFooFactory<'a> {
    some_ref: &'a String
}

impl<'a> FooFactory for MyFooFactory<'a> {
    ... 
}
```

You can probably see the problem. `MyFooFactory` is indeed a `FooFactory`, but it holds a reference to a `String`.

When we send our `MyFooFactory` to another thread, how can Rust be sure that the new thread won't outlast the referenced `String`?

Rust does this by putting a requirement on `std::thread::spawn(...)`: when you pass it your closure of type `T`, Rust requires that `T: 'static`.

## old section

Both functions are generic.

Both take a reference to some type `T`.

Both mention the `'static` lifetime, in different ways.

The first function says: "You must give me a reference to a `T`, and that reference must be valid for the duration of the program."

The second function says: "You must give me a reference to a `T`, and the type `T` must not have any references, unless those references are valid for the duration of the program."

Those might sound like similar explanations, but in practice they are very different. Consider the following:

```rust
struct Foo;

fn borrow_something_1<T>(thing: &'static T) {}

fn example() {
    let foo = Foo;

    borrow_something_1(&foo);
}

```

The above code does not build, and you can probably figure out why - clearly `foo` does not live as long as `'static`. It is local to the `example()` function, after all.

Now what about this code:

```rust
struct Foo;

fn borrow_something_2<T: 'static>(thing: &T) {}

fn example() {
    let foo = Foo;

    borrow_something_2(&foo);
}

```

This *does* build! Why? In this example, the `'static` constraint is on the *type*, not the *reference*. This function will happily take a non-`'static` reference.  In the first example, we didn't need to know anything about type `Foo` - there were no constraints on `T`. In this example, however, the function requires that `T` must not have any references, unless they are valid for `'static`.

Since `T` is chosen to be `Foo`, and `Foo` holds no references, then `Foo` meets the constraint.

*you must be this tall to ride* image
