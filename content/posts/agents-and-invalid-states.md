---
title: "Make invalid states unrepresentable (for agents)"
date: 2026-07-01T12:49:53-07:00
draft: true
---

There is an old saying: ***make invalid states unrepresentable***.

Like all maxims in computer science, [one could debate the usefulness of this rule](https://www.seangoedecke.com/invalid-states/). Maybe you read it and think: *Yes! Exactly!* Or maybe you read it and recall a time as a junior dev, when a senior dev ruined your Friday by commenting on your PR with these four words.

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

The former was common in prehistoric times (~2023). Think: langchain, semantic kernel, old-school OpenAI SDK. In this approach, you write "traditional" code, which calls into LLMs when it's time to make a decision. You control the loop, you control the... well, the control flow.

The latter is becoming the norm, now that everything is "agentic". Think: Claude Code, OpenClaw, etc. In this approach, the LLM operates in a harness (as an "agent") with lots of tools at its disposal. You may provide it with code it can run; whether it actually invokes the code is up to the agent. The agent has free reign, and you let it loose. The agent owns the loop, decides what to do, decides when to stop.

Apologies for the Agents 101. My audience surely is familiar with these concepts. But I wanted to outline it explicitly, to set up this thought experiment:

Say you wanted to auto-generate a technical wiki for a given codebase. Basically, create [DeepWiki](https://deepwiki.com/). How would you do this?

Well, first let's define what a "wiki" is. For our purposes, an example "wiki" might look like this:

```
wiki/
  OVERVIEW.md
  control-plane/
    OVERVIEW.md
    running-locally.md
    system-architecture.md
    plugin-system.md
  user-management-service/
    OVERVIEW.md
    account-creation-flow.md
    ...
  service-lifecycle/
  ...
```

- There's always a top-level `OVERVIEW.md` page which is a landing page for the entire wiki.
- There are "sections" which are folders that group relevant wiki pages by logical systems or concepts (e.x. `user-management-service/`)
- Each "section" also has an `OVERVIEW.md` which is the landing page for that section.
- Each "section" has "pages" which are are the markdown files that contain the wiki content.

On top of that, let's say wiki generation is **configurable**. A config file for a wiki might look like:

```yaml
# wiki-config.yaml
max_sections: 12
max_pages_per_section: 3

# These sections are always generated, forcefully:
default_sections:
  - name: Application Lifecycle
    description: Explains the startup, shutdown, and deployment process
```

Basically, we enforce some parameters (max sections, max pages per section) and allow certain sections to be user-defined such that the resulting wiki will always include them (not leaving it up to the LLM to decide).

First let's consider the pre-agentic approach, where **code drives the LLM.** This is relatively straightforward. I can tell you from experience: eventually you will settle on a solution like the following, using something like the OpenAI SDK:

- You have a Python program that calls into an LLM.
- Your program parses the yaml config file.
- It pre-populates any `default_sections` from the config, so they already exist before we even touch an LLM.
- The code proceeds through multiple stages. First, it invokes the LLM, asking it to read the target codebase and identify logical **sections**. It loops on this until the LLM finds no additional sections, OR the `max_sections` count is reached.
- In the next stage, it loops over the previously-discovered sections, and for each one, asks the LLM to discover relevant **pages** for that section (just the title, no wiki content). Breaks early if `max_pages_per_section` is reached.
- Finally, it loops over each empty page, and for each one, asks the LLM to fill in the wiki page content.

This approach works. It takes time to refine the prompts, to adequately express to the LLM what makes a good "section" and a good "page" and how to do things like link between pages, write Mermaid diagrams, etc. But it works.

## Code example

## Agent example