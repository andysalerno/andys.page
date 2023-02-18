---
title: "Thinking about thinking about Rust lifetimes"
date: 2023-01-08T14:52:22-08:00
draft: true
---

This document is broken down into parts:

**Part 1**, wherein we describe lifetimes from first principles.

**Part 2**, wherein we consider how to mentally represent lifetimes.

The intended audience for this document is a programmer who has some experience with Rust, and has a basic understanding of lifetimes, but who finds it difficult to *think about* lifetimes and gets confused by their syntax.

## Part 1: First Principles

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

It cannot be a `Bar` that is created within the scope of the function `example_1`.  If that were the case, the `Bar` would be destroyed when the function is over. We can't return a reference to a destroyed `Bar`. Therefore, this must be a *pre-existing* `Bar`.

If `example_1` returns a reference to a pre-existing `Bar`, then it must somehow know how to find a pre-existing `Bar` when it is called.

So where could it possibly find that `Bar`?

Well, the only data a function knows about are what you pass into it.

The only thing we are passing in is a reference to a `Vec` of `Foo`s. Therefore, it *must* be the case that the input (the `Vec` of `Foo`s) can somehow let us borrow a `Bar`.

If the `Vec<Foo>` is letting us borrow a `Bar`, then we could assume the `Vec<Foo>` is the "owner" of some `Bar`.

But what happens when the `Vec<Foo>` is destroyed? Everything it owns, including the `Bar`, will also be destroyed.

Backing up a moment. Imagine you are the caller of `example_1`. Immediately after `example_1` returns, you certainly have two things in scope:

- The `&Bar` that was just returned.
- The `&Vec<Foo>` that you passed in when you called `example_1`.

Visualizing it:

```rust
fn caller() {
    let v = Vec::new(); // a Vec<Foo>
    let b = example_1(&v); // returns &Bar to us
}
```

Consider the relationship between these two values.

You may not see this visually in your code editor, but those two values are connected somehow. You might say these two values are **entangled** (*not official terminology, I just like that word*). There is some relationship between them.

The relationship is this: The reference `&Bar` depends on `Vec<Foo>` existing. If the `Vec<Foo>` ceases to exist, our `&Bar` is no longer valid.

> Furthurmore, the `Vec<Foo>` remains *immutably borrowed* as long as the `&Bar` is alive. The longer we keep the `&Bar`, the longer the `Vec<Foo>` is borrowed. In this way, the interaction is oddly bi-directional. That is, the `&Bar` depends on the `Vec<Foo>` because it cannot live after the `Vec<Foo>` is destroyed, and the `&Vec<Foo>` depends on the `&Bar` because its remains borrowed until `&Bar` is over. (I'm tempted to call this *spooky action at a distance* but that seems a bit much).

All that being said, Rust must allow us to represent this relationship somehow. So finally we introduce the lifetime syntax.

In lifetime-speak:

```rust
fn example_1<'a>(input: &'a Vec<Foo>) -> &'a Bar {
    ...
}
```

We could read the above function as:

- There is an input, which is a reference to a `Vec`. Like all things, the `&Vec` has a lifetime. We label it `'a`.
- There is an output, which is a reference to a `Bar`. That reference is only valid during `'a`.

As you know, Rust will allow you to write that function without including any of the lifetime syntax.  Why?  Because of the analysis we did earlier.  We *know* the only possible way the `&Bar` is valid is if it somehow comes from data owned by the vector of `Foo`s. The compiler also knows this.  This is an **unambiguous** case, so no lifetime syntax is needed.

Notice the above code mentions the lifetime `'a` three times. It can be confusing for new Rust developers to understand why, and what each instance means. I describe them as such:

- `fn example_1<'a>` means: "this is a function that is generic over some lifetime, which will be determined by the caller somehow."
- `input: &'a Vec<Foo>` means: "the caller will provide us a reference to some data, and this reference's lifetime becomes known to us as `'a`."
- `-> &'a Bar` means: "the returned value is a reference to a `Bar`, and this reference is only valid during `'a`, which was determined by the input reference provided by the caller."

This is, admittedly, an extremely simple scenario. But I hope there was a *click* in your mind.

### Part 1 (cont): Delving deeper

I lied earlier - I said:

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

Look, we're returning a valid reference to a `Bar`, and we're not even using the input `Foo` at all!

Since `&GLOBAL_BAR` is `'static`, and `'static` is the topmost lifetime which encompasses all other lifetimes (including `'a`), this means it is also a valid source for our `&Bar`.

Let's generalize what we learned earlier, to capture this case:

We *know* the only possible way the `&Bar` is valid is if it somehow comes from data ~~owned by the vector of `Foo`s~~ **that is alive at the time the function is called.** And the lifetime of the returned reference may come from the input, or from a larger lifetime such as `'static`.

### Part 1 (cont): More lies

Hold on.

Something is still not right. Let me repeat that last part:

> And the lifetime of the returned reference may come from the input, or from a larger lifetime such as `'static`.

There is yet another adjustment we need to make to our understanding.

Consider the following code, which does **not** compile:

```rust
const GLOBAL_BAR: Bar = Bar;

fn main() {
    let ref_to_global_bar = example_1(&Vec::new());

    println!("Found it: {:?}", ref_to_global_bar);
}

fn example_1<'a>(input: &'a Vec<Foo>) -> &'a Bar {
    &GLOBAL_BAR
}
```

I bet you can figure out pretty quickly which part is wrong.

But let me ask you -- *why* is it wrong?

First, the "what". We are creating our `Vec<Foo>` called `f`, then borrowing it and passing this borrow as an argument to `example_1`.

After we get the response, `x`, we drop `f` (it goes out of scope).

Then, we try to use the returned value `x`. This fails, because we dropped `f` already (its lifetime ended).

But notice, `example_1` will always return `&GLOBAL_VAR` which is `'static`. It's pretty trivial to prove! There's not even any conditional logic in the body of `example_1`.

We promised to return a reference that is valid for the duration of `&'a`. And we kept our promise, because `&'static GLOBAL_BAR` is valid during the entire program!

The thing is, Rust does not care at all about the body of the function. It only cares about the definition, where we said `-> &'a Bar`.

So let's once again update our understanding:

We *know* the only possible way the `&Bar` is valid is if it somehow comes from data that is alive at the time the function is called. **And the input with the shortest lifetime determines the lifetime of the result.**

## Part 1 (cont): More syntax

Say you have a struct.

This struct holds a reference to a `Bar`.

As we know, if our struct holds a reference to a `Bar`, then our struct can't live longer than the `Bar`. And we need some way to prove this to the compiler.

You can probably guess, the syntax appears like this:

```rust
struct Baz<'a> {
    thing: &'a Bar,
}
```

We could read the above as:

- There is a struct called `Baz`. It holds a reference to a `Bar`.
- The lifetime for the reference to `Bar` is called `'a`.
- Our `Baz` can never live longer than `'a`.

You might ask yourself -- why do we *need* the `<'a>` syntax here, when Rust let us skip it in the previous examples? Why can't we do this:

```rust
struct Baz {
    thing: &Bar,
}
```

Surely Rust is smart enough to know that every `Baz` must not outlive its reference to `Bar`, without the fancy syntax.

The reason is, the lifetime of the `Bar` will be different each time. So our `Baz` must be **generic** on the lifetime. Just like a `Vec<T>` needs to handle *any* `T`, a `Baz<'a>` needs to handle *any* `'a`.

Of course, when we actually use the `Baz`, we can usually skip the syntax, like so:

```rust
fn example_2() {
    let bar = Bar;

    let baz = Baz { thing: &bar };
}
```

## Part 1 (cont): Traits and Bounds

So far, we have seen lifetimes in function declarations and in structs. Let's move on to traits.

Say you have a trait.

```rust
trait Lug {
    fn bar(&self) -> &Bar;
}
```

The trait `Lug` defines a function `bar` that takes `self` by reference. No lifetime syntax is needed here. It can be elided, just like in our very first example, for the same reasons.

Let's add another function to the trait:

```rust
trait Lug {
    fn bar(&self) -> &Bar;
    fn biz(&self, input: &Foo) -> &Bar;
}
```

And let's make a simple implementation:

```rust
impl<'a> Lug for Baz<'a> {
    fn bar(&self) -> &Bar {
        self.thing
    }

    fn biz(&self, _input: &Foo) -> &Bar {
        self.thing
    }
}
```

And a simple use-case:

```rust
```

(next, show what happens if `input` is the thing returning the bar and it always lives longer than self)

## Part 1 (cont): Bonus - where for<'art> thy lifetime?

## Part 1 (cont): Elision with '_

wow

## Part 2

The problem is not knowing the rules; the problem is knowing how to *think* about the rules.

Many programmers are drawn to Rust with an enticing promise:

*The learning curve will be steep -- but surmount it, and you will find yourself in **memory safety Nirvana!***

So those brave Rust beginners

Let's talk about object-oriented programming for a second.

Object-oriented programming was successful because it's easy to reason about.  In fact, it perfectly matches the *natural* way we think. The world is full of "things". And "things" can do "actions". A `Dog` can `.bark()`. A `Vehicle` can `.travel()`. A `Bike` **is a** `Vehicle`, therefore it can `.travel()`. And "things" have state. The `Bike.color` can be `Color::Red`. And so on.

// Back to lifetimes. Lifetimes... do not really match intuitively with any other model we encounter day-to-day.
// Need to mention: <https://blog.adamant-lang.org/2019/rust-lifetime-visualization-ideas/>

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

- `'static` is, as always, the topmost lifetime, encompassing all others.
- `'blue` ends during `'static`.
- `'red` ends during `'blue`.
- `'green` ends during `'static`.
- No relationship between `'blue` and `'green` is established, even if one does exist.

It should be intuitive that *all the data that exists during `'blue` also exists during `'red`.*

It should be intuitive that *during `'blue`, we can't assume that data from `'red` still exists.*

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

- `x` lives the entire duration of `'static`, so it is accessible during all lifetimes encompassed within `'static`: `'static, 'blue, 'red, 'green`
- `y` lives the entire duration of `'blue`, so it is accessible during all lifetimes encompassed within `'blue`: `'blue, 'red`
- `z` lives the entire duration of `'red`, so it is accessible during all lifetimes encompassed within `'red`: `'red`

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

## Pop quiz

Question 1.

I have a Rust function that returns a reference.

The function takes no parameters.

What's the lifetime of the reference it returns?

> Hint: if we are returning a reference to data, that data must already exist somewhere.

Answer: it must be `'static`:

```rust
fn example() -> &'static Foo {
    ...
}
```
