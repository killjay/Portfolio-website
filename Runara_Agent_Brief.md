# Brief: Runara AI agent case study (Version 1 "Explain" → Version 2 "Fix")

You are drafting one portfolio case study for Nandha Kumar Ilangovan, a product designer. The page tells one story in order: the AI agent Nandha designed at Runara, its first version ("Explain"), and the second version three months later ("Fix"). Both versions go on the same page as one flow, not as two separate case studies.

Everything below is either a confirmed fact (sections 3–8) or guidance on how to write it (sections 9–12). Section 10 lists what is not known. Do not fill those gaps yourself.

---

## 1. Ground rules

1. **Use only the facts in this brief.** Do not invent numbers, dates, names, quotes, user personas, screens, metrics, fix types or outcomes. If a sentence needs a fact that isn't here, leave the sentence out and add the question to your hand-back list (section 12).
2. **The résumé is the source of truth.** Recruiters read the résumé and the portfolio side by side, so the page must never say more than, or something different from, the résumé. The résumé wording is quoted in section 3.
3. **No visible placeholders.** Nandha removed every visible `[TODO]` from the live site on 20 Oct 2026. Mark missing screens or facts with HTML comments (`<!-- IMAGE: … -->`, `<!-- NEEDS: … -->`), never with text a visitor can see.
4. **Don't imply a cause or an order the facts don't state.** For example, don't write "because 64% engaged, I built the Fix button". Nobody has said why Version 2 was built.
5. **Keep it short.** There are not many facts. A short page with real facts is better than a long one with filler.

---

## 2. Who Nandha is (for context)

- Product designer with 5+ years of experience (designing since 2019). M.S. in Human-Computer Interaction, Iowa State University (2025). Based in Bengaluru, India.
- Portfolio: https://nandha.design (static site, deployed from GitHub Pages).
- At Runara the title was **Senior Product Designer**. The résumé headline is now plain "Product Designer". Use "Senior Product Designer" only for the Runara role.

---

## 3. The résumé wording (source of truth)

> **Senior Product Designer, Runara** | San Jose, CA, USA | Jun 2025 – Jul 2026
> - Sole designer, also acting as PM, on an AI deployment platform (developer tools) for teams at companies including Meta and AMD. Tested every feature with about 150 beta users and presented work and findings weekly to the CEO, CTO and engineers.
> - Non-technical users could not read GPU and model-behaviour metrics, so I designed an AI agent that analyses them (including hallucination rate) and explains what to fix and why, ranked critical to low. Three months later I added a Fix button: the agent applies the fix, explains the change, and the user approves it before it deploys. Both shipped to beta users: 64% engaged with the explanations, and in the Fix version 83% went on from explanation to Fix.
> - Delivered tested working code, not mockups: designed in Figma, built each feature in a branch with Claude Code, smoke-tested and fixed bugs with an engineer, released to beta, and validated through analytics and interviews before handing it to engineering.
> - Worked with the CTO to cut the default metrics view down to the few metrics users relied on, and moved the rest behind search.

From the résumé summary: *"as sole designer on an AI deployment platform, I designed an agent that turns GPU and model metrics into ranked, explainable fixes for non-technical users."*

---

## 4. Context: the company, the role, the users

| Item | Confirmed fact |
|---|---|
| Company | Runara, an AI deployment platform (developer tools). Listed on the résumé as San Jose, CA, USA. |
| Who used it | Teams at companies **including Meta and AMD**. Use exactly this phrasing. Don't call them "customers" or "clients", and don't use their logos. |
| Beta users | **About 150** beta users. Many were not ML engineers (the résumé says "non-technical users"). |
| Nandha's role | Senior Product Designer. **Sole designer, also acting as PM.** |
| Who Nandha worked with | The CEO, the CTO and engineers. One engineer smoke-tested each build with Nandha and helped fix bugs. Work was presented to the CEO and CTO at a **weekly review**. |
| Time at Runara | Jun 2025 – Jul 2026. |
| Version timing | Version 2 shipped **three months after** Version 1. The actual ship dates are not known. |
| Tools | Figma, Claude Code, feature branches. |

---

## 5. The problem

- Runara shows **GPU metrics and model-behaviour metrics** for every deployment, **including hallucination rate**.
- That works for an ML engineer. **Many of the beta users weren't ML engineers.** They could see the numbers, but the numbers didn't tell them what was wrong or what to do about it.
- Problem statement (already used on the site, fine to reuse): *Non-technical beta users couldn't read GPU and model-behaviour metrics, so they couldn't tell what was wrong with a deployment or what to fix first.*

**A related piece of work you can mention.** Nandha worked with the CTO to **cut the default metrics view down to the few metrics users relied on, and moved the rest behind search.** It belongs in the problem section as the first, simpler answer. The agent went further: it reads the metrics *for* the user. **We don't know** whether this happened before, during or after Version 1, so don't put it in order.

---

## 6. Version 1: "Explain"

**What Nandha did:** designed (and built, see section 8) an AI agent that reads the platform's metrics for the user.

**What the agent does:**
1. It analyses the deployment's GPU and model-behaviour metrics (including hallucination rate).
2. It turns them into a **list of issues**, ranked by severity: **critical → high → medium → low**.
3. Each issue says **what to fix and why**.
4. The agent's **reasoning is collapsed by default**. The user clicks to expand it if they want to check it.

**Result:** shipped to beta users. **64% explanation engagement**, meaning users clicking to expand the agent's reasoning.

**Not stated:** in Version 1 the agent explains but does not act. How users then made the fix (by hand, through another screen, through an engineer) is not known, so don't describe it.

---

## 7. Version 2: "Fix" (three months later)

**What Nandha did:** added a **Fix button** to the same flow. The agent can now make the fix, but only once the user approves it.

**The flow, in this exact order:**
1. The agent flags an issue and explains it, as in Version 1.
2. The user clicks **Fix**.
3. The agent **applies the fix and explains what it changed**.
4. The user **approves** it. **Only then does it deploy.**

**Result:** shipped to beta users. **83% engagement-to-action rate**, meaning from issue, to explanation, to clicking Fix. Résumé wording: *"in the Fix version 83% went on from explanation to Fix."*

**The point of Version 2:** the human approval step is the whole idea. Nandha has explicitly removed "no human in the loop" from the résumé and portfolio. Never describe Version 2 as autonomous, automatic or self-healing.

---

## 8. How Nandha worked (same loop for both versions)

Working code, not mockups. Each version went through this loop:

1. Designed it in **Figma**.
2. Built it in a **feature branch with Claude Code**.
3. **Smoke-tested** it and **fixed bugs with an engineer**.
4. **Released it to beta users.**
5. **Validated** it with **analytics and interviews**.
6. **Presented** it to the **CEO and CTO at the weekly review**, then **handed it to engineering**.

Use "I" for the design, the Claude Code build and the PM work. The smoke testing was done *with* an engineer, and engineering took the work over after the handoff.

---

## 9. The numbers: how to present them

| Number | What it is | Version |
|---|---|---|
| ~150 | Beta users, from teams at companies including Meta and AMD | Both |
| 64% | Explanation engagement: users clicking to expand the agent's reasoning | Version 1 (Explain) |
| 83% | Engagement-to-action: from issue, to explanation, to clicking Fix | Version 2 (Fix) |

**Important:**
- **64% and 83% measure different things in different versions.** Don't show them as "64% → 83%", as an improvement, or as two steps of one funnel.
- **Don't work out new numbers** from them, such as "about 96 users" or "a 19-point lift".
- **Unknown:** whether they were counted per user or per issue, over what time period, and from how many users or issues. Describe them only by the definitions above.
- **There are no outcome metrics.** Nothing says the agent reduced hallucination rate, improved GPU performance, saved time or cut support load. Don't claim any outcome beyond "both shipped to beta users" and the two engagement numbers.

---

## 10. Not known: do not invent

- Ship dates for Version 1 and Version 2. Only "three months apart" is known.
- How many engineers there were, and the rest of the team by role.
- Which metrics the agent read beyond "GPU and model-behaviour metrics, including hallucination rate". Don't add examples like utilisation, memory, latency or throughput.
- **What kinds of fixes** the agent could apply. Don't add examples like "change the batch size" or "switch the model".
- How severity was decided, and whether or how the agent showed its confidence.
- What happens if the user rejects a fix, and whether a fix can be rolled back.
- What the AI is never allowed to do alone (beyond: it does not deploy without the user's approval).
- What users said in interviews, and any feedback that changed the design.
- Why Version 2 was built, and what Version 1 taught.
- What didn't work.
- Any screens. None have been supplied yet.
- Whether the agent UI was built on Nandha's Runara design system (Figma plus coded React / Material UI components). That design system is real, but its link to this feature isn't confirmed.

---

## 11. Words and claims that must never appear

- **Old claims Nandha removed:** "about 100 beta users", "three-person team", "no human in the loop", "review time mostly disappeared".
- **Wrong framing for Version 2:** "autonomous", "auto-fix", "self-healing", "fixes itself", "one-click fix". The user approves every fix before it deploys. ("One-click Fix" showed up in a cover-letter draft, but it isn't confirmed and it hides the approval step.)
- **Wrong framing for the role:** "lead designer", "design team", "other designers". Nandha was the only designer.
- **Wrong framing for the companies:** "Meta and AMD use Runara" or "our customers Meta and AMD". Always say "teams at companies including Meta and AMD".
- Invented quotes, user names, personas or testimonials.

---

## 12. Voice and wording

- **First person, plain, short sentences, no buzzwords.** It reads like a senior product designer explaining their own work, not like marketing copy.
- Use product-design and UI terms precisely: issue list, severity, expand/collapse, approval step, beta, smoke test, handoff.
- Version names are **"Explain"** and **"Fix"**, with capitals.
- These headings from the current page are in Nandha's voice and can be reused or used as a model:
  - "Turning GPU metrics into fixes non-experts can approve" (page title)
  - "Metrics most of our users couldn't read."
  - "An agent that says what to fix, and why."
  - "Three months later, a Fix button. The user still decides."
  - "Working code, not mockups."
- **Framing you may use** (this is interpretation, not a fact, so keep it modest): Version 1 had the agent *tell* users what to fix. Version 2 let it *make* the fix, with the decision staying with the user. The story is the agent taking on more work while the user keeps control.

---

## 13. Suggested page outline

1. **Hero.** Tags: `Runara · Senior Product Designer · AI agent · Developer tools`. Title: "Turning GPU metrics into fixes non-experts can approve". Lede: 2–3 sentences covering who the users were, what was wrong and what the two versions did.
2. **Meta row.** Role (Senior Product Designer; sole designer, also acting as PM) · Users (about 150 beta users, from teams at companies including Meta and AMD) · Versions (Explain, then Fix three months later) · Built with (Figma, Claude Code).
3. **Role and team.** My role · Team (you, an engineer you smoke-tested each build with, and the CEO and CTO at the weekly review) · Duration (at Runara Jun 2025 – Jul 2026; Fix shipped three months after Explain) · Outcome (both versions shipped to beta; 64% and 83%). Leave out the "Feedback" line until Nandha gives a real example.
4. **Stat strip.** ~150 beta users · 64% explanation engagement (Explain) · 83% engagement to action (Fix). Each needs its own caption so the two percentages aren't read as one funnel.
5. **(01) The problem.** Section 5, including the metrics-view trim with the CTO.
6. **(02) Version 1: Explain.** Section 6. `<!-- IMAGE: issue list ranked critical→low, with one issue's reasoning expanded -->`
7. **(03) Version 2: Fix.** Section 7, with the four steps as a numbered list. `<!-- IMAGE: Fix flow: Fix button → what changed → approve → deploy -->`
8. **(04) How I worked.** Section 8, as a numbered list.
9. **(05) How the numbers were measured.** The two definitions from section 9, and nothing else.

Don't add sections for "Why a human approves every fix", "What didn't work" or "Lessons" yet. They need answers only Nandha has (section 10).

---

## 14. If you are working in the site's code

- **Repo:** `/Users/nandhakumarilangovan/Nandha Portfolio/Portfolio-website`. Static HTML, one shared stylesheet, `site.css`.
- **Existing page:** `RunaraAgent.html` already covers this project in a shorter form and is live. Use it as your starting point and template, and keep its header, nav, footer and scripts.
- **Template classes on that page:** `body.cs-tint-runara` · hero `cs-hero`, `cs-hero__tags`, `cs-hero__title` (with `span.highlight`), `lede cs-hero__lede` · meta `dl.cs-meta` · Role and team `cs-tldr` / `cs-tldr__key` / `cs-tldr__val` · stats `cs-statstrip` / `cs-stat` / `cs-stat__num` / `cs-stat__label` / `cs-stat__cap` · sections `cs-section` > `cs-section__head` (`eyebrow eyebrow--accent cs-section__eyebrow` + `h2 cs-section__title`) + `cs-prose` · callouts `cs-decision`. Reuse these. Don't add new visual styles unless a screen needs one.
- **Page tint:** `--tint-runara: #D4D9E2`. Cover diagram: `Images/runara-agent.svg`.
- **Fonts:** Bricolage Grotesque (display), Geist (body), Geist Mono.
- **Text contrast** must meet WCAG AA. The site's grey and orange text tokens were darkened on 20 Oct 2026 for this; use the existing tokens.
- The page is linked from `index.html` (first in the work list) and `resume.html`.
- **Do not commit or push.** `main` deploys straight to nandha.design. Leave your changes for Nandha to review.
- If you can't see the code, return the page as structured copy (headings, body text, stat captions, image alt text) that can be dropped into this template.

---

## 15. What to hand back

1. The draft page (or copy).
2. **Questions for Nandha:** every fact you needed and didn't have, using section 10 as the starting list.
3. **Interpretation check:** every sentence that frames or interprets rather than states a fact from this brief, so Nandha can approve or cut it.
