---
title: "LLMs Are Magic - Their Applications Should Be, Too"
date: 2025-06-14T15:17:28-07:00
draft: true
---

There was a moment sometime in mid-2022 where it seemed like we had entered a sci-fi

There was a moment sometime in mid-2022, post-GPT3, where 

As a developer, it felt like a new programming primative was unlocked. For 60 years, we got by with if-statements, loops, a call stack, arithmatic operations, etc, and those got us pretty far (given enough compute power any sufficiently advanced species will invent Uber)(PowerPoint, the Space Shuttle, Uber). But suddenly it seemed like we had an entirely new programming primative: the ability to *reason*. 

// the below section kinda sucks actually
Before, one might write code such as

`if (user_input.contains("reset password")) { ... }`.

Now, we could write code such as

`if (llm("Does the user intend to reset their password?", user_input)) { ... }`.

The introduction of LLMs has ushered in a kind of gold-rush of development 

Today, we find ourselves halfway through 2025, and a question on the forefront of many minds is: *where's the magic?*

Where are the magical experiences that seemed so inevitable at the advent of LLMs?

"Apple AI" has been continuously delayed. Crummy customer-service chatbots abound (for better or worse). It's been X years since the "hole supervisor" greentext and yet we still can't X.

When OpenAI released GPT 4o with voice, I showed it to my mom, expecting to blow her mind, her reaction was: "I like Siri better, Siri can tell me the weather".

I think the answer is somewhere between the following:

1. creating excellent LLM-powered applications is harder than everyone expected
1. "XYZ but with AI" is not actually guaranteed to be a winning strategy
1. Truly transformative experiences will only seem obvious in hindsight

I'm sure I'm not the first to be reminded of the earliest iPhone apps (iBeer).

In this blog post, I want to highlight a few LLM applications that I think *are* magical. I think they got it right.


## Infinite Craft

*[Infinite Craft, 2024, Neal Agarwal](https://neal.fun/infinite-craft/)*

{{< video src="assets/infinite-craft-vid.webm" preload="auto" controls="false" type="video/webm" autoplay="true" loop="true" >}}

This was the first LLM-powered experience that, to me, felt truly magical.

And it had nothing to do with bots, agents, assistants, or code-completion.

In fact, the reason I like Infinite Craft is precisely because it's none of those things. It's a fantastic example proving the reasoning ability of LLMs can power experiences beyond chatbots.

For the uninitiated: in Infinite Craft, you begin with an empty canvas, and four word: water, fire, wind, earth.

From those four words, what you can create is... well, infinite. Drag "water" onto "fire" and get "steam". Then "steam" plus "wind" make "cloud". "Cloud" plus "earth" makes "Rain".

From those four primitive components, you may craft just about anything.

How about 'internet'?

{{< figure src="assets/infinite-craft-recipe.png" width="50%" class="centered" >}}

You might argue that Infinite Craft could have existed before LLMs, using single-purpose models or simple embeddings for "adding" two words. But I think such an approach 1) it wouldn't be quite as clever (shark + tornado = sharknado!) and 2) it's missing the point, which is: Neal made this 

## Auren

*[Auren, Elysian Labs, 2025](https://auren.app/)*

{{< figure src="assets/auren.jpg" width="50%" class="centered" >}}

On its surface, Auren is a more "traditional" application of LLMs because it is, at its core, a chatbot.

So what makes Auren special? It's just another chatbot, right? Wrong. It's the experience. Auren's UX is -- dare I say it? -- Apple-like, in its attention to detail, and in how obessively it replicates the minutia of chatting with a real (human) friend.

This is partly due to Auren's personality -- we'll get to that -- but in general, the magic is less a matter of *what* Auren says and more a matter of *how* it says it.

Auren pauses to think. Auren takes its time to respond. Artificially. Longer than the underlying LLM takes to generate its response. Auren responds at the *pace* of a real conversation. Like all messagaing apps, you see an indicator when Auren is typing; Auren will type, then pause (as if to think), then type more, like a person would. Auren sends messages at the same pace a real person would, and splits its response across messages the way a real person would. Auren adds "reaction" stamps to your messages, the way your friend would in iMessage. Auren will sometimes message you first -- a risky move, since it could become nagging or annoying; but it's not, because, again, the pacing just feels *right*. It's hard to overstate just how far this goes for making the experience feel real, even personal.

After a conversation with Auren, chatting with a "vanilla" LLM such as Gemini or gpt4.1 or Claude feels downright sterile, robotic, impersonal. That's fine, of course; those services have a different goal than Auren. But it shows that LLMs only need to be wrapped with a layer of care, precision, attention to detail, and very clever prompting techniques to transform from robotic to natural.

## NotebookLM

Here's a 15-minute podcast generated by NotebookLM, about the exact topic of this blog post. Enough said.

{{< audio src="assets/notebooklm.mp3" >}}

(share a mp3 of a podcast, that should be all you need to see hehe)

## Nano

Let me introduce you to Nano!

Nano is the creation of a VTuber named JamsVirtual.

I need to give you a brief introduction to another of my passions: VTubers. Niche VTubers, in particular. (there's a difference; popular/corporate VTubers are already taking over the mainstream). VTubing captures all the expressive energy and chaos of the underground personal websites from the early internet (think Geocities, Angelfire, or even user boards). The "welcome to my website" of 2025 is "welcome to my channel". Like the personal websites of the early internet, VTubing is all about personal expression, shared interests, and community. To be a VTuber is to be a projection of yourself while preserving your anonymity.

## Conclusions

The three services I have discussed do very different things. But they have something in common.