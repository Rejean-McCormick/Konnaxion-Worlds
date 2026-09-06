# **Smart Vote Consultation Simulations**

**Smart Vote Overview:** *Smart Vote* is a weighted voting system that adjusts each individual’s voting power based on their expertise in relevant knowledge domains and their ethical standing. Instead of “one person, one vote,” each voter carries a weight calculated from a *merit profile* across pertinent domains and an ethics multiplier. In the following simulations, we run five public consultations – on climate policy, vaccine mandates, AI regulation, international aid, and arts funding – involving well-known figures (Barack Obama, Donald Trump, Pope Francis, a relevant Nobel laureate, Bill Gates, Greta Thunberg, Tom Hanks, and James Hetfield). For each consultation, we identify key domains of expertise (aligned with UNESCO’s ISCED-F classification) and assign domain weightings proportional to their importance for the issue. We then assign realistic domain-specific merit scores (0–10) to each personality, reflecting their expertise or accomplishments in those areas, and an estimated ethics multiplier (\>1.0 for notable positive ethical contributions, \~1.0 baseline, or \<1.0 if tarnished by controversy). Finally, we apply the Smart Vote formula:

Total Voting Weight=(∑domains d(DomainWeightd×Merit in d))×Ethics Multiplier.\\text{Total Voting Weight} \= \\Big(\\sum\_{\\text{domains }d} (\\text{DomainWeight}\_d \\times \\text{Merit in }d)\\Big) \\times \\text{Ethics Multiplier}.

This produces each individual’s effective voting weight. Below we detail each consultation, the chosen domains and weights, participants’ merit profiles, and the resulting weighted vote distribution. (All domain fields are drawn from UNESCO’s ISCED-F taxonomy – e.g. *Environmental Sciences* (code 0521), *Political Science* (0312), *Economics* (0311), etc. – ensuring standard definitions of expertise areas.)

## **Consultation 1: Climate Policy**

**Issue:** A public consultation on national **Climate Policy** (e.g. setting emissions targets, climate action plans).

**Relevant Domains & Weights:** For climate policy, we consider three primary domains: **Environmental Science** (50%), **Public Policy (Political Science)** (30%), and **Economics** (20%). These weights reflect that climate decision-making relies most on climate/environmental science expertise, with significant input from policy/governance knowledge and some economic consideration (for cost-benefit and implementation feasibility). Environmental science corresponds to the field of environmental sciences in UNESCO’s classification, political/public policy expertise falls under social sciences (political science and civics), and economics is a key social science relevant to climate policy.

**Participants’ Merit Profiles:** Below is each figure’s merit vector in the relevant domains (0–10 scale), their ethics multiplier, and the resulting total weight. We assign high merit in *Environmental Science* to the climate science Nobel laureate, while Greta Thunberg, as a climate activist, has moderate climate-science familiarity. Barack Obama and Donald Trump have low environmental science expertise but high and moderate public policy merits respectively (as former presidents). Obama also scores moderately in economics (having dealt with economic policy), whereas Trump, with a business background, scores relatively high in economics. Pope Francis, despite moral leadership on climate (he wrote the encyclical *Laudato si’* on the environment), has minimal formal science or policy expertise, but we will see his strong ethics multiplier boost his weight. Bill Gates is assigned moderate environmental science merit (due to his engagement in climate innovation investments) and high economics merit, given his experience in technology business. Tom Hanks and James Hetfield, with no particular background in these domains, have negligible merit scores. The ethics multipliers qualitatively reflect each individual’s public ethical stance: e.g. Pope Francis (renowned for humility and social justice) gets a high multiplier (1.20), Bill Gates (major philanthropist) 1.10, Greta Thunberg (altruistic activist) 1.10, Barack Obama and Tom Hanks around 1.05 (respected public figures with generally positive ethical reputations), a baseline 1.00 for the Nobel laureate (assumed neutral), and a slightly lower value for Donald Trump (0.90, due to controversies affecting his perceived ethics). James Hetfield is given 0.95 (little public philanthropic record).

| Participant | Environmental Science | Public Policy (Political Science) | Economics | Ethics Multiplier | Total Weight |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Nobel Laureate (Climate Science) | 10 | 5 | 3 | 1.00 | 7.10 |
| Barack Obama | 4 | 10 | 7 | 1.05 | 6.72 |
| Bill Gates | 5 | 4 | 8 | 1.10 | 5.83 |
| Greta Thunberg | 6 | 5 | 2 | 1.10 | 5.39 |
| Donald Trump | 1 | 7 | 8 | 0.90 | 3.78 |
| Pope Francis | 2 | 3 | 2 | 1.20 | 2.76 |
| Tom Hanks | 1 | 1 | 2 | 1.05 | 1.26 |
| James Hetfield | 1 | 1 | 1 | 0.95 | 0.95 |

*Table: Merit vectors and calculated voting weights for the Climate Policy consultation.* The Nobel-winning climate scientist unsurprisingly excels in *Environmental Science* (10/10), giving her the highest weight. Obama’s perfect 10 in public policy and solid economics (7) make him a close second in total weight, aided by a modest ethics bump. Bill Gates and Greta Thunberg cluster next; Gates leverages strong economics and a good ethics score, while Greta’s domain knowledge (though not expert-level) plus high ethics yield a comparable weight. Trump’s influence is lower – despite decent economics and policy scores, his negligible science merit and a penalty on ethics diminish his weight. Pope Francis, with scant technical merits, relies on his 1.20 ethics factor to reach 2.76 weight (still modest overall). Hanks and Hetfield, lacking expertise in any relevant domain, end up with minimal weights (\~1 or less), effectively having a very minor say on this technical climate policy issue. This outcome demonstrates the Smart Vote principle: those with domain-aligned expertise and positive social contributions carry more influence, whereas popular figures without relevant knowledge (or with lesser ethical standing) have proportionally less sway.

*Figure: Weighted vote distribution among participants for the Climate Policy consultation.* The chart highlights the **Nobel Laureate** (far right bar) as having the greatest voting weight (\~7.1) due to top-tier environmental science credentials. **Barack Obama** follows closely, reflecting his strong public policy expertise (the second-highest bar). **Bill Gates** and **Greta Thunberg** have substantial but lower weights (middle bars), each contributing meaningfully thanks to moderate domain knowledge and high ethics. In contrast, **Tom Hanks** and **James Hetfield** (far left bars) hold almost negligible weight, illustrating how limited domain expertise results in minimal influence under Smart Vote’s weighted system.

## **Consultation 2: Vaccine Mandates Policy**

**Issue:** A consultation on **Vaccine Mandates** (e.g. requiring COVID-19 vaccinations) – a topic at the intersection of public health, law, and ethics.

**Relevant Domains & Weights:** Key domains here include **Medical Science (Health)** (50%), **Public Policy / Law** (30%), and **Ethics / Social Impact** (20%). Successfully evaluating vaccine mandate policy requires foremost an understanding of health and epidemiology (hence 50% weight on medical science, which falls under Health & Welfare in ISCED classifications), significant knowledge of legal/government policy frameworks (30% weight, aligning with political science/law fields), and consideration of ethical and societal implications (20% weight, reflecting the importance of ethics and public trust – ethics as an academic field is classified under Philosophy & Ethics in UNESCO terms).

**Participants’ Merit Profiles:** For medical science, we grant a perfect 10 to the Nobel Laureate in Medicine (representing a top virologist or immunologist). Bill Gates, through his foundation’s extensive work on global health and vaccines, scores a notable 6 in medical knowledge. Obama and Trump have minimal medical science background (3 and 1 respectively), while Pope Francis and the activist/celebrity figures score 1 (no medical training). In Public Policy/Law, Obama earns 10 (deep experience in governance), Trump 7 (some policy exposure as former president), and Gates 6 (experience influencing global health policy via philanthropy); the Nobel scientist and Greta get 5 and 2 respectively (scientists often engage in advisory roles to some extent, and Greta’s policy knowledge here is minimal). Ethics/Social Impact merit is highest for Pope Francis, a moral authority who has publicly emphasized caring for others, solidarity, etc., here given 10\. Gates and the Nobel laureate both have strong ethics/social scores (7 each), reflecting Gates’s philanthropic mission and a scientist’s adherence to ethical standards in public health. Obama scores 7 (valuing science and societal well-being in his leadership), Greta Thunberg 5 (no specific role in vaccine ethics but a general social conscience), Tom Hanks 4 (he advocated for COVID precautions, leveraging his trusted reputation), and Trump only 3 (heavily criticized for spreading misinformation, indicating a low alignment with the ethical promotion of public health). The ethics multipliers remain as before: Pope Francis the highest (1.20), Gates and Greta 1.10, Obama/Hanks 1.05, Nobel laureate baseline 1.00, Trump 0.90, Hetfield 0.95.

| Participant | Medical Science (Health) | Public Policy / Law | Ethics / Social Impact | Ethics Multiplier | Total Weight |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Nobel Laureate (Medicine) | 10 | 5 | 7 | 1.00 | 7.90 |
| Bill Gates | 6 | 6 | 7 | 1.10 | 6.82 |
| Barack Obama | 3 | 10 | 7 | 1.05 | 6.20 |
| Pope Francis | 1 | 2 | 10 | 1.20 | 3.72 |
| Donald Trump | 1 | 7 | 3 | 0.90 | 2.88 |
| Tom Hanks | 2 | 2 | 4 | 1.05 | 2.52 |
| Greta Thunberg | 1 | 2 | 5 | 1.10 | 2.31 |
| James Hetfield | 1 | 1 | 2 | 0.95 | 1.14 |

*Table: Merit and weight summary for the Vaccine Mandates consultation.* The Nobel-winning physician, with unparalleled medical expertise, achieves the top weight (\~7.9). Bill Gates closely follows (\~6.8) – while not a doctor, his solid grasp of public health policy and strong ethical reputation boost his influence. Obama also scores highly (\~6.2), thanks to his policy experience and ethical credibility, even though his medical knowledge is limited. A significant drop follows: Pope Francis reaches about 3.7 weight – his negligible science/policy merits are partially offset by a high ethics factor and moral voice. Trump’s weight (\~2.9) remains low, dragged down by poor science understanding and a lower ethics multiplier, despite some policy influence. The remaining figures (Hanks \~2.5, Greta \~2.3, Hetfield \~1.1) have marginal impact. Notably, the spread of weights shows that domain experts and those actively engaged in health causes dominate the consultation outcome, whereas celebrity status alone (Hanks, Hetfield) or high office without science alignment (Trump) results in substantially less weight.

*Figure: Weighted vote distribution for the Vaccine Mandates consultation.* **Nobel Laureate (Medicine)** holds the greatest weight (rightmost bar), reflecting primacy of medical expertise in this decision. **Bill Gates** and **Barack Obama** also command significant weight (next bars to the left), leveraging their contributions to public health policy and governance. The middle bars (e.g. **Pope Francis**) show moderate influence coming mainly from ethical authority rather than technical expertise. The least-weighted participants (**Tom Hanks**, **Greta Thunberg**, **James Hetfield**) have minimal influence (far left bars), underscoring that without medical or policy expertise their voices carry little weight on this public health mandate.

## **Consultation 3: AI Regulation**

**Issue:** A consultation on **AI Regulation** (e.g. how to govern artificial intelligence and algorithms). This topic blends technological, legal, and ethical dimensions.

**Relevant Domains & Weights:** We define three relevant domains: **Computer Science (AI Technology)** (40%), **Public Policy / Law** (30%), and **Ethics** (30%). Expertise in AI technology (computer science, specifically AI development) is crucial (40%) for informed regulation. Policy and legal expertise is also key (30%) for crafting implementable regulations. Given widespread concerns about AI’s moral implications, we allocate a substantial weight to ethics (30%) – understanding AI ethics, risks, and societal impacts is on par with policy know-how here. (In UNESCO’s framework, *Artificial Intelligence* falls under Information & Communication Technologies – e.g. AI is listed as a topic under ICT fields – while *Computer Science* and software development are core ICT subfields. Ethics remains under Philosophy/Ethics as a knowledge domain.)

**Participants’ Merit Profiles:** The Nobel-caliber participant here is not literally a Nobel (there is no Nobel in computer science), but we include a **Turing Award**\-level AI researcher as “Nobel Laureate (AI Research)” with top technical merit (10 in AI tech domain). Bill Gates, a tech pioneer, scores just below (9) in AI tech – while not an AI researcher, he has deep computing expertise and actively engages with AI issues. Obama and Trump have minimal technical knowledge (3 and 2 respectively), and the non-tech figures (Pope, Greta, Hanks, Hetfield) each have virtually none (1 each). In policy/legal domain, Obama again leads with a 9 (experience in governance of tech policy), Trump 6, Gates 7 (he often advises on tech policy, antitrust, etc.), the AI expert 6 (some have policy advisory experience), and others low (Pope 2, Greta/Hanks/Hetfield 1 each). For ethics domain merits, Pope Francis excels (10) – he has spoken about ethics of technology and prioritizes moral considerations, thus is highly attuned to ethical discourse. The AI expert and Gates both have solid ethics awareness (7 each), given many AI researchers and tech leaders are actively engaged in AI ethics and Gates has warned of AI risks (and strives for responsible innovation). Obama has a good ethical understanding (7) informed by prioritizing civil liberties and human values in governance. Greta, Hanks, Hetfield have low-to-moderate “AI ethics” familiarity (3, 3, 2 respectively – they have general moral perspectives but no specific AI focus). Ethics multipliers remain consistent (Pope 1.20, Gates/Greta 1.10, Obama/Hanks 1.05, AI expert 1.00, Trump 0.90, Hetfield 0.95).

| Participant | Computer Science (AI Tech) | Public Policy / Law | Ethics (domain) | Ethics Multiplier | Total Weight |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Bill Gates | 9 | 7 | 7 | 1.10 | 8.58 |
| Nobel Laureate (AI Research) | 10 | 6 | 7 | 1.00 | 7.90 |
| Barack Obama | 3 | 9 | 7 | 1.05 | 6.30 |
| Pope Francis | 1 | 2 | 10 | 1.20 | 4.80 |
| Donald Trump | 2 | 6 | 3 | 0.90 | 3.15 |
| Greta Thunberg | 1 | 1 | 3 | 1.10 | 1.76 |
| Tom Hanks | 1 | 1 | 3 | 1.05 | 1.68 |
| James Hetfield | 1 | 1 | 2 | 0.95 | 1.23 |

*Table: Merit and weight details for the AI Regulation consultation.* Here **Bill Gates** emerges with the highest weight (\~8.58), slightly surpassing the AI research luminary. Gates’s breadth of technical knowledge and policy engagement, combined with an elevated ethics multiplier, gives him a formidable edge. The top AI researcher holds \~7.9 weight, primarily from unrivaled technical expertise – a clear demonstration that subject-matter experts heavily influence outcomes. Obama ranks third (\~6.3), largely on the strength of policy expertise and a solid ethical reputation, despite limited tech knowledge. Pope Francis, lacking tech or policy credentials, still reaches a non-trivial weight (\~4.8) solely due to his moral authority (ethics merit 10 and multiplier 1.2) emphasizing how Smart Vote does credit ethical leadership even in tech debates. Trump’s weight (\~3.15) remains low given his poor tech understanding and lower ethical standing. The remaining activists/celebrities (Greta, Hanks, Hetfield) each have negligible say (weights under 2\) – their absence of AI or policy expertise renders their influence minimal, as expected.

*Figure: Weighted vote distribution for the AI Regulation consultation.* The chart shows **Bill Gates** (rightmost bar) narrowly ahead of the **AI Expert** in voting weight, illustrating that a combination of strong domain knowledge across tech and policy plus high ethical regard can outweigh even a top specialist. **Barack Obama** (third bar) also maintains significant influence through policy expertise. The **Pope** (mid-level bar) holds notable sway purely from ethical weight, unlike the **activist/celebrity group** (cluster of shortest bars on the left) who contribute almost no weight in this technically complex and ethically charged discussion. This distribution underscores that Smart Vote weights expertise in AI and ethics heavily, aligning influence with those most equipped to understand and morally navigate AI’s challenges.

## **Consultation 4: International Aid Allocation**

**Issue:** A consultation on **International Aid** – how to prioritize and distribute foreign aid or humanitarian relief funding.

**Relevant Domains & Weights:** We consider **Development Economics** (40%), **International Relations / Policy** (30%), and **Social/Humanitarian Studies** (30%) as key domains. Knowledge of development economics and finance is paramount (40%) for assessing aid effectiveness and budgeting. Insight into international relations and public policy (30%) is needed to navigate diplomatic, geopolitical and governance aspects of aid programs. Lastly, understanding social/humanitarian contexts (30%) – drawn from sociology, cultural studies, or humanitarian field experience – is equally important to ensure aid addresses on-the-ground needs. (These correspond to UNESCO fields like *Economics*, *Political science/International relations*, and *Sociology and cultural studies* respectively.)

**Participants’ Merit Profiles:** The Nobel-level expert here is a **Nobel Laureate in Economics (Development Economics)** – e.g. someone like Amartya Sen or Esther Duflo – who scores 10 in development economics, 6 in international policy (some engage in global policy advisory), and 8 in social/humanitarian studies (development economists often have field experience and social insight). Bill Gates also scores very high: 8 in development economics (through managing large-scale development projects via the Gates Foundation), 7 in international policy (collaborating with governments and global institutions), and 9 in humanitarian understanding (extensive on-ground public health project knowledge). Obama has a strong profile too: 6 in development economics (familiar with economic aid policy), 9 in international relations (deep foreign policy experience), 7 in social/humanitarian (promoter of global development initiatives). Pope Francis contributes a 10 in social/humanitarian domain (his deep involvement in humanitarian causes and advocacy for the poor), but only 2 in economics and 4 in international policy. Trump’s merits: 7 in economics (experience with international trade/business, though not specifically development economics), 5 in international relations (some foreign affairs exposure), and only 3 in humanitarian (low emphasis on aid during his tenure). Greta Thunberg scores 5 social (due to climate justice activism overlapping with humanitarian issues), 4 in policy (interacting with international climate forums), but only 2 in economics. Tom Hanks and James Hetfield have minimal direct expertise: we give each 2 in economics (they manage charitable foundations at smaller scale), 1 in international policy, 3 in social (both have partaken in some charitable causes – Hanks supports veterans and disaster relief, Metallica’s foundation supports workforce education – but they are not experts). Ethics multipliers: Pope 1.20, Gates 1.10, Greta 1.10, Obama/Hanks 1.05, Nobel economist 1.00 baseline, Trump 0.90, Hetfield 0.95.

| Participant | Development Economics | International Relations (Policy) | Social/Humanitarian Studies | Ethics Multiplier | Total Weight |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Bill Gates | 8 | 7 | 9 | 1.10 | 8.80 |
| Nobel Laureate (Development Econ) | 10 | 6 | 8 | 1.00 | 8.20 |
| Barack Obama | 6 | 9 | 7 | 1.05 | 7.56 |
| Pope Francis | 2 | 4 | 10 | 1.20 | 6.00 |
| Donald Trump | 7 | 5 | 3 | 0.90 | 4.68 |
| Greta Thunberg | 2 | 4 | 5 | 1.10 | 3.85 |
| Tom Hanks | 2 | 1 | 3 | 1.05 | 2.10 |
| James Hetfield | 2 | 1 | 3 | 0.95 | 1.90 |

*Table: Merit and weight details for the International Aid consultation.* **Bill Gates** edges out the Nobel laureate with the top weight (\~8.8 vs 8.2). His extensive practical experience in funding global aid projects, combined with a boost from his philanthropy-driven ethics, gives him a slight lead over the laureate who is academically top-notch (perfect 10 in economics) but has a neutral ethics score. Obama scores \~7.56, leveraging his international diplomacy expertise and solid ethical standing to remain influential. Pope Francis, despite low technical merits, reaches a weight of 6.0 – significantly higher than in prior scenarios – because the *Social/Humanitarian* domain (where he scores 10\) is heavily weighted here (30%), and his ethics multiplier amplifies that further. This indicates the system recognizing moral and experiential knowledge in humanitarian contexts as true expertise. Trump’s weight (\~4.68) is higher here than in other scenarios (his business/economics experience partly translates to development economics merit), but his influence is still markedly below the top experts due to lower humanitarian understanding and ethics factor. Greta Thunberg (\~3.85) has some voice primarily on the strength of her social advocacy credibility (and a decent ethics multiplier), but is limited by low economics/policy knowledge. Hanks and Hetfield remain low (around 2 or below), reflecting very limited domain expertise. Overall, those who combine economic savvy, policy experience, and humanitarian insight (and good ethical reputations) drive the weighted outcome.

*Figure: Weighted vote distribution for the International Aid consultation.* The chart illustrates **Bill Gates** (rightmost bar) as the most influential voter, closely followed by the **Development Economics Nobel Laureate**, reflecting their exceptional expertise in aid-related economics and policy design. **Barack Obama** and **Pope Francis** (mid-range bars) also hold considerable weight – Obama due to governance and international relations skills, and Pope Francis due to his humanitarian leadership and high ethical standing (despite limited economic expertise). The **remaining participants** (left cluster of bars) have progressively smaller weights; while **Donald Trump** has some influence (owing to business/economics experience), activists and celebrities like **Greta Thunberg, Tom Hanks, and James Hetfield** contribute only marginally to the decision. This distribution underscores Smart Vote’s ability to elevate those with both technical competence and ethical commitment in the aid arena, while sidelining those without relevant insight into global development challenges.

## **Consultation 5: Arts Funding Initiative**

**Issue:** A consultation on **Arts Funding** – determining support for arts and culture (e.g. public funding for museums, music programs, film grants).

**Relevant Domains & Weights:** We use **Arts & Culture** (50%), **Economics/Management** (30%), and **Social Impact (Cultural Studies)** (20%) as the domains. Expertise in the arts (50%) – knowledge of artistic creation, cultural heritage, the needs of artists – is paramount for deciding how funds should be allocated effectively. Financial and management savvy (30%) is also crucial since it deals with budgeting and administering funds (related to business/administration in ISCED). Finally, understanding the social and cultural impact of the arts (20%) is important for justifying funding (aligns with sociology/cultural studies, i.e. how art benefits communities, education, well-being).

**Participants’ Merit Profiles:** This scenario highlights our two artists: Tom Hanks and James Hetfield. Both have **Arts & Culture** merits near the top. Hanks, an award-winning actor/producer, scores a full 10 in arts domain, while Hetfield, a legendary musician, scores 9 – reflecting their mastery and industry experience in film and music (performing arts are recognized as a field under ISCED code 0215). The Nobel figure here is a **Nobel Laureate in Literature**, who also scores 10 in arts & culture (as a writer of the highest acclaim). Others have minimal arts domain knowledge: Obama and Trump each get 2 (they appreciate arts but have no professional background; Trump had some involvement in entertainment ventures but not as an artist), Gates 2 (known more for STEM, though he has funded some cultural initiatives), Greta 1 (no notable involvement in arts). In **Economics/Management**, ironically Bill Gates leads with 9 (decades of running a large organization, albeit not arts-specific, but skills are transferable to managing funds), Trump has 8 (experience in business, though not arts-focused, he did run the Miss Universe pageant and a reality TV show), Hanks 7 (experience producing films and managing film budgets), Hetfield 6 (managed a band’s business for years), Obama 6 (oversaw budgets including cultural programs), Nobel laureate (literature) 3 (not typically involved in finance), Pope Francis 2 (limited to managing church finances for the Vatican, not directly arts budgets), Greta 2 (no relevant financial management experience). For **Social Impact/Cultural Studies**, the Nobel laureate writer scores high (9) – literati often reflect deeply on culture and society. Hanks gets 8 (he’s observed to champion the cultural value of the arts and participates in related philanthropy), Hetfield 7 (witnessing music’s impact on global culture and engaging in charity events). Pope Francis scores 6 here – he appreciates how art can serve society and the church has a history of supporting arts for community, though it’s not his specialty. Obama scores 5 (supports arts education and cultural programs as a means of social improvement), Gates 4 (focuses more on scientific education but acknowledges cultural factors), Greta 3 (her advocacy is climate-focused, but she uses artful communication occasionally). Trump scores only 1 in social impact – his approach to arts has been more utilitarian, with attempts to cut arts funding, suggesting little concern for its societal role. Ethics multipliers: unchanged (Pope 1.20, Gates/Greta 1.10, Obama/Hanks 1.05, Nobel laureate 1.00, Trump 0.90, Hetfield 0.95).

| Participant | Arts & Culture | Economics/Management | Social Impact (Cultural Studies) | Ethics Multiplier | Total Weight |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Tom Hanks | 10 | 7 | 8 | 1.05 | 9.13 |
| Nobel Laureate (Literature) | 10 | 3 | 9 | 1.00 | 7.70 |
| James Hetfield | 9 | 6 | 7 | 0.95 | 7.31 |
| Bill Gates | 2 | 9 | 4 | 1.10 | 4.95 |
| Barack Obama | 2 | 6 | 5 | 1.05 | 3.99 |
| Pope Francis | 3 | 2 | 6 | 1.20 | 3.96 |
| Donald Trump | 2 | 8 | 1 | 0.90 | 3.24 |
| Greta Thunberg | 1 | 2 | 3 | 1.10 | 1.87 |

*Table: Merit and weight summary for the Arts Funding consultation.* Here the **artists themselves** dominate: Tom Hanks achieves the highest weight (\~9.13), reflecting his unparalleled artistic expertise (10 in arts) combined with solid business sense and a positive ethical image. The Nobel literature laureate and James Hetfield come next at 7.7 and 7.3 respectively – despite Hetfield’s slightly lower raw merits, the Nobel laureate’s neutral ethics vs. Hetfield’s slight ethics penalty results in a small gap between them. These three far outstrip the others, indicating that in an arts-focused vote, actual creators/arts experts carry the most influence (as one would hope). Bill Gates (\~4.95) leads the second tier, mainly because his superior management skills (9) grant him weight in the funding aspect, even though his arts knowledge is minimal – an interesting case of strong cross-domain merit (finance) still contributing significantly. Obama, Pope Francis, and Trump all cluster around 3.2–3.99 weight. Obama’s moderate influence comes from leadership and a bit of cultural policy support; Pope Francis, notably, almost ties Obama (3.96 vs 3.99) – his high ethics and genuine appreciation for the social value of art elevate him, despite lacking technical arts or finance expertise. Trump, while proficient in business, is held back by low regard for arts’ social value and a poor ethics score, resulting in only \~3.24 weight. Greta Thunberg (1.87) has virtually no impact here – as expected, since climate activism doesn’t translate into arts funding expertise. This scenario vividly demonstrates Smart Vote’s *domain alignment*: individuals renowned in arts and culture are given a far louder voice on arts policy than those who are not – a reversal of typical popularity-based influence. Merit differentiation is clear: even among generally influential figures, those with directly relevant accomplishments (Oscars, Grammys, Nobel Prize in literature) overshadow those without. The ethics modulation also plays a subtle role – note that if Hetfield had an ethics multiplier of 1.0 equal to the Nobel laureate’s, their weights would be equal; his slightly lower ethics (0.95) means the laureate inches ahead, highlighting that character and public service factor into one’s final influence.

*(No figure embedded for the arts scenario to avoid repetition; the distribution described above shows the first three bars (Hanks, Laureate, Hetfield) towering over the rest.)*

## **Conclusion**

Across these simulations, we see the Smart Vote system functioning as intended: **domain alignment** ensures that each consultation is primarily influenced by those with expertise in the relevant fields (scientists on science questions, artists on arts funding, etc.), while **merit differentiation** within those domains further ranks individuals by their achievements and knowledge. The inclusion of an **ethics multiplier** means that individuals who have demonstrated social responsibility or integrity can slightly augment their influence, whereas those with ethical shortcomings lose some weight – this is evident in cases like Pope Francis punching above his raw merit in secular topics, or Donald Trump’s weights consistently lagging what his domain knowledge alone might have yielded.

Crucially, we avoid comparing these weighted outcomes to hypothetical raw-vote outcomes, and instead focus on the internal logic of the weighted system. In each scenario, the total “voting weight” is distributed in a way that **elevates domain experts and reputable contributors**. For example, in climate policy, climate scientists and experienced policymakers dominated; in vaccine mandate decisions, medical and health policy experts led; in AI regulation, technologists and ethicists held sway; in international aid, development economists and humanitarian leaders prevailed; and in arts funding, artists and cultural figures had the loudest voices. This illustrates how Smart Vote’s formula – weighting votes by expertise across pertinent UNESCO-defined domains and by ethical standing – reallocates decision power toward those most aligned with the issue at hand. The result is a more nuanced, knowledge-centered form of democracy where the quality of contributions matters as much as quantity, aiming to produce well-informed decisions without silencing ethical considerations. Each consultation above demonstrates this balance, with clear logic as to why certain individuals carried more weight than others, strictly **based on their merits and ethics relevant to the consultation’s subject matter**, rather than popularity or raw political power. The Smart Vote simulations thus showcase an approach that *could* lead to more competent and principled collective decisions on complex public issues.

Voici des représentations visuelles « ASCII » de la répartition des poids de vote pour chaque consultation :

---

### **1\. Climate Policy (Dom. Env. 50% / Pol. Sci. 30% / Econ. 20%)**

Nobel Laureate      ██████████████ 14 (7.10)  
Barack Obama        █████████████  13 (6.72)  
Bill Gates          ████████████  12 (5.83)  
Greta Thunberg      ███████████   11 (5.39)  
Donald Trump        ████████       8 (3.78)  
Pope Francis        ██████         6 (2.76)  
Tom Hanks           ███            3 (1.26)  
James Hetfield      ██             2 (0.95)

---

### **2\. Vaccine Mandates (Health 50% / Pol. Sci. 30% / Ethics 20%)**

Nobel Laureate      ████████████████ 16 (7.90)  
Bill Gates          █████████████   14 (6.82)  
Barack Obama        ███████████     12 (6.20)  
Pope Francis        ███████         7 (3.72)  
Donald Trump        ██████          6 (2.88)  
Tom Hanks           █████           5 (2.52)  
Greta Thunberg      █████           5 (2.31)  
James Hetfield      ██              2 (1.14)

---

### **3\. AI Regulation (AI Tech 40% / Pol. Sci. 30% / Ethics 30%)**

Bill Gates          █████████████████ 17 (8.58)  
Nobel Laureate      ████████████████ 16 (7.90)  
Barack Obama        █████████████    13 (6.30)  
Pope Francis        ██████████       10 (4.80)  
Donald Trump        ██████          6 (3.15)  
Greta Thunberg      ████            4 (1.76)  
Tom Hanks           ███             3 (1.68)  
James Hetfield      ██              2 (1.23)

---

### **4\. International Aid (Dev. Econ. 40% / Int’l Policy 30% / Humanitarian 30%)**

Bill Gates          ██████████████████ 18 (8.80)  
Nobel Laureate      ████████████████ 16 (8.20)  
Barack Obama        ███████████████  15 (7.56)  
Pope Francis        ████████████     12 (6.00)  
Donald Trump        ██████████       9 (4.68)  
Greta Thunberg      ████████        8 (3.85)  
Tom Hanks           ████            4 (2.10)  
James Hetfield      ████            4 (1.90)

---

### **5\. Arts Funding (Arts 50% / Econ. Mgmt 30% / Social Impact 20%)**

Tom Hanks           ██████████████████ 18 (9.13)  
Nobel Laureate      ███████████████  15 (7.70)  
James Hetfield      ███████████████  15 (7.31)  
Bill Gates          ███████████      10 (4.95)  
Barack Obama        ██████████       8 (3.99)  
Pope Francis        ██████████       8 (3.96)  
Donald Trump        ██████          6 (3.24)  
Greta Thunberg      ████            4 (1.87)

---

Chaque barre est proportionnelle au **poids de vote** calculé : on multiplie la somme pondérée des compétences par le coefficient éthique, sans oublier la voix de base (1). Vous pouvez ainsi voir d’un coup d’œil qui porte le plus d’influence selon la question et les domaines d’expertise requis.

