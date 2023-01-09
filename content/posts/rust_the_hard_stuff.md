---
title: "Thinking about thinking about Rust lifetimes"
date: 2023-01-08T14:52:22-08:00
draft: true
---

Several years into my journey as a Rust hobbyist, I realized something:

I have a big problem with how lifetimes are taught.

All the documentation around lifetimes is factual. But I don't think it helps construct a useful mental model. At least, it didn't for me.

My mental model, which has become mostly reliable, looks nothing like the more traditional description of lifetimes.

In this article, I will try to explain lifetimes *as I understand them*, with some (rather crudely done) illustrations.

As the saying goes, "All models are wrong, but some are useful."

My goal here is not to teach you all the hard facts of lifetimes, but rather *how I think* about lifetimes.

## From the top

Instead of starting with code, let's start with some visualizations:

```goat
┌─────────────────────────────────────────────────────┐
│                                                     │
│ 'static                                             │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Above is the "static" lifetime. This is the lifetime that lasts for the duration of a Rust program.

In Rust, we frequently define lifetimes in terms of other lifetimes. This means it's natural to think of them as a tree, or a set of nesting hierarchical boxes.

Since `'static` is the topmost lifetime, you can therefore think of it as the root, in which all other lifetimes will live.

If we have a diagram that looks like this:

```goat
┌─────────────────────────────────────────────────────┐
│                                                     │
│ 'static                                             │
│                                                     │
│   ┌──────────────────────┐ ┌──────────────────────┐ │
│   │ 'a                   │ │ 'c                   │ │
│   │                      │ │                      │ │
│   │  ┌─────────────────┐ │ │                      │ │
│   │  │ 'b              │ │ │                      │ │
│   │  │                 │ │ │                      │ │
│   │  │                 │ │ │                      │ │
│   │  └─────────────────┘ │ │                      │ │
│   └──────────────────────┘ └──────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

We would say:

* `'static` is, as always, the topmost lifetime, encompassing all others.
* `'a` ends during `'static`.
* `'b` ends during `'a`.
* `'c` ends during `'static`.
* No relationship between `'a` and `'c` is established, even if one does exist.

Now let's imagine we have some objects that exist within these defined lifetimes.

I have added objects `x`, `y`, and `z`:

```goat
┌─────────────────────────────────────────────────────┐
│                                                     │
│ 'static                                             │
│                                                     │
│   let x = Foo;                                      │
│                                                     │
│   ┌──────────────────────┐ ┌──────────────────────┐ │
│   │ 'a                   │ │ 'c                   │ │
│   │                      │ │                      │ │
│   │   let y = Foo;       │ │                      │ │
│   │                      │ │                      │ │
│   │  ┌─────────────────┐ │ │                      │ │
│   │  │ 'b              │ │ │                      │ │
│   │  │                 │ │ │                      │ │
│   │  │    let z = Foo; │ │ │                      │ │
│   │  │                 │ │ │                      │ │
│   │  └─────────────────┘ │ │                      │ │
│   └──────────────────────┘ └──────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

After inspecting the above diagram, we would say:

* `x` lives the entire duration of `'static`, so it is accessible during all lifetimes encompassed within `'static`: `'static, 'a, 'b, 'c`
* `y` lives the entire duration of `'a`, so it is accessible during all lifetimes encompassed within `'a`: `'a, 'b`
* `z` lives the entire duration of `'b`, so it is accessible during all lifetimes encompassed within `'b`: `'b`

So far, I hope this seems intuitive.

Let's add some code into the mix. Say we have a function which takes a `&Foo` as input and returns a `&Bar` as output. Don't worry about what a `Foo` is or what a `Bar` is.

```rust
fn example(input: &Foo) -> &Bar {
    ...
}
```

As you probably know, the above function has had its lifetime declarations elided. Let's be extra-verbose and add them back in, to help illustrate:

```rust
fn example<'a>(input: &'a Foo) -> &'a Bar {
    ...
}
```

```goat
┌─────────────────────────────────────────────────────┐
│                                                     │
│ 'static                                             │
│                                                     │
│   ┌──────────────────────────────────────────────┐  │
│   │ '1                                           │  │
│   │                                              │  │
│   │   let y = Foo;                               │  │
│   │                                              │  │
│   │   example<'1>(&y) {                          │  │
│   │    ┌─────────────────┐                       │  │
│   │    │ '2              │                       │  │
│   │    │                 │                       │  │
│   │    │                 │                       │  │
│   │    │                 │                       │  │
│   │    └─────────────────┘                       │  │
│   │  }  --> &'1 Bar                              │  │
│   │                                              │  │
│   └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Let's say we have a function which takes a `&Foo` as input and returns a `&Bar` as output. Don't worry about what a `Foo` is or what a `Bar` is.

First, let's intentionally implement this incorrectly, to sho

## Part 1: Back to Basics

A "lifetime" is how long an object is alive.

When an object is alive, it can be accessed. When its lifetime is over, the object is no longer safe to access because it may no longer exist.

Rust keeps track of every object's lifetime for us.

*Every* time you borrow something (the `&` symbol), there is a lifetime automatically associated with that borrow. Every time.

<!-- The golden rule that Rust enforces for us is: you can borrow something, but you must finish using it *before* its lifetime ends.

Much of the time, when we borrow something, we can simply ignore its lifetime. Rust is very clever, and can usually enforce the golden rule without any extra work needed on the developer's part.

But in cases where the compiler cannot be sure - or cases that are simply ambiguous - we must tell the compiler our intentions. That is where lifetime syntax comes in. -->

Say you have a function.

```rust
fn example_1(input: &Vec<Foo>) -> &Bar {
    ...
}
```

Inspect the above function. Consider its input. Consider its output.

Don't worry about what a `Foo` is. Don't worry about what a `Bar` is.

What do we know, with absolute certainty, about the output?

Well, we know it is a reference, because of the `&`.

> **NOTE:** this document will use "reference" and "borrow" interchangeably.

We know the reference *must* point to a valid `Bar` somewhere.

Consider where that `Bar` must be.

It cannot be a `Bar` that is created within the scope of the function `example_1`.  If that were the case, the `Bar` would be destroyed when the function is over. Therefore, this must be a *pre-existing* `Bar`.

If `example_1` returns a reference to a pre-existing `Bar`, then it must somehow know how to find a pre-existing bar when it is called.

So how could it possibly find that `Bar`?

Well, the only things a function knows about are what you pass into it.

Therefore, it *must* be the case that the input (a vector of `Foo`s) can somehow let us borrow a `Bar`.

Or, in lifetime-speak:

```rust
fn example_1<'a>(input: &'a Vec<Foo>) -> &'a Bar {
    ...
}
```

We could read the above function as:

* There is an input, which is a reference to a vector. Like all things, the vector has a lifetime. We label it `'a`.
* There is an output, which is a reference to a Bar. That reference is only valid during `'a`.

Rust will allow you to write that function without include any of the lifetime syntax.  Why?  Because of the analysis we did earlier.  We *know* the only possible way the `&Bar` is valid is if it somehow comes from data owned by the vector of `Foo`s. The compiler also knows this.  This is an **unambiguous** case, so no lifetime syntax is needed.

Notice the above code mentions the lifetime `'a` three times. It can be confusing for new Rust developers to understand why, and what each instance means. I describe them as such:

* `fn example_1<'a>` means: "this is a function that is generic over some lifetime, which will be determined by the caller somehow."
* `input: &'a Vec<Foo>` means: "the caller will provide us a reference to some data, and this reference's lifetime becomes known to us as `'a`."
* `-> &'a Bar` means: "the returned value is a reference to a `Bar`, and this reference is only valid during `'a`, which was determined by the input reference provided by the caller."

But I hope by going through how the compiler is able to know this with certainty helped you strengthen your mental model, if just a little.

## Part 2: Laying the bricks

I told a little white lie earlier - I said:

> Well, the only thing a function knows about is what you pass into it.

Maybe you caught the lie. A function actually knows about *two* things:

1. Data you pass to it as arguments
1. Data that is globally available, marked `const` or `static`

Returning to the same function, this could be a valid implementation:

```rust
const GLOBAL_BAR: Bar = Bar;

fn example_1<'a>(input: &'a Vec<Foo>) -> &'a Bar {
    &GLOBAL_BAR
}
```

Look, we're returning a valid reference to a `Bar`, and we're not even using the input `Foo` vec at all!

Let's generalize what we learned earlier, to capture this case:

We *know* the only possible way the `&Bar` is valid is if it somehow comes from data ~~owned by the vector of `Foo`s~~ **that is alive the entire time the vec of `Foo`s is alive**.

A `Bar` that is constant/static passes that condition - it is alive the entire duration of the program, which obvious encompasses the lifetime of the vec of `Foo`s.
