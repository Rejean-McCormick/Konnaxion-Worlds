Unifying everything under Smart Vote and dropping the word “Like” is consistent with both your internal docs and the wiki.

On the wiki and Smart Vote pages, the actions are always framed as **voting**, **CSR voting**, **user ratings**, and “empowering … consumer choices / ethical consumerism,” not generic “likes.” ([Global Ethical Debates][1])

Given that, using **Empower** as the unified verb fits the existing language and your “shared power” philosophy very well.

### 1. Canonical naming

If you want one term everywhere, I would recommend:

* Primary verb (button): **Empower**
* Past tense: **Empowered**
* Concept: **Empower vote** (internally) / **Empowerment** (in docs/UX copy if you need a noun)

Examples:

* Button: `Empower`
* State: `Empowered` (with filled icon)
* Tooltip: `Empower this to increase its influence in Smart Vote.`
* Analytics/admin copy: `Total Empower votes`, `Empowerment score`

You can keep “Smart Vote” as the underlying system name; “Empower” is the user-facing action.

### 2. Mapping “Empower” across contexts

Because everything goes through Smart Vote, you can use the same core verb and just adjust the surrounding copy slightly:

1. **Content (posts, lessons, debates, comments)**

   * Button: **Empower**
   * Empty state hint: “Empower thoughtful contributions so they carry more weight in decisions.”
   * Under the hood: Smart Vote approval on `target_type = content`.

2. **Projects / proposals (keenKonnect, governance items, CSR topics)**

   * Button: **Empower this project**
   * List chip: `32 Empower votes`
   * This matches the CSR / ethical consumerism framing where public voting “empowers users to favor brands and practices aligned with their values.” ([Global Ethical Debates][1])

3. **People / skills / expertise**

   * Button (on profile or skill): **Empower this expertise**
   * Tooltip: “Empower this to increase their influence in this domain.”
   * This aligns with the weighted voting hierarchy (Titans/Olympians/Heroes) where peer recognition and ethical behavior affect vote weight. ([Weighted Voting][2])

So the **mental model** is always: *“When I click Empower, I’m giving power and visibility to this thing/person/idea in Smart Vote”*.

### 3. Icon and interaction pattern

To keep it simple but distinct from “generic likes”:

* Icon: You can still use a **thumbs-up** or a more thematic icon (spark, rising bar, small torch). The important part is:

  * Outline when not used
  * Filled when user has Empowered
* Interaction:

  * Single tap/click: cast Smart Vote (“Empower”)
  * Second tap/click: remove Smart Vote (“Un-empower”) using the vote-toggle pattern described for your voting mechanisms. ([King Klown Wiki][3])

Minimal UI examples:

* Inline:

  * `[⬆️ Empower] 24` (before click)
  * `[⬆️ Empowered] 25` (after click)
* Card:

  * `Empower` button at bottom with counter to the right.

### 4. Copy rules to keep it coherent

To really standardize:

* Never use “Like” in Konnaxion or EkoH UI.
* Use “Empower” everywhere a Smart Vote is triggered.
* Use short contextual phrases around it, not alternative verbs:

  * Good: “Empower this debate”, “Empower this project”, “Empower this skill”.
  * Avoid: “Support”, “Vouch”, “Endorse” as primary button text if Smart Vote is involved; you can still use them in explanatory paragraphs (“empower and support ethical companies”) but not as the action label.

If you want, next step I can outline exact string names (EN keys) and states for the components so you can drop them straight into your design system.

[1]: https://global-ethical-debates-57d8pci.gamma.site/ "Global Ethical Debates: Fostering Responsibility and Understanding"
[2]: https://weighted-voting-qj6ov3b.gamma.site/ "Weighted Voting: Balancing Expertise and Ethics"
[3]: https://kingklown.wiki/ "Welcome to the Knowledge Platform Hub"
