---
title: "Visualizing lifetime constraints"
date: 2022-07-24T17:49:28-07:00
draft: true
---

As you spend more and more time writing code in Rust, something interesting starts to happen.

An instinct begins to form regarding lifetimes. A fuzzy, hazy intuition. You become attuned to lifetimes. You begin to *feel* when you are about to violate lifetime rules.  Like a sixth sense.

Of course, this intuition is not as robust as the actual borrow checker; it is merely a useful approximation. But as you become more experienced, your mental model becomes more refined.

I'd like to try visualizing this mental model - well, *my* mental model, at least.

My goal is **not** to create a *formally correct* representation of lifetimes. I simply want to draw out the geometric shapes that form in my imagination when I am thinking about Rust code.

It won't be perfect. It won't be consistent.  It won't even necessarily be "correct". In fact, I'm sure it will be "wrong" in many cases - but wrong in a way that is still *useful*.

Let's start easy:

```rust
fn borrow_something(s: &Foo) -> &Foo {
    s
}
```

Remember, the above function has undergone lifetime elision - a helpful simplification. In reality, it desugars to this:

```rust
fn borrow_something<'a>(s: &'a Foo) -> &'a Foo {
    s
}
```

When I see the above code, my mental model appears roughly like this:

{{< figure src="2.png" >}}

A brief explanation:

* the top level lifetime is always `'static`
* the execution of our function is happening within some parent lifetime `'1`. This lifetime is determined by the `&Foo` that is passed in.
* since the execution of `borrow_something()` entirely begins and ends within the scope of `'1`, it is shown as existing entirely "inside" the `'1` lifetime.
* the object of type `Foo` is borrowed, and the reference (borrow) is passed into `borrow_something()`.
* the function `borrow_something()` returns a `&Foo`, with the lifetime of the parent `'1`

Note that the returned `&Foo` reference does not visually point back to the `Foo` that was passed in. Even though the reference is the same in this code example, we can construct examples where that's not the case, or where it is unknown at compile time. Let's try one.

Spend some time absorbing this code sample:

```rust
#[derive(Debug)]
struct Bar;

struct Foo<'a> {
    pub bar: &'a Bar,
}

fn pick_bar<'a>(foo1: &'a Foo, foo2: &'a Foo) -> &'a Bar {
    if random() {
        foo1.bar
    } else {
        foo2.bar
    }
}

fn example() {
    let bar1 = Bar;
    let bar2 = Bar;

    let foo1 = Foo { bar: &bar1 };
    let foo2 = Foo { bar: &bar2 };

    let my_bar = pick_bar(&foo1, &foo2);
}

```

Here's my mental visualization of the preceding code:

{{< figure src="3.png" >}}

It's a minor detail, but note the direction of the arrows:

* When object A holds a reference to object B, I draw the arrow from A --> B
* When object A is passed into function F, I draw the arrow from A --> F
* If the object is passed into a function via reference, I add `&` to the arrow.

In the above example, we don't know which `Bar` was given back to us via reference. The Rust compiler doesn't know, either. The only thing we know for sure is that the lifetime `'1` applies to whatever was returned.

So far, there's nothing too exciting here. Let's modify the above example a bit:

```rust
fn example_modified() {
    let bar1 = Bar;
    let bar2 = Bar;

    let foo1 = Foo { bar: &bar1 };
    let foo2 = Foo { bar: &bar2 };

    let my_bar = pick_bar(&foo1, &foo2);

    // Added line to drop foo1:
    drop(foo1);

    // Added line to print my_bar:
    println!("my bar: {my_bar:?}");
}
```

Maybe you can detect the error in the modified code.

We are dropping `foo1`, and then trying to use `my_bar`. This is a classic lifetime violation.

As long as we are holding the reference `my_bar`, we are also borrowing `foo1` and `foo2`.

This is because the function definition for `pick_bar()` establishes the *return value* lifetime based on the *input value* lifetimes. Since parameters `foo1` and `foo2` both associate with lifetime `'a`, this means the shortest-lived of the two is selected. The output is then bound by that lifetime: it must not outlive anything with lifetime `'a`, since it *must* depend on one of the inputs (or be `'static`), and *could possibly* depend on any one of them (or more).

In my mental model, this is represented visually by the flow of arrows.  We can trace the returned `&Bar` back to the two `Foo`s, which means they remain borrowed as long as the returned `&Bar` is held.

{{< figure src="4.png" >}}

It's important to note that *any* reference with the same lifetime will encounter this limitation.

For exmaple, let's update the `pick_bar()` function so it takes a `&'a str`:

```rust
fn pick_bar<'a>(foo1: &'a Foo, foo2: &'a Foo, s: &'a str) -> &'a Bar {
    if random() {
        foo1.bar
    } else {
        foo2.bar
    }
}
```

Note that we don't even need to *use* the `str`. What matters is the lifetime `'a` that we have established for the reference.

The following code will now fail:

```rust
fn example() {
    let bar1 = Bar;
    let bar2 = Bar;

    let foo1 = Foo { bar: &bar1 };
    let foo2 = Foo { bar: &bar2 };

    let s = String::from("testing");

    let my_bar = pick_bar(&foo1, &foo2, &s);
    //                                  -- borrow of `s` occurs here

    // Error: cannot move out of `s` because it is borrowed
    drop(s);
    //   ^ move out of `s` occurs here

    println!("my bar: {my_bar:?}");
    //                 ------ borrow later used here
}
```

Obviously, we know that `my_bar` is not depending on `s` in any way.

But Rust is validating the lifetimes, and we have established that the references `&'1 foo1`, `&'1 foo2`, and `&'1 s` are bounded by the same lifetime `'1`.

This means they remain borrowed as long as the *result* of the function is held, since that result is associated with life time `'1`.

{{< figure src="5.png" >}}

Let's fix the above code by telling Rust that the lifetime for the `&str` should not be associated at all with the lifetime for the input `&Foo` or the output `&Bar`. We do this by adding another generic lifetime and letting it attach to the `&str` input:

```rust
fn pick_bar<'a, 'b>(foo1: &'a Foo, foo2: &'a Foo, s: &'b str) -> &'a Bar {
    if random() {
        foo1.bar
    } else {
        foo2.bar
    }
}
```

Now, Rust knows that there is no correlation established between `'a` and `'b`.

`'a` will be determined based on the input `&'a Foo`s, and `'b` will be determined by the input `&'b str`, and the output `&'a Bar` will only be associated with the input `&'a Foo`s.

Note that we *could* tell Rust that there is some relationship between `'a` and `'b`, like so:

```rust
fn pick_bar<'a, 'b>(foo1: &'a Foo, foo2: &'a Foo, s: &'b str) -> &'a Bar
where
    'b: 'a,
{
    if random() {
        foo1.bar
    } else {
        foo2.bar
    }
}
```

The above constraint `'b: 'a` says that the lifetime `'b` *outlives* the lifetime `'a`.


-----

I have a confession: I get confused by lifetimes in Rust.

Not long ago, I (foolishly) thought that I had a robust understanding. Here is something I may have told you:

> Lifetimes are easy! References cannot outlive the thing they refer to. A type that holds references to other things cannot outlive those things. Lifetimes track how long things live. What's not to get?  
> \- my hubris, circa 2021

That simplistic explanation of lifetimes is all well and good. But it does nothing to help you understand the difference between these two functions:

```rust
fn borrow_something_1<T>(thing: &'static T) {
    // some impl
}

fn borrow_something_2<T: 'static>(thing: &T) {
    // some impl
}
```

My point is, understanding what lifetimes *are* is not the same as understanding how lifetimes *work*.

If you're like me, as you spend more time writing Rust, an instinct begins to form in your mind regarding lifetimes.  You become attuned to them.  You begin to *feel* how they work. This fuzzy intuition is not as robust as the actual borrow checker; it is merely a useful approximation. The compiler does not work on intuition, it works on rules.

*But*, your brain is not a compiler, unfortunately. A fuzzy, useful approximation is as close as we can get to reality.

So let's try to visualize that approximation. Let's try to take our limited mental model, and see what it looks like. And, if possible, let's challenge that model, and try to make it even better.

Let's start easy.

Here is a function in Rust:

```rust
fn borrow_something(s: &Foo) -> &Foo {
    s
}
```





First, let me clarify what I am *not* attempting to do:

* I am not attempting to create a formally correct representation of lifetimes. These visualizationas are merely a projection of my mental model, and as such they may only be correct in only a "fuzzy" sense.
* I am not trying to propose a strict set of rules for these diagrams. I am simply creating them by hand, in Excalidraw, to represent the state of my mental model when I am observing Rust code.

In short, "all models are wrong, but some are useful." In this case, I am not attempting to capture all the complexity of lifetimes; rather, I am trying to visualize my mental model, which I find "useful" even if it is "wrong".

{{< figure src="1.png" >}}

```rust
struct Bar;

struct Foo<'a> {
    pub bar: &'a Bar,
}

fn pick_bar<'a>(foo_1: &'a Foo, foo_2: &'a Foo) -> &'a Bar {
    if true {
        foo_1.bar
    } else {
        foo_2.bar
    }
}

fn example() {
    let bar = Bar;

    let foo_1 = Foo { bar: &bar };
    let foo_2 = Foo { bar: &bar };

    let my_bar = pick_bar(&foo_1, &foo_2);
}
```

## old section
I have a confession.

I get confused by lifetimes in Rust.

Not long ago, I would have bragged to you that *of course* I understood lifetimes. They're easy! References cannot outlive the thing they refer to. A type that holds references to other things cannot outlive those things. Lifetimes track how long things live. What's not to get?

But what if, back then, you showed me these two functions, and asked me... what's the difference?

```rust
fn borrow_something_1<T>(thing: &'static T) {
    // some impl
}

fn borrow_something_2<T: 'static>(thing: &T) {
    // some impl
}
```

Uh oh. Confronted by my own hubris, I would have probably made an awkward getaway.

You see, understanding what lifetimes *are* and understanding how lifetimes *work* are two very different things. If you're like me, you simply write code until you hit a compiler error that mentions a lifetime, then you slap a `<'a>` here and there until everything works again. Eventually you start to gain a sort of third eye, and you begin to *feel* when you are about to violate a lifetime constraint, and you acquire instinct for avoiding lifetime errors.

But even with this instinct, you are not satisfied. Compilers do not operate on instinct. They operate on rules, and you want to know them.

So you read and re-read the Rust book, and blog posts, and StackOverflow, and everything you read makes sense, and you learn a bit. And yet, it does not stick.

Personally, I cannot remember rules well. I think better spatially or visually. So let's break this problem down, and try to build a mental model that will last.

## Problem 1: `&'a T` vs `T: 'a`

Revisiting the two functions from earlier:

```rust
fn borrow_something_1<T>(thing: &'static T) {
    // some impl
}

fn borrow_something_2<T: 'static>(thing: &T) {
    // some impl
}
```

These two functions look similar, but they are very different.

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
* some trait `FooFactory`
* a function `work` that lets you pass any type by value, as long as that type is a `FooFactory`.  

Let's say we want to update `work` so that it executes in another thread:

```rust
fn work<T: FooFactory + Send>(factory: T) {
    std::thread::spawn(move || factory.make_foo());
}
```

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
    fn make_foo(self) -> Foo {
        unimplemented!()
    }
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
