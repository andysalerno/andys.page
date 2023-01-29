---
title: "Thinking about thinking about Rust lifetimes"
date: 2023-01-08T14:52:22-08:00
draft: true
---

Many programmers are drawn to Rust with an enticing promise:

*The learning curve will be steep -- but surmount it, and you will find yourself in **memory safety Nirvana!***

So those brave Rust beginners 

Let's talk about object-oriented programming for a second.

Object-oriented programming was successful because it's easy to reason about.  In fact, it perfectly matches the *natural* way we think. The world is full of "things". And "things" can do "actions". A `Dog` can `.bark()`. A `Vehicle` can `.travel()`. A `Bike` **is a** `Vehicle`, therefore it can `.travel()`. And "things" have state. The `Bike.color` can be `Color::Red`. And so on.

// Back to lifetimes. Lifetimes... do not really match intuitively with any other model we encounter day-to-day.
// Need to mention: https://blog.adamant-lang.org/2019/rust-lifetime-visualization-ideas/

Back to lifetimes. Lifetimes... are difficult to model in our minds. They are hard to reason about, harder to explain, hardest to abstractly represent. They are closer to mathematical proofs than they are to anything in the "natural world".

> Intrusive thought: "You can't compare lifetimes with OOP! Those solve entirely different problems!"
>
> I'm not comparing *what they do*, I am comparing *how we think about them*.

Rust, as a language, does not really do anything to make lifetimes *easier*. All it does is require your lifetimes to be *correct.*

The documentation does a wonderful job explaining what lifetimes are, what their rules are, and how they work.

It does not do a particularly good job in showing you how to think about them.

At this point, I ask you: when you look at the following code, how does your mind represent it? What shapes, structures, colors, or patterns do you see? How would you draw it abstractly?

```rust
fn example(input: &Foo) -> &Bar {
    ...
}
```

Obviously, I cannot answer for you. But I can share my answer, and hope it helps someone -- or better yet, learn from the answers of others.

In this article, I will try to explain lifetimes *as I understand them*, with some (rather crudely done) illustrations.

As the saying goes, "All models are wrong, but some are useful."

It is *wrong* to think of lifetimes as scopes. But it is *useful* to think of lifetimes as scopes.

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

Inspect the above function. Consider its input. Consider its output.

If we have a diagram that looks like this:

```goat
┌─────────────────────────────────────────────────────┐
│                                                     │
│ 'static                                             │
│                                                     │
│   ┌──────────────────────┐ ┌──────────────────────┐ │
│   │ 'blue                │ │ 'green               │ │
│   │                      │ │                      │ │
│   │  ┌─────────────────┐ │ │                      │ │
│   │  │ 'red            │ │ │                      │ │
│   │  │                 │ │ │                      │ │
│   │  │                 │ │ │                      │ │
│   │  └─────────────────┘ │ │                      │ │
│   └──────────────────────┘ └──────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

We would say:

* `'static` is, as always, the topmost lifetime, encompassing all others.
* `'blue` ends during `'static`.
* `'red` ends during `'blue`.
* `'green` ends during `'static`.
* No relationship between `'blue` and `'green` is established, even if one does exist.

It should be intuitive that *all the data that exists during `'blue` also exists during `'red`.*

It should be intuitive that *during `'blue`, we can't assume that data from `'red` is still alive.*

---

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
│   │ 'blue                │ │ 'green               │ │
│   │                      │ │                      │ │
│   │   let y = Foo;       │ │                      │ │
│   │                      │ │                      │ │
│   │  ┌─────────────────┐ │ │                      │ │
│   │  │ 'red            │ │ │                      │ │
│   │  │                 │ │ │                      │ │
│   │  │    let z = Foo; │ │ │                      │ │
│   │  │                 │ │ │                      │ │
│   │  └─────────────────┘ │ │                      │ │
│   └──────────────────────┘ └──────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

After inspecting the above diagram, we would say:

* `x` lives the entire duration of `'static`, so it is accessible during all lifetimes encompassed within `'static`: `'static, 'blue, 'red, 'green`
* `y` lives the entire duration of `'blue`, so it is accessible during all lifetimes encompassed within `'blue`: `'blue, 'red`
* `z` lives the entire duration of `'red`, so it is accessible during all lifetimes encompassed within `'red`: `'red`

So far, I hope this seems intuitive.

Let's bring back our code from earlier. Say we have a function which takes a `&Foo` as input and returns a `&Bar` as output. Don't worry about what a `Foo` is or what a `Bar` is.

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
│   │ 'blue                                        │  │
│   │                                              │  │
│   │   let y = Foo;                               │  │
│   │                                              │  │
│   │   example<'blue>(&'blue y) {                 │  │
│   │    ┌─────────────────┐                       │  │
│   │    │ 'red            │                       │  │
│   │    │                 │                       │  │
│   │    │  [black box]    │                       │  │
│   │    │                 │                       │  │
│   │    └─────────────────┘                       │  │
│   │  }  --> &'blue Bar                           │  │
│   │                                              │  │
│   └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Remember, in `example<'a>()`, `'a` is essentially a generic value. It gets replaced with the "real" lifetime when we call it. 

Since we are calling it with argument `&y`, the generic `'a` is replaced with the lifetime of `y`, which we are calling `'blue`.

If the compiler is ever unable to decide between lifetime `'purple` and lifetime `'orange`, it will always be pessimistic and pick the *shortest* one, because it must handle the worst-case scenario.

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