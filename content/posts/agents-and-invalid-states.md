---
title: "Make invalid states unrepresentable (for agents)"
date: 2026-07-01T12:49:53-07:00
draft: true
---

*This blog post was written by me, a human (as evidenced by how long it takes to explain a simple idea). If you want to skip straight to the main idea I'm proposing, scroll to The Point.*

There is an old saying: ***make invalid states unrepresentable***.

Like all maxims in computer science, [one could debate its usefulness](https://www.seangoedecke.com/invalid-states/). Maybe you read it and think: *Yes! Exactly!* Or maybe you read it and recall a time as a junior dev, when a senior dev ruined your Friday by commenting on your PR with these four words.

Regardless, as a guiding principle, it is certainly *useful*. Entire classes of bugs can be eliminated from programs, just by designing your solution in a way that certain failure states are not merely edge cases but *logically impossible*.

Lately I have noticed that this approach can also be applied to **agents**, massively increasing their reliability for many tasks. I will describe some examples below.

First, some old-school code examples. Feel free to skip them if you already get the gist.

## Some (contrived) examples

Ways you might "make invalid states unrepresentable":

- In some programming languages, null reference exceptions are made impossible by treating nullable references as entirely different types from non-nullable references.

- If a purchase order can only be "accepted", "rejected", or "pending", you can represent this with a closed enum instead of a string (so it is not "stringly typed"), and it becomes impossible for callers to provide an invalid value.

- Say you have a `USERS` table, and all users are required to have email addresses. But, some user accounts are pre-created by their employer, before the email address is known. In such cases, users provide the email address upon first sign-in. Instead of allowing the `email` field to be nullable, you can have an entirely separate table `PENDING_USERS` which allows null emails, and only create the real `USERS` entry once the email is known upon first sign-in. You just eliminated the possibility that a `USER` may be missing an email address; such a state is unrepresentable, since `email` is `NOT NULL` on `USERS`.

Maybe those examples are obvious, boring, even common sense. So let's move on to agents.

## "Make no mistakes"

I'd say there are two general approaches when designing LLM-powered solutions:

1. The code drives the LLM.
2. The LLM drives the code.

The former was common in prehistoric times (~2023). Think: langchain, semantic kernel, old-school OpenAI SDK. In this approach, you write "traditional" code, which calls into LLMs when it's time to make a decision. You control the loop, you control the... well, the control flow. Your code drives the LLM.

The latter is becoming the norm, now that everything is "agentic". Think: Claude Code, OpenClaw, the latest harness-du-jour, etc. In this approach, the LLM operates in a harness (as an "agent") with lots of tools at its disposal. You may provide it with code it can run; whether it actually invokes the code is up to the agent. The agent has free reign, and you let it loose on a task. The agent owns the loop, decides what to do, decides when to stop. There isn't strictly a "program" being executed; at each step, the next step is decided on the fly by the agent. The LLM drives *your* code, invokes *your* tools... if it chooses.

Apologies for the Agents 101. My audience surely is familiar with these concepts. But I wanted to outline it explicitly, to set up this thought experiment:

Say you wanted to auto-generate a technical wiki for any given codebase. Basically, implement [DeepWiki](https://deepwiki.com/). How would you do this?

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
- Each "section" also has an `OVERVIEW.md` which is the landing page for that section (basically an index).
- Each "section" has "pages" which are are the markdown files that contain the wiki content.

On top of that, let's say wiki generation is **configurable**. A config file for our wiki-generator system might look like this:

```yaml
# wiki-config.yaml
max_sections: 12
max_pages_per_section: 3

# These sections are always generated, forcefully:
default_sections:
  - name: Application Lifecycle
    description: Explains the startup, shutdown, and deployment process
```

Basically, we may enforce some parameters (max sections, max pages per section) and allow certain sections to be user-defined such that the generated wiki will always include them (not leaving it up to the LLM to decide).

First, let's consider the pre-agentic approach, where **code drives the LLM.** This is relatively straightforward. I can tell you from experience: eventually you will settle on a solution like the following, using something like the OpenAI SDK or PydanticAI:

- You have a Python program that calls into an LLM.
- The program parses the yaml config file.
- It maintains an internal state representation of the wiki, basically a data model representing the filesystem layout shown above.
- In this internal state, it pre-populates any `default_sections` from the config, so they already exist before we even touch an LLM.
- The code proceeds through multiple stages. First, it invokes the LLM, instructing it to read the target codebase and identify logical **sections**. We give it basic read-only filesystem tools ("file_read", etc) to handle this, plus a tool "add_section" which adds a new empty section to the internal state. We loop until the LLM finds no additional sections, or we hit `max_sections`. To be clear: at this point there are no pages, no wiki content, only the high-level *structure* of the wiki (the empty sections) has been determined by the LLM.
- In the next stage, the code loops over the previously-discovered sections, and for each one, instructs the LLM to discover relevant **pages** for that section (just the title and description, no wiki content). Same approach as before: we give it read-only filesystem tools, and a tool like "add_page" which, when invoked, triggers the code to update its internal state to add a new page.
- Then, it loops over each empty page, and for each one, asks the LLM to write the wiki page content (tool "append_to_page").
- Finally, when the above is complete, the code renders the internal state to the filesystem. This is when it actually creates the directories ("sections") and markdown files ("pages").

This approach works. It takes time to refine the prompts, to adequately express to the LLM what makes a good "section" and a good "page" and how to do things like link between pages, write Mermaid diagrams, etc. But it works. And we know that every time we run it, the same thing will happen: first we'll discover sections, then pages, then fill in the pages. Because that's not a decision made by the LLM; rather, it's a decision we made as the programmers when we wrote the program. The code is driving the LLM.

## Flip the script

Now, let's invert the control flow, and talk about the agentic approach, where **the LLM drives the code.**

In this approach--hold on. I see a hand raised. Yes?

*Um, hi. If the above approach works, why even bother with the agentic approach?*

Excellent question, glad you asked. The code-first approach certainly works, and will keep working. That said, the world is gradually converging on a new paradigm, where agents orchestrate themselves, unbound by programmatic control flow. It's therefore worthwhile to consider how we may still keep the strict guarantees afforded to us by code (schema validations, reproducibility, determinism, etc) even when the agent is in charge.

That's what I'll talk about now.

*Glad you're finally getting to the point.*

Please don't talk without raising your hand, and also we're too deep into this blog post to shift the tone or introduce new narrative devices, so I kindly ask you do not interrupt again.

## Agent example (aka The Point)

Consider the exact same problem described above: create a system that generates a technical Markdown wiki for a given codebase. (Again, like [DeepWiki.](https://deepwiki.com/))

This time, imagine you're using an agentic harness like Claude Code, or Codex, or OpenClaw. What would you do?

A completely valid first attempt would be: just tell the agent to write a wiki for the codebase. That's it.

And I encourage you to try this. Maybe it even works, if the codebase is small enough! And whenever it makes a mistake (improper markdown link syntax, pages too short, etc), simply update the instructions to nudge the agent towards the desired behavior, and repeat.

But I've been down this path. You launch the agent. The resulting wiki is too short. You update the instructions, telling it to write more pages. You launch the agent. Now there are more pages, but each page is only two paragraphs. You update the instructions. You launch the agent. Now the wiki lacks mermaid diagrams. You add to the instructions. You launch the agent. Now the mermaid diagrams look good, but it's missing a section for a crucial library in your codebase. You start to wonder how this same model solved an Erdős problem.

Okay, maybe it didn't work. But we didn't even try skills yet. Or subagents. Or MCP servers! Or [Ralph Wiggum](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md)!

Sure, we can try all those things. But first I want you to think about the types of failures we are seeing:

- Pages too short.
- Not enough pages.
- Not enough sections.
- Broken links.
- Areas of the codebase not covered by the wiki.
- Config values ignored (`max_sections`, `max_pages_per_section`, from the previous example).

Notice something? These types of failures are *entirely preventable by code.* In the earlier code-first example, we'll never exceed `max_sections` because the code breaks early when `max_sections` is reached. We'll never have a page that's too short, because the code loops until pages meet the minimum length. We can statically validate links to make sure they are not broken. We can map wiki sections to the areas of the codebase they cover, and guarantee that all parts of the codebase have wiki coverage. Etc, etc.

How can we get these same guarantees, but in the agent-first approach?

Well, in truth, we can't -- after all, the agent could always respond with "I'm tired, I don't feel like doing it." So we can never have the same level of certainty with agents as we can with code.

But we can get pretty damn close!

The pattern I have landed on is:

**Do NOT allow the agent to interact with the system EXCEPT through a program that you control. This program strictly prohibits operations that would lead to invalid state.**

*Um, what does that mean?*

It means: our wiki agent does NOT write Markdown files. It doesn't create folders for wiki sections. It doesn't even have a `file_write` tool (we disable that tool in the agent frontmatter yaml, or when we launch the harness).

Instead, we give the agent a cli program, which is the *only* way it may interact with the wiki's state. If the agent wants to create a section, it invokes a cli script:

```bash
$ wiki.py add-section "User Management"
```

This updates (and creates, if necessary) a file `wiki_state.yaml` that represents the state of the wiki. Just like in the earlier code-first solution! In fact, the data model can even be exactly the same.

What's the output of this command?

```bash
$ wiki.py add-section "User Management"
Section added. There are now 8 sections. Max is 10.
```

And if the agent somehow ignores the above warning and still exceeds the max count:

```bash
$ wiki.py add-section "User Management"
Error: cannot add section; max of 10 sections already added. Move on to page creation.
```

Notice how **the code is handling the deterministic stuff** (how sections are added, maintaining the state, running validations), and **the agent is only handling the reasoning stuff** (what the name of the section should be). Also, **the code emits helpful contextual tips** exactly when they are most relevant -- not in a 20k token system prompt where they may be more easily forgotten.

By now, everyone knows **agents love CLIs**. So, of course the program has a nice help output:

```
$ wiki.py --help
Use this script while you are writing, or updating, a codebase wiki.
Add sections first, then pages, then page content.
Use render-to-filesystem when ready to persist to markdown files in the wiki directory layout.

USAGE
    wiki.py add-section SECTION_NAME
    wiki.py add-page SECTION_NAME PAGE_NAME
    wiki.py append-page-content SECTION_NAME PAGE_NAME CONTENT
    wiki.py list-sections
    wiki.py list-pages [SECTION_NAME ...]
    wiki.py show-config # prints config values like max_sections etc
    wiki.py render-to-filesystem # transforms state.yaml to markdown files on disk
    ...
```

When the agent has decided there are enough sections, pages, and the content is good, it may invoke `wiki.py render-to-filesystem`. This takes the `state.yaml` intermediate representation, and actually renders it to the filesystem as markdown files (following the filesystem layout shown earlier).

And it's yet another chance to enforce programmatic guarantees:

```
$ wiki.py render-to-filesystem
Error: not ready to write to filesystem. The following validations failed:
- Page user-management/user-creation-flow.md is too short; currently 8789 chars, minimum is 10000.
- Page control-plane/storage-backends.md contains invalid markdown link on line 47.
- Codebase directory src/internal/data-models/ is not covered by any page.
- Section user-management is missing an OVERVIEW.md file.
```

Of course, handing the agent a CLI isn't enough to explain *what it's supposed to do*. We still need instructions (generally agent or skill definitions). I landed on a solution like this:

```
.agents/
  agents/
    wiki-writer.md # our "entrypoint"; instructions for invoking the below skills, and general CLI usage tips
  skills/
    section-discovery/SKILL.md # specific info related to section discovery
    page-discovery/SKILL.md # specific info related to page discovery
    page-writing/SKILL.md # specific info related to writing wiki content
```

In the above, we explain things such as:
- the general task (writing a wiki).
- the existence of the `wiki.py` cli tool, and its basic usage.
- the recommended flow: first section discovery, then page discovery, then page filling.

What we *don't* have to do is enumerate a massive section of rules and guidelines. The cli tool `wiki.py` will handle that for us, and will surface that information to the agent when it is most relevant. We may simply write: "`wiki.py` will guide you as you go, so follow its warnings, suggestions, and tips."

> *At this point, certain [hyper-pedantic readers](https://news.ycombinator.com/) might take issue: "You're not really making invalid states **unrepresentable**," they might (fairly) argue. "I could still manually craft a wiki.yaml state file that has more sections than `max_sections`. That's an invalid state, and I represented it. A better description is, you made invalid states **un-enterable**." To that I say: good point. But, 1) I think you could allow that the outcome is close enough to 'unrepresentable', especially considering where we started, and 2) that title is not nearly as catchy for a blog post.*