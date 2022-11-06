---
title: "Bear plus snowflake equals polar bear"
date: 2021-06-13T18:08:57-07:00
draft: false
---

#### Prelude: e and e

Quick, how many bytes make up the following line? No tricks, I promise.

```
Hello!
```

The correct answer is: 6. Or 7, if you want to be pedantic and include the newline, but let’s not.

This is simple enough; this page is encoded as UTF-8, which implies 8-bits per ASCII character, or a byte per character.

Let’s play again. How many bytes make up the following line?

```
Hello!!
```

Easy enough. 7. 7 characters, so 7 bytes.

```
$ echo -n 'Hello!!' | wc -c
$ 7
```

One more time. What about the next line?

```
Hеllo!!!
```

Did you guess 8? Or perhaps you realized I was trying to trick you.

Well, I was trying to trick you.

The correct answer is… 9! 9 bytes.

Don’t believe me? Go ahead and copy it from this page, and run a quick check:

```
$ echo -n 'Hеllo!!!' | wc -c
$ 9
```

Huh?? Where’d that extra byte come from? Well, the truth is, there’s an imposter in that line.

That’s right, it was the ol' UTF-8 Cyrillic ‘е’ trick. No one ever expects [U+0435](https://util.unicode.org/UnicodeJsps/character.jsp?a=0435). If it’s your first time encountering this, a brief explanation: yes, UTF-8 is one-byte-per-character for the first 128 characters, correlating perfectly to traditional ASCII. But the full Unicode standard, which UTF-8 encodes, includes [143,859 characters](https://unicode.org/versions/Unicode13.0.0/) as of version 13.0. To represent the full spectrum, UTF-8 must use multiple bytes for some characters (technically, *most* characters). It just so happens that this vast range of characters includes some look-alikes, like your friendly neighborhood 1-byte ASCII “e” and your less-loved but still friendly 2-byte Cyrillic “е”.

UTF-8 uses one to four bytes to encode each Unicode code point.

#### Enter: emojis

Round two. How many bytes in the following line?

```
🙂
```

The correct answer is… 4. To represent Unicode U+1F642, UTF-8 uses the full 4 bytes of a codepoint.

```
$ echo -n '🙂' | wc -c
$ 4
```

Let’s take a look at those bytes:

```rust
// Rust
fn main() {
    let emoji = "🙂";

    println!("Emoji: {}", emoji);
    println!("Length: {}", emoji.len());
    println!("Bytes: {:x?}", emoji.as_bytes())
}
```

Output:

```
Emoji: 🙂
Length: 4
Bytes: [f0, 9f, 99, 82]
```

How do those 4 bytes map to the Unicode character 🙂, code point [U+1F642](https://unicode.org/emoji/charts/full-emoji-list.html#1f642)?

Let’s look at those same bytes, represented in binary:

```
11110000 10011111 10011001 10000010
```

In UTF-8, the first byte tells you how many bytes make up the character. If the byte starts with `0`, it’s a 1-byte character. If it starts with a `1`, it is multiple bytes, and the next three bits tell you just how many bytes. [The wikipedia article probably explains it better than I can](https://en.wikipedia.org/wiki/UTF-8#Encoding), but here’s a simple table:

| `first byte prefix` 	| \| `bytes in the unicode codepoint` |	
| ---- | ---- |
| `0xxxxxxx` 	| \| one byte 			|
| `110xxxxx` 	| \| two bytes 			|
| `1110xxxx` 	| \| three bytes 		|	
| `11110xxx` 	| \| four bytes    |


You may remember how earlier I said UTF-8 uses “one byte per character for the first 128 characters”, mapping directly to ASCII. This is clever and convenient, because the 128 ASCII characters are represented by 7 bits (2^7 = 128), so UTF-8 can use the leftover first bit as a marker and still maintain perfect ASCII compatibility.

[*Relevant reading on StackOverflow: Is ASCII code 7-bit or 8-bit?*](https://stackoverflow.com/questions/14690159/is-ascii-code-7-bit-or-8-bit)

So, back to the binary representation of 🙂. The first byte is `11110000`, which begins with `11110`, meaning we must look at four bytes to know what codepoint this is.

The next three bytes each begin with `10`, which is the other unique prefix in UTF-8. It simply means this byte is not the first in a codepoint. I assume this is so parsers can determine mid-stream whether they are at the beginning of a character or not.

So let’s trim off the prefixes from these four bytes:

```
xxxxx000 xx011111 xx011001 xx000010
```

The result is:

```
000 011111 011001 000010
000011111011001000010 // same, but removed spaces
```

If we take these 21 bits, and represent them as hex, we get:

```
0x1F642
```

Which, what do you know, matches [U+1F642](https://unicode.org/emoji/charts/full-emoji-list.html#1f642), the Unicode codepoint for 🙂!

#### Emoji math 🤯

Let’s play the game from the beginning one last time.

How many bytes are in the following line?

{{< imageresize "/images/hugemoji.png" 40 40 >}}


You might think the answer is 4. You might also think I’m trying to pull a fast one on you.

You’d be wrong about the first, and right about the second.

The answer is…

…35.

No, not 35 *bits*.

**35 bytes.**

I must admit something: I cheated. The example I gave above was actually an image, since your browser may not have recent enough fonts to render this new Unicode 13.1 character. Here’s your browser’s attempt at rendering it natively:

#### 👩🏾‍❤️‍💋‍👩🏻

If your fonts are recent enough, you should see something like the image.

If your fonts are too old to represent [Unicode 13.1](https://emojipedia.org/emoji-13.1/), you may have seen something like this, which answers the riddle of how one UTF-8 character – which we know from earlier is a maximum of 4 bytes – can be 36 bytes:

```
👩🏾❤💋👩🏻
```

That’s right. It’s more than 4 bytes because *it’s more than one character!* The emoji you (hopefully) saw is actually defined *in terms of other emojis*, spliced together with an invisible codepoint!!

Let’s break it down with Emoji Math(TM):


{{< emojiblock >}}
👩🏾 + ❤ + 💋 + 👩🏻 = 👩🏾‍❤️‍💋‍👩🏻
{{</ emojiblock >}}

In fact, we can expand the above even further, since skin tones are spliced together in the same way:

{{< emojiblock >}}
 👩 + 🏾 + ❤ + 💋 + 👩 + 🏻

= 👩🏾 + ❤ + 💋 + 👩🏻 

= 👩🏾‍❤️‍💋‍👩🏻
{{</ emojiblock >}}

All of this can be seen in the Unicode codepoint for the emoji, which Unicode has named: “kiss: woman, woman, medium-dark skin tone, light skin tone”.

[Here’s the raw codepoint definition:](https://unicode.org/emoji/charts/full-emoji-modifiers.html#1f469_1f3fe_200d_2764_fe0f_200d_1f48b_200d_1f469_1f3fb)

```
U+1F469 U+1F3FE U+200D U+2764 U+FE0F U+200D U+1F48B U+200D U+1F469 U+1F3FB
```

And here’s the same, annotated:

```
U+1F469: 👩 (4 bytes)
U+1F3FE: 🏾 (4 bytes)
U+200D : zero-width join (3 bytes)
U+2764 : ❤ (3 bytes)
U+FE0F : variation selector (3 bytes)
U+200D : zero-width join (3 bytes)
U+1F48B: 💋 (4 bytes)
U+200D : zero-width join (3 bytes)
U+1F469: 👩 (4 bytes)
U+1F3FB: 🏻 (4 bytes)

Total: 35 bytes
```

Now we can see how one character can be made up of multiple codepoints which are in turn made up of multiple bytes.

Fun fact: while some of these emoji codepoint combinations are quite obvious, such as:

{{< emojiblock >}}
👩 + 🏾 = 👩🏿
{{< /emojiblock >}}

Others are made up of pretty fun combinations. Clearly the unicode committee had some fun with this. Here are some interesting ones:

{{< emojiblock fontSize="14px" >}}
  👩 (woman; U+1F469)
+ 🌾 (sheaf of rice; U+1F33E)
= 👩‍🌾️ (woman farmer; U+1F469 U+200D U+1F33E)

  👨 (man; U+1F468)
+ 🏭 (factory; U+1F3ED)
= 👨‍🏭️ (man factory worker; U+1F468 U+200D U+1F3ED)

  👩 (woman; U+1F469)
+ ✈ (plane; U+2708)
= 👩‍✈️️ (woman pilot; U+1F469 U+200D U+2708 U+FE0F)

  👩 (woman; U+1F469)
+ 🚀 (rocket; U+1F680)
= 👩‍🚀️ (woman astronaut; U+1F469 U+200D U+1F680)
{{</ emojiblock >}}

And finally, perhaps my favorite, which I like so much I made it the title of this blog post.

{{< emojiblock fontSize="14px" >}}
  🐻 (bear; U+1F43B)
+ ❄ (snowflake; U+2744)
= ️ (polar bear; U+1F43B U+200D U+2744 U+FE0F)
{{</ emojiblock >}}

#### Addendum: characters, or codepoints?

So, as we have learned, a Unicode character can be made of multiple bytes, but it can also be made of multiple other Unicode characters. And they can be quite large – 35 bytes, in the earlier example.

So what about text boxes that have character limits?

What about probably the most famous character limit: a Tweet?

[According to Twitter:](https://developer.twitter.com/en/docs/counting-characters)

> …the text content of a Tweet can contain up to 280 characters or Unicode glyphs. Some glyphs will count as more than one character.

Interesting. It gets even more relevant:

> Emoji supported by twemoji always count as two characters, regardless of combining modifiers. This includes emoji which have been modified by Fitzpatrick skin tone or gender modifiers, even if they are composed of significantly more Unicode code points.

In other words, regardless of the byte count of a Unicode emoji character, it will never count as more than 2 characters.

…which means we can do something like this:



{{< tweet user="andy_xor_andrew" id="1403892858327732226" >}}

{{< tweet user="andy_xor_andrew" id="1403893159994675203" >}}

Of course, if your goal was to use the most amount of data in a single tweet, you would probably upload a video.

But as a software developer, it’s always fun to think about edge cases, and squeezing almost 5KB into a 280-“character” tweet is fun 🙂

*I did my best to be factual and accurate, but if you noticed any errors, email me at andysalerno at gmail dotcom, or file a Github issue at https://github.com/andysalerno/andysalerno.com*