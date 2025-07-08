---
title: "LLMs Are Magic - Their Applications Should Be, Too"
date: 2025-06-14T15:17:28-07:00
draft: true
---

Three years ago, it seemed absolutely certain (to me at least) that

1. LLMs would continue to get even better and better, and
2. LLMs would soon power just about every digital experience in our lives.

Only one of those turned out to be true. Three years later, LLMs are smarter than ever. They can reason, they can generate images and videos (either natively or with a bridge to another model). They're fast, and getting faster; cheap, and getting cheaper; smart, and... you get it.

And yet... they're still just chatbots. Mostly.

How can this be? An LLM is like a new computing primitive. It's like a new function in the standard library of computing has appeared called `reason`. And the best we can do with this is chatbots??

*Where's the magic??*

Where are the magical experiences that seemed so inevitable at the advent of LLMs? "Apple AI" has been continuously delayed. Crummy customer-service chatbots abound (for better or worse). It's been 3 years since the "bottomless pit supervisor" greentext!

{{< figure src="assets/bps.jpg" width="50%" class="centered" >}}

*Above: the famous 'bottomless pit supervisor' greentext created by GPT-3*

So what's going on? I think the answer lies somewhere among the following:

1. Creating excellent LLM-powered applications is harder than people expected.
1. "XYZ but with AI" is not guaranteed (or even likely) to be a winning strategy.
1. Truly transformative experiences will only seem obvious in hindsight.

But that doesn't mean there are *no* good examples of LLMs being put to good use.

In this blog post, I want to highlight a few LLM applications that I think *are* magical. I think they got it right.

## Infinite Craft

*[Infinite Craft, 2024, Neal Agarwal](https://neal.fun/infinite-craft/)*

{{< video src="assets/infinite-craft-vid.webm" preload="auto" controls="false" type="video/webm" autoplay="true" loop="true" >}}

This was the first LLM-powered experience that, to me, felt truly magical.

And it had nothing to do with bots, agents, assistants, or code-completion.

In fact, the reason I like Infinite Craft is precisely because it's none of those things. It's a fantastic demonstration, proving the reasoning ability of LLMs can power experiences beyond chatbots.

For the uninitiated: in Infinite Craft, you begin with an empty canvas, and four words: water, fire, wind, earth.

From those four words, what you can create is... well, infinite. Drag "water" onto "fire" and get "steam". Then "steam" plus "wind" make "cloud". "Cloud" plus "earth" makes "Rain".

From those four primitive components, you may craft just about anything.

How about 'internet'?

{{< figure src="assets/infinite-craft-recipe.png" width="50%" class="centered" >}}

You might argue that Infinite Craft could have existed before LLMs, using single-purpose models or simple embeddings for "adding" two words. But I think such an approach 1) wouldn't discover such clever combinations (shark + tornado = sharknado!) and 2) misses the point, which is: a general-purpose LLM powers this with in-context learning, not a specially-crafted and trained model.

## Auren

*[Auren, Elysian Labs, 2025](https://auren.app/)*

{{< figure src="assets/auren.jpg" width="50%" class="centered" >}}

On its surface, Auren is a more "traditional" application of LLMs because it is, at its core, a chatbot.

So what makes Auren special? It's just another chatbot, right? Wrong. It's the experience. Auren's UX is -- dare I say it? -- Apple-like, in its attention to detail, and in how obsessively it replicates the minutiae of chatting with a real (human) friend.

This is partly due to Auren's personality -- we'll get to that -- but in general, the magic is less a matter of *what* Auren says and more a matter of *how* it says it.

Auren pauses to think. Auren takes its time to respond. Artificially. Longer than the underlying LLM takes to generate its response. Auren responds at the *pace* of a real conversation. Like all messaging apps, you see an indicator when Auren is typing; Auren will type, then pause (as if to think), then type more, like a person would. Auren sends messages at the same pace a real person would, and splits its response across messages the way a real person would. Auren adds "reaction" stamps to your messages, the way your friend would in iMessage. Auren will sometimes message you first -- which risks becoming nagging or annoying; but it's not, because, again, the pacing just feels *right*. It's hard to overstate just how far this goes for making the experience feel real, even personal.

After a conversation with Auren, chatting with a "vanilla" LLM such as Gemini or gpt4.1 or Claude feels downright sterile, robotic, impersonal. That's fine, of course; those services have a different goal than Auren. But it shows that LLMs only need to be wrapped with a layer of care, precision, attention to detail, and very clever prompting techniques to transform from robotic to natural.

My only complaint with Auren is how insistently it praises me. It does remind me of the whole ["sycophant" debacle with 4o a while back.](https://openai.com/index/sycophancy-in-gpt-4o/) Despite this, I find Auren to be a really amazing and polished experience.

## NotebookLM

Here's a 15-minute podcast generated by NotebookLM, about the exact topic of this blog post. Enough said.

{{< audio src="assets/notebooklm.mp3" >}}

{{< figure src="assets/notebooklm.png" >}}

## Nano

*[Nano, by JamsVirtual](https://www.twitch.tv/jamsvirtual)*

Let me introduce you to Nano!

{{< video src="assets/nano.webm" preload="auto" controls="false" type="video/webm" autoplay="true" loop="true" >}}

Nano is the creation of a VTuber named [JamsVirtual](https://www.twitch.tv/jamsvirtual).

If you've never heard the term "VTuber" before, the concept is simple: VTubers stream live on Twitch or Youtube, using virtual avatars instead of cameras.

I suppose I must go on a brief tangent about VTubers, or this won't make any sense. A VTuber with a small Twitch channel captures all the expressive energy and chaos of the underground personal websites from the early internet -- think Geocities, think visitor counters; think "under construction" with scrolling marquee text. The equivalent to "welcome to my website" in 2025 is "welcome to my stream". Like those personal websites of the early internet, VTubing is all about personal expression, shared interests, and community. To be a VTuber is to be a projection of yourself while preserving your anonymity -- exactly like the home pages of the early internet.

With that being said: Nano is a "virtual pet" of the VTuber named JamsVirtual. He can talk, he can draw (though his crayon skills are debatable). He has a personality, and a voice, and engages with the viewers who write chat messages alongside the stream.

{{< youtube jjt5rxsPfc8 >}}

If you're a viewer of a JamsVirtual, you probably have an emotional connection to Nano; when he was "sick" (issues with the text-to-speech), viewers wished him a speedy recovery.

Why is Nano so effective? Like Auren, Nano has an obvious LLM at his core. But love and attention has gone into every layer around that core, from the voice -- oddly high-pitched, distinctly compressed, nonsensical annunciation of emoji unicode -- to the Tomodachi-inspired "toy" housing.



## Conclusions

The four examples I gave are only what came to mind first. I don't know if they will resonate with everyone. And I'm sure there are more out there that I haven't even heard of. In summary, I'm very excited for us to finally leave the "iBeer" stage of LLMs -- that's the stage where novelties seem novel. Once we get past that, the truly magical experiences -- the kinds we would struggle to imagine today -- are on the horizon.

{{< figure src="assets/ibeer.png" width="50%" class="centered" >}}

*Above: iBeer, the peak achievement of app development in 2008*