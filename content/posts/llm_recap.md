---
title: "Recapping a wild few months for llms"
date: 2023-04-16T22:05:27-07:00
draft: false
---

*Disclaimer: this post was generated entirely by a human, using a model trained via an evolutionary algorithm over the course of ~4 billion years, and then further finetuned using a mix of reinforcement learning and supervised learning for another ~30 years.*

For the past month month or so, this has been my morning ritual:

1. Make coffee.
1. Check Huggingface for new language models (preferably llama based).
1. Pull down any models that fit on my meager 12GB 3080 to my local machine, and for larger models, start my jarvislabs.ai instance with either an A5000 (24GB) or A6000 (48GB), depending on how ambitious I'm feeling.
1. Pull the latest [GPTQ-for-LLaMa](https://github.com/qwopqwop200/GPTQ-for-LLaMa), et al.
1. Experiment. What can it do now that it couldn't yesterday?

It goes without saying that the last few months have been a whirlwind in this area. It’s unlikely I have anything new or novel to say on this topic. But if you’ve just arrived, let me catch you up.

## A brief history

Scattered across the globe, there are elite clans of well-funded researchers with an abundance of know-how and ungodly amounts of compute, and they perform their magic incantations on massive clusters of machines hosted in far-off lairs (I’ve heard a “torch” is involved). Each of these clans power up their respective machine, and feed billions (trillions, now) of tokens into its great churning maw, until it has digested enough that it has learned to speak.

Once they’ve had their fill, these massive silicon forges emit a tiny diamond of knowledge called "weights", much like how a mollusk produces a pearl. These weights, if handled just right, may be inserted into another, smaller machine, awakening it, breathing into it a crude imitation of life. And crude though it may be, the potential of a machine that *understands* is far greater than the potential of a machine that does not. With this pearl inserted, the golem awakens.

It’s unclear what good these golems will be used for, but they’re quite good at menial tasks, such as reading Excel sheets, finishing your English homework, or providing you a good-enough Fibonacci sequence generator. Occasionally they may have [existential crises](https://www.theverge.com/2023/2/15/23599072/microsoft-ai-bing-personality-conversations-spy-employees-webcams) or [spew racist or hateful rhetoric](https://techcrunch.com/2023/04/12/researchers-discover-a-way-to-make-chatgpt-consistently-toxic/), but aren’t there always bumps in the road of progress?

The largest of these mind-forges keeps its weights guarded, despite its founding promise to be open, and its very namesake. You may not see its golem directly; you may only submit your request for its wisdom, and if you have paid the tithe, they will council with the golem in private on your behalf, and provide you its response. Not much is known about this golem or the weights that power it; even its size is a closely guarded secret, an unprecedented departure from the norm.

But there are other such forges, and though they are not yet as capable, neither are they far behind. Quietly they are amassing their own power.  And, in a very clever, calculated move, one such forge has decided to publicly disseminate several of its own weights, undermining (but not yet surpassing) the leader, and hinting that the future will be very interesting indeed.

And these weights, which are now free to download (provided you are a researcher, and isn’t everyone, now?) can be hosted in much smaller devices, with much fewer resources than was previously required. In fact, for only a small drop in quality, the memory required to use these weights can be [cut in half](https://huggingface.co/decapoda-research/llama-7b-hf-int8); and, astoundingly, it can then be [cut in half *again*](https://github.com/qwopqwop200/GPTQ-for-LLaMa). (And there are [whispers of going further!](https://nolanoorg.substack.com/p/int-4-llama-is-not-enough-int-3-and)) It has been shown that the smallest of these weights [can be hosted by a pocket-sized device](https://ivonblog.com/en-us/posts/alpaca-cpp-termux-android/). Currently, such an exercise may be little more than a toy - but what does it say about what comes next?

Weights that could previously fit only in huge Frankenstein datacenter monstrosities can now take host in a single pro-grade device rented from a hosting service; weights that could previously fit only on the rented device can now fit on a high-end consumer device; weights that could only fit on the high-end consumer device can now fit on considerably less high-end consumer devices… you see the pattern.

On that subject, there are two variables at play that tell a very interesting story:

- First, the memory and computational cost of hosting these weights continues falling, making them usable on smaller and smaller devices.
- Second, the power of all such devices, including small ones, continues its ever-upward exponential climb.

Imagine these two lines in your mind, the first one falling, the second one rising, and observe that a collision is inevitable. What will the world look like, post-collision?

We can at least try to make some predictions.

- For the purposes of running a large language model, the limiting factor on most modern consumer-grade GPUs is memory, not compute/FLOPS, so it is reasonable to expect manufacturers will be pressured into cramming more and more memory into their devices as the field continues to expand.
- On that note, it's not hard to imagine a market for GPUs that are purpose-built for AI edge inference instead of gaming. Of course, these GPUs exist already, but I'm suggesting they could be marketed to the average consumer and priced more reasonably.
- Models that can run on consumer devices will always be weaker than those hosted by massive services. But... by how much, and for how long? If it seems like OpenAI has neglected Dall-E, it's not hard to imagine why - there are *truly* open models that can be run for free on consumer hardware with fewer limitations. It seems likely that anything a private service can provide could be replicated by open, locally-hostable models within some time frame. I would currently estimate that timeframe as 12 months, though I'm doubtful a model as capable as GPT-4 could fit on puny 12GB consumer cards in that timeframe regardless of any further advances. I'd be thrilled to be proven wrong there, though! (Of course, llama.cpp exists, but its slow performance when loading large contexts makes it currently not useful for large-context operations.)
- The next frontier will likely be multi-modal models, which natively understand text *and* images (*and* video *and* audio *and*...). That is, models that will not only understand what a dog *is*, but also what a dog *looks like* and *sounds like*, all in one model.
- Embeddings will become an everyday data type for the average developer. For nearly every dataset (customer accounts, movies, cooking recipes), an index over its embeddings will be commonplace, since it helps solve multiple problems that were traditionally difficult - how similar is record A to record B? What are some records similar to record D?
- Remember when the iPhone App Store first opened, and the most popular apps were simply novelties, [like this one, which let you... pretend to drink a beer?](https://www.youtube.com/watch?v=A3MfQIswl3k) Expect the ecosystem to look like that for awhile. It will be years until an Uber arrives and shows us how we could have been using this all along.

I have no real conclusion here. To be honest, I wrote this rant in a day, from a collection of shower thoughts that has been growing too large to contain. Thanks for reading.
