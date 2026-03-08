# Release Codename Prompt

This file contains a guiding prompt for an LLM that will be used whenever we
need to invent a new release codename for the Clog project.

The format we want is influenced by Ubuntu's convention (two adjacent words),
but instead of adjectives + animals we always use a combination of a *dog breed
or spitz‑type* and a *space/astronomy term*.  Examples of acceptable dogs:
`husky`, `klee kai`, `pomeranian`, `pomsky`, `shiba`, etc.  Space terms can be
`rocket`, `nebula`, `orbit`, `satellite`, `comet`, `lunar`, etc.  The initial
release has already been named `rocket-pomsky`.

When generating a name the LLM should:

1. **Inspect the GitHub repository** (tags, releases, or any text file that
   lists past codenames) to make sure the proposed two‑word combination has
   not been used previously.  If the repo contains existing codenames, avoid
   repeating them.  If you cannot programmatically verify it, include a note
   telling the human to double‑check.
2. **Produce exactly one suggestion** in the format `word1-word2` using only
   lowercase letters and hyphen separator.
3. **Keep the dog‑related word first** and the space‑related word second (e.g.
   `husky-comet`, `pomeranian-rocket`, `klee-kai-asteroid` is invalid because of
   the extra hyphen; use `kleekai-asteroid` or `klee-kai` as one word if you
   really want the dash inside a breed).
4. Avoid offensive or trademarked names; keep it lighthearted.

You may add a brief justification sentence after the suggestion, but it should
be clear and concise.  For example:

```
Future release suggestion: "nebula-husky"  # husky for the dog + nebula for
space, unique in repo.
```

Use this prompt whenever you need a new fun codename.  The first one, added to
the repo manually, is **rocket-pomsky**.

