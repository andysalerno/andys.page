---
title: "Make invalid states unrepresentable (for agents)"
date: 2026-07-01T12:49:53-07:00
draft: true
---

There is an old saying: ***make invalid states unrepresentable***.

Like all maxims in computer science, [one could debate the usefulness of this rule](https://www.seangoedecke.com/invalid-states/). Maybe you read it and think: *Yes! Exactly!* Or maybe you read it and recall a time as a junior dev, when a senior ruined your Friday by commenting on your PR with these four words.

Regardless, as a guiding principle, it is certainly *useful*. Entire classes of bugs can be eliminated from programs, just by designing your solution in a way that the failure state is not merely an edge case but *provably impossible*.

And this idea applies at all levels of the stack, all areas of systems architecture.

Lately I have noticed that this approach can also be applied to **agents**, in ways that are perhaps unintuitive at first. I will describe some examples below.

First, some old-school code examples. Feel free to skip them if you already get the gist.

## Some (contrived) examples

- In some programming languages, null reference exceptions are made impossible by treating nullable references as entirely different types from non-nullable references.

- If a purchase order can only be "accepted", "rejected", or "pending", you can represent this with a closed enum instead of a string ("stringly typed"), and it becomes impossible for callers to provide an invalid value.

- Say you have a `USERS` table, and all users are required to have email addresses. But, some user accounts are pre-created by their employer, before the email address is known. In such cases, users provide the email address upon first sign-in. Instead of allowing the `email` field to be nullable, you can have an entirely separate table `PENDING_USERS` which allows null emails, and only create the real `USERS` entry once the email is known upon first sign-in. You just eliminated the possibility that a `USER` may be missing an email address; such a state is unrepresentable, since `email` is `NOT NULL` on `USERS`.

Maybe those examples are obvious, boring, unexciting. So let's move on to agents.

## Boxing agents in with strict guarantees


## Code example

## Agent example