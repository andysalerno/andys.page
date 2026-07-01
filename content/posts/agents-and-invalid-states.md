---
title: "Make invalid states unrepresentable (for agents)"
date: 2026-07-01T12:49:53-07:00
draft: true
---

There is an old saying: ***make invalid states unrepresentable***.

Like all maxims in computer science, [one could debate the usefulness of this rule](https://www.seangoedecke.com/invalid-states/). Maybe you read it and think: *Yes! Exactly!* Or maybe you read it and recall a time as a junior dev, when a senior ruined your Friday by commenting on your PR with these four words.

Regardless, as a guiding principle, it is certainly *useful*. Entire classes of bugs can be eliminated from programs, just by designing your solution in a way that the failure state is not merely an edge case but *provably impossible*.

Lately I have noticed that this approach can also be applied to **agents**, in ways that are perhaps unintuitive at first. I will describe some examples below.

First, some old-school code examples. Feel free to skip them if you already get the gist.

## Some (contrived) examples

- In some programming languages, null reference exceptions are made impossible by treating nullable references as entirely different types from non-nullable references.

- If a purchase order can only be "accepted", "rejected", or "pending", you can represent this with a closed enum instead of a string ("stringly typed"), and it becomes impossible for callers to provide an invalid value.

- Say you have a `USERS` table, and all users are required to have email addresses. But, some user accounts are pre-created by their employer, before the email address is known. In such cases, users provide the email address upon first sign-in. Instead of allowing the `email` field to be nullable, you can have an entirely separate table `PENDING_USERS` which allows null emails, and only create the real `USERS` entry once the email is known upon first sign-in. You just eliminated the possibility that a `USER` may be missing an email address; such a state is unrepresentable, since `email` is `NOT NULL` on `USERS`.

Maybe those examples are obvious, boring, even common sense. So let's move on to agents.

## "Make no mistakes"

There are two general approaches when designing LLM-powered solutions:

1. The code drives the llm.
2. The llm drives the code.

The former was common in the early days. Think: langchain, semantic kernel, old-school OpenAI SDK. In this approach, you write "traditional" code, which calls into LLMs when it's time to make a decision. You control the loop, you control the... well, the control flow.

The latter is becoming the norm, now that everything is "agentic". Think: Claude Code, OpenClaw, etc. In this approach, the LLM operates in a harness (as an "agent") with lots of tools at its disposal. You may provide it with code it can run; whether it actually invokes the code is up to the agent. The agent has free reign, and you let it loose. The agent owns the loop, decides what to do, decides when to stop.

Apologies for the Agents 101. My audience surely is familiar with these concepts. But I wanted to outline it explicitly, to set up this thought experiment:

Say you wanted to auto-generate a technical wiki for a given codebase. Basically, [DeepWiki](https://deepwiki.com/). How would you do this?



## Code example

## Agent example