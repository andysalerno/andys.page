---
title: "Using Guidance with GPTQ"
date: 2023-05-18T14:52:01-07:00
draft: false
---

I've been very enthusiastically playing with [guidance](https://github.com/microsoft/guidance), a library from Microsoft that lets you compose prompts for LLMs, and interact with those LLMs programmatically in a very natural way. I plan on using it for my personal projects going forward.

I'm excited because this library lets you build prompts the way you *think* about prompts. No more fussing around with Langchain.

One issue is, I mostly play with GPTQ-quantized models. My current favorite is [Wizard-Vicuna-13B-Uncensored-GPTQ](https://huggingface.co/TheBloke/Wizard-Vicuna-13B-Uncensored-GPTQ), very kindly quantized by [TheBloke.](https://huggingface.co/TheBloke)

{{< figure src="assets/guiding-ai.png" >}}

> *Generated with Bing from prompt: "a newspaper cartoon, black and white, cartoonish, of a human guiding an AI"*

Guidance doesn't have built-in support for GPTQ yet, but it's pretty trivial to add it. Fair warning, this is a bit of a hack, mostly just glueing together the GPTQ model loading provided by the GPTQ project, plus some helpers from [oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui/blob/main/modules/GPTQ_loader.py) (which help with loading models of varying name patterns). Also note, since it borrows from those projects, it adheres to their licenses, so keep that in mind if you end up using this for anything outside of a toy project.

To make guidance work with GPTQ, I simply [forked the GPTQ repo](https://github.com/andysalerno/guidance-GPTQ-for-LLaMa/tree/triton), added `guidance` to the `requirements.txt`, and then added a file [llama_quantized.py](https://github.com/andysalerno/guidance-GPTQ-for-LLaMa/blob/triton/llama_quantized.py) that adds an implementation of the class `guidance.llms._transformers.Transformers` called `LLaMAQuantized`. From that point, you can use guidance as normal, but create an instance of `LLaMAQuantized` instead of, say, `OpenAI`.  Here's an example:

```python
import guidance
from llama_quantized import LLaMAQuantized

# use `model` how you'd use any other guidance llm
model = LLaMAQuantized(model_dir='/home/models', model='Wizard-Vicuna-13B-Uncensored-GPTQ')

# Example below taken from the guidance examples, slightly modified:
demo_results = [{'text': 'OpenAI systems run on the fifth most powerful supercomputer in the world. [5] [6] [7] The organization was founded in San Francisco in 2015 by Sam Altman, Reid Hoffman, Jessica Livingston, Elon Musk, Ilya Sutskever, Peter Thiel and others, [8] [1] [9] who collectively pledged US$ 1 billion. Musk resigned from the board in 2018 but remained a donor.'},
 {'text': 'About OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity. Our vision for the future of AGI Our mission is to ensure that artificial general intelligence—AI systems that are generally smarter than humans—benefits all of humanity. Read our plan for AGI'},
 {'text': 'Samuel H. Altman ( / ˈɔːltmən / AWLT-mən; born April 22, 1985) is an American entrepreneur, investor, and programmer. [2] He is the CEO of OpenAI and the former president of Y Combinator. [3] [4] Altman is also the co-founder of Loopt (founded in 2005) and Worldcoin (founded in 2020). Early life and education [ edit]'}]

practice_round = guidance(
'''{{#user~}}
Who are the founders of OpenAI?
{{~/user}}
{{#assistant~}}
<search>OpenAI founders</search>
{{~/assistant}}
{{#user~}}
Search results:
{{~#each results}}
<result>
{{this.text}}
</result>{{/each}}
{{~/user}}
{{#assistant~}}
The founders of OpenAI are Sam Altman, Reid Hoffman, Jessica Livingston, Elon Musk, Ilya Sutskever, Peter Thiel and others.
{{~/assistant}}''', model)

practice_round = practice_round(results=demo_results)

def is_search(completion):
    return '<search>' in completion

def search(query):
    search_results = web_search(query)
    scored_results = find_closest_sections(search_results, query)
    scored_results = scored_results[:4]
    print(scored_results)
    return scored_results

prompt = guidance('''{{#system~}}
You are a helpful assistant.
{{~/system}}
{{#user~}}
From now on, whenever your response depends on any factual information, please search the web by using the function <search>query</search> before responding. I will then paste web results in, and you can respond. But please respond as if I have not seen the results.
{{~/user}}
{{#assistant~}}
Ok, I will do that. Let's do a practice round.
{{~/assistant}}
{{>practice_round}}
{{#user~}}
That was great, now let's do another one.
{{~/user}}
{{#assistant~}}
Ok, I'm ready.
{{~/assistant}}
{{#user~}}
{{user_query}}
{{~/user}}
{{#assistant~}}
{{gen "query" stop="</search>"}}{{#if (is_search query)}}</search>{{/if}}
{{~/assistant}}
{{#if (is_search query)}}
{{#user~}}
Search results: {{#each (search query)}}
<result>
{{this.text}}
</result>{{/each}}
{{~/user}}
{{#assistant~}}
{{gen "answer"}}
{{~/assistant}}
{{/if}}''', model)

prompt = prompt(practice_round=practice_round, search=search, is_search=is_search, user_query="Where are the best places to see cherry blossoms in Seattle?")
```

[See the full notebook output here.](https://github.com/andysalerno/guidance-GPTQ-for-LLaMa/blob/triton/guidance_playground.ipynb)

*Note: I am employed by Microsoft but I have no relation to the guidance project or the authors. Opinions are my own.*
