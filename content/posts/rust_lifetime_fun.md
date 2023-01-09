---
title: "Can I borrow a feeling?"
date: 2022-11-05T20:35:43-07:00
draft: true
---


================================

Like most Rust developers, my understanding of lifetime syntax comes from two sources:

1. The official documentation, which offers ~~extremely~~ helpful and precise details, and
1. Compiler errors, which show me any lifetime violations in a (usually) clear and understandable way.

Both these sources are extremely powerful. In fact, I'd go so far to say that Rust as a language would never have succeeded were it not for the docs and the amazing compiler errors.  The borrow checker is a totally novel concept to most developers, so without understandable build errors (*cough* c++ *cough*) I think the learning curve would have simply been too steep for most. It's a huge testament to the quality of the Rust team that they understood this and prioritized clear error messages so highly.

But... there's a "but" here.  To me, something is still missing. There's a big gap between 1 and 2 in my above list.

"1" gives us the technical, detailed, factual information about lifetimes and their syntax. You read the docs, some of it sticks, and you gain the foundations of a mental model.

"2" gives us in-the-moment feedback about our mistakes.  You write code, and as you write it, the compiler checks your work, and the mental model from 1 becomes a little stronger over time.

However, I hit a ceiling when using *only* the docs and *only* the compiler (and occasionally StackOverflow).

I am reminded of high school calculus: I read the book; I read the rules; I memorized the formulas; I took the tests; I passed them.

But I did not learn calculus. I did not actually *know* it. Some might say I did not *grok* it, but for some reason that word has always tasted horrible to me.

Then I read the opening few chapters of the famous [Calculus Made Easy](https://en.wikipedia.org/wiki/Calculus_Made_Easy). And it was like a switch flipped. There it was! All the disparate rules and formulas I had memorized suddenly came together into a beautiful mental model.

Was calculus suddenly easy for me? No. But there was a difference. Before, I was stubbornly cutting steak with a butter knife. Now I finally had the right tools.

I want something similar for Rust lifetimes. I want an explanation that doesn't just tell me *what the facts are*, but also tells me *how to think about them.*

Will this post, this one you are reading right now, be that? I don't know. But I can try!

## Who is this for?

This is for experienced developers new to Rust, and for existing Rust developers who (like myself) may be desiring a stronger foundation regarding lifetimes.

### Question 1

Can you explain the difference between the following two functions?

```rust
fn question_1<T>(thing: &'static T) { ... }

fn question_1<T: 'static>(thing: &T) { ... }
```

### Question 2

Can you spot the error in the following function? What are some ways you might fix it?

```rust
fn question_2<T: Send + Sync>(obj: T) {
    thread::spawn(move || {
        do_something(obj);
    });
}
```

### Question 3

Consider the following trait. One or more function(s) defined by the trait will cause a build error. Can you identify which one(s), and explain why?

```rust
trait Example {
    fn a(s: &str) -> &str;
    fn b(x: &str, y: &str) -> &str;
    fn c(&self, x: &str, y: &str) -> &str;
}
```

## Part 1: Back to Basics

A "lifetime" is how long an object is alive.

When an object is alive, it is safe to access it. When its lifetime is over, the object is no longer safe to access.

Rust keeps track of every object's lifetime for us.

*Every* time you borrow something (the `&` symbol), there is a lifetime automatically associated with that borrow. Every time.

The golden rule that Rust enforces for us is: you can borrow something, but you must finish using it *before* its lifetime ends.

Much of the time, when we borrow something, we can simply ignore its lifetime. Rust is very smart, and can sometimes enforce the golden rule without any extra work needed on the developer's part.

But in cases where the compiler cannot be sure - or cases that are simply ambiguous - we must tell the compiler our intentions. That is where lifetime syntax comes in.

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

We know the reference *must* point to a valid `Bar` somewhere.

Consider where that `Bar` must be.

It cannot be a `Bar` that is created within the scope of the function `example_1`.  If that were the case, the `Bar` would be destroyed when the function is over. Therefore, this must be a *pre-existing* `Bar`.

If `example_1` returns a reference to a pre-existing `Bar`, then it must somehow know how to find a pre-existing bar when it is called.

So how could it possibly find that `Bar`?

Well, the only thing a function knows about is what you pass into it.

Therefore, it *must* be the case that the returned reference to `Bar` is somehow under the ownership of the vector of `Foo`s.

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

## Part ???

Imagine a function that takes a string of multiple words as input, and returns just the first word as output:

```rust
// example input: "hello, world!"
//  gives output: "hello,"
fn first_word_only(s: &str) -> ??? {
    ???
}
```

How could we implement the above?

You could look at the input string slice, `s`, find the first word, copy it into a new `String`, and return that `String`.

Since we've copied the data, this output `String` can outlive the input `&str`. They are entirely separate.

But what if we wanted to avoid the copy? After all, "hello, world!" already contains the exact correct output, "hello,".

The above function takes a `str` by reference (or, "borrows a str", if you like).

> Note: *borrow* and *reference* will sometimes be used interchangeably here.

When a function is over, object created on its stack dies (or, "their lifetimes end").

It splits on whitespace, then returns just the first of all the splits.

But notice an important detail: we are returning a reference, `&str`. A reference points to existing data.

> Note: the Rust docs mostly avoid the term "object", and use "variable" instead. For my purposes, I believe "object" is more intuitive, so I use it here.

## Part 1a

Lifetime syntax can be confusing, because named lifetimes can appear in different parts of a function declaration - and these different parts have different meanings.

## Part 1b

Say you have a function.

```rust
fn abc<T: ToString>(i: T) { ... }
```

You would say: the function `abc` takes in a parameter `i`. `i` can be anything that implements `ToString`.

The value of `T` is therefore decided by the argument, provided by the caller.

Say you have a function.

```rust
fn xyz<T: ToString>(i: T) -> T { ... }
```

Now `T` appears in three places. From left to right:

1. The generic parameters (inside `<...>`).
1. The parameter list.
1. The return type.

Once again, the value of `T` is dictated by the caller, based on what type they provide for parameter `i`:

```rust
let i = 42;
let j = xyz(i);
```

And yes, this could be specified using the turbofish syntax, if the caller wishes:

```rust
let i = 42;
let j = xyz::<i32>(i);
```

================

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

* some trait `FooFactory`
* a function `work` that lets you pass any type by value, as long as that type is a `FooFactory`.  

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
