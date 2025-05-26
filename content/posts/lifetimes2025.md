---
title: "Lifetimes2025"
date: 2025-05-14T21:40:32-07:00
draft: true
---

A conversation with my younger (circa 2016) self:

*Wah! Who are you?*

I'm you from the future. 2025.

*Oh my god! There's so much I want to know about! Like um, does America survive the Trump administration?*

...That remains to be seen...

*What?*

Enough about all that. I'm here to talk about Rust lifetimes.

*Great, I know all about those!*

...So you say. Let's have a quiz. Please describe to me what a lifetime is.

*Easy! The compiler tracks the lifetime of all objects. When an object is destroyed, its lifetime ends. Objects can be borrowed, and the compiler guarantees that borrows cannot outlast the lifetime of the object. Piece of cake!*

Sounds like you know the basics.

*I know more than the basics!!*

Oh? Then tell me, what's the difference in the two `'static`s in the blow code:

```rust
fn example(input: impl MyTrait<'static> + 'static) { ... }
```

*Uhh...*

And what's all that `for<'a>` stuff about?

*Well, uh...*

Does `'a: 'b` imply `a` outlives `b`, or the other way around?

*Ok, I get your point...*

Similarly, does `T: 'a` imply `T`must outlive `'a`, or the other way around?

*Now you're just teasing me. But you're me from the future! You must be an expert in all this stuff!*

Uh, well... kind of. Let's take it from the top.

## From the top