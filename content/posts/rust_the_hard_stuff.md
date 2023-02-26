---
title: "Thinking about thinking about Rust lifetimes"
date: 2023-01-08T14:52:22-08:00
draft: true
---

The intended audience for this document is a programmer who has some experience with Rust, and has a basic understanding of lifetimes, but who finds it difficult to *think about* lifetimes and gets confused by lifetime syntax.

There is a great quote: "All models are wrong, but some are useful." The model of thinking I describe below is, technically, wrong. There are many moments where a snarky reader could interrupt and say, "Well, *actually*..." I'm aware of this, but my goal is not to tell you the facts, but to help you *think* about the facts.

## First Principles

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

We know the reference *must* point to a valid `Bar` somewhere in memory.

Imagine you're writing the implementation of the function `example_1`. Where are all the places that you can look to find that `Bar`? In other words, what data do you have access to?

Here's a rough but acceptable answer:

- You can look at local variables on your own stack.
- You can look at any arguments passed to you by the caller.
- You can look at anything marked `static` -- that is, any data that is globally available during program execution.

Now which of these three places can we actually use for our return value?

We can't use the local stack, because that's destroyed when the function ends. That leaves us with:

- ~~You can look at local variables on your own stack.~~
- You can look at any arguments passed to you by the caller.
- You can look at anything marked `static` -- that is, any data that is globally available during program execution.

Great! We have two places we can look to find that `Bar`. Either we can find it from the input somehow, maybe like this:

```rust
fn example_1(input: &Vec<Foo>) -> &Bar {
    let bar = input[0].bar();

    bar
}
```

Or we can find it from the static scope, like this:

```rust
const MyBar: &'static Bar = &Bar;

fn example_1(input: &Vec<Foo>) -> &Bar {
    MyBar
}
```

If you're feeling non-deterministic, you could even toss a coin, and sometimes return one from the input, and sometimes return one from `'static`:

```rust
const MyBar: &'static Bar = &Bar;

fn example_1(input: &Vec<Foo>) -> &Bar {
    if coin_toss() {
        MyBar
    } else {
        input[0].bar()
    }
}
```

As you can see, the caller has no idea *where* you got that `Bar` from. It's none of their business. All they know is that you promised a valid reference to a `Bar`, and that's what you gave them.

.

..

....

........

## Part 2a

Imagine you are the caller of `example_1`.

```rust
fn example_1(input: &Vec<Foo>) -> &Bar {
    // implementation: none of your business :3
}
```

You dutifully pass in a `&Vec<Foo>`. You get back a `&Bar`, as promised.

```rust
fn caller() {
    let foos = Vec::new();

    let bar = example_1(&foos);
}
```

What do we know, with absolute certainty, about the `&Bar`?

We know that it's a reference to a valid `Bar` somewhere in memory, otherwise it wouldn't compile.

Where could that `Bar` be?  Where could `fn example_1` have found it?

The answer may give you deja vu:

- It could have come from the input you provided.
- It could have come from the `'static` scope -- i.e., data that is always alive.

You don't know which of those two sources provided the `Bar`. It could have been either one.

## Part 2b

I'm guessing you found the above section to be trivial. And you're right, it was extremely simplistic.

But I wanted to prime your mind with that thought process, because next we will begin to generalize.

In `example_1`, the only thing we are passing in is a reference to a `Vec` of `Foo`s. Therefore, it *must* be the case that the input (the `Vec` of `Foo`s) can somehow let us borrow a `Bar`.

If the `Vec<Foo>` is letting us borrow a `Bar`, then we could assume the `Vec<Foo>` is the "owner" of some `Bar`.

But what happens when the `Vec<Foo>` is destroyed? Everything it owns, including the `Bar`, will also be destroyed. So if we are borrowing that `Bar`, we must somehow be sure that it won't be used after the `Vec<Foo>` is destroyed.

Backing up a moment. Imagine you are the caller of `example_1`. Immediately after `example_1` returns, you certainly have two things in scope:

- The `&Bar` that was just returned, which we know must come from the input `&Vec<Foo>` somehow.
- The `&Vec<Foo>` that you passed in when you called `example_1`.

Visualizing it:

```rust
fn caller() {
    let v = Vec::new(); // a Vec<Foo>
    let b = example_1(&v); // returns &Bar to us
}
```

Consider the relationship between these two values, `v` and `b`.

You may not see this visually in your code editor, but those two values are connected somehow. You might say these two values are **entangled** (*not official terminology, I just like that word*). There is some relationship between them.

The relationship is this: The reference `b` depends on `v` existing. If `v` ceases to exist, our `b` is no longer valid.

Why? Because of what we said earlier:

> So if we are borrowing that `Bar`, we must somehow be positive that it won't be used after the `Vec<Foo>` is destroyed.

Furthurmore, the `Vec<Foo>` remains *immutably borrowed* as long as the `&Bar` is alive. The longer we keep the `&Bar`, the longer the `Vec<Foo>` is borrowed. In this way, the interaction is oddly bi-directional. That is, the `&Bar` depends on the `Vec<Foo>` because it cannot live after the `Vec<Foo>` is destroyed, and the `&Vec<Foo>` depends on the `&Bar` because it remains borrowed until `&Bar` is over. (Following the *entangled* terminology, perhaps this is *spooky action at a distance*? :D).

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

### ~~Lifetime~~ Lie time

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

We *know* the only possible way the `&Bar` is valid is if it ~~somehow comes from data owned by the vector of `Foo`s~~ has a lifetime based on the input, or from a larger lifetime such as `'static`.

### Lies, cont

This bolded statement was also a lie:

> [We cannot return] a `Bar` that is created on the stack during function `example_1`. ... **Therefore, this must be a *pre-existing* `Bar`.**

It's possible the `Bar` was created during the execution of the function. Rust doesn't care *when* the object was created. The important part is that the *memory* where it is created will continue to live even after the function has completed.

In these two examples, the `&Bar` reference that is returned points to a `Bar` that was created during the function execution.

The first example creates a `Bar` during execution, sets it on the first `Foo` (that `Foo` becomes the new *owner*), and then borrows it right back, and returns that reference. Since the new owner is a `Foo` from the input, the `Bar` is not on the stack anymore and will survive after the function has ended.

### Another lie

> If the Vec<Foo> is letting us borrow a Bar, then we could assume the Vec<Foo> is the “owner” of some Bar.

```rust
fn example_1<'a>(input: &'a mut Vec<Foo>) -> &'a Bar {
    let foo = &mut input[0];

    // Bar created during function.
    let bar = Bar;

    // Set the bar on the foo.
    foo.set_bar(bar);

    // Borrow the Bar from the Foo.
    foo.bar()
}
```

> Admittedly, the above example requires making the reference `mut`.

In this example, the `Bar` is again created on the stack. Then it is moved to an owner in the `static` scope.

```rust
static GLOBAL_BAR: Mutex<Bar> = Mutex::new(Bar);

fn example<'a>(input: &'a Vec<Foo>) -> impl Deref<Target = Bar> {
    // Create a bar.
    let bar = Bar;

    // Lock the global static bar so we can mutate it.
    let mut locked_bar = GLOBAL_BAR.lock().unwrap();

    // Set the static bar to the created bar.
    *locked_bar = bar;

    // Return the guard lock (callers only see it as a Deref to a Bar)
    locked_bar
}
```

> Mutating a static value requires locking it, so we need to wrap it in a `Mutex`. We also can't return a `&Bar` anymore, since the `.lock()` gives us a `MutexGuard<Bar>` which lets us `Deref` but not `Borrow`. If you find this confusing, don't worry about these details - the point is, it's possible for a value created on the stack to outlive its stack, if it is moved to an owner with a bigger lifetime.

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
