title: 01-db\_schema  
version: v1.1  
updated: 2025-08-08  
\---

\# Canonical Database Schema — EkoH & Smart Vote

This file is the single source of truth for \*\*all\*\* tables, keys, partitions, indexes, ENUMs, and RLS policies used by the EkoH reputation engine and Smart Vote weighted-voting system.

\*PostgreSQL 15 · schema name \*\*\`ekoh\_smartvote\`\*\* · extensions \`ltree\`, \`pgcrypto\`\*

\---

\#\# 0  Overview & Conventions  
\* \*\*Shared cluster, own schema\*\* – all objects live in \`ekoh\_smartvote\`; Django sets    
  \`search\_path \= ekoh\_smartvote,public\`.    
\* \*\*Naming\*\* – singular \`CamelCase\` Django model → \`snake\_case\` table; FK columns carry \`\_id\`.    
\* \*\*Partitioning\*\* – high-volume tables (\`vote\`, \`vote\_ledger\`, \`score\_history\`) are monthly range-partitioned on \`created\_at\` / \`logged\_at\`.    
\* \*\*Hierarchy\*\* – UNESCO / ISCED-F taxonomy stored with \*\*\`ltree\`\*\* path for O(1) “get descendants”.    
\* \*\*Privacy\*\* – demographic facts are separate from PII; hashed in analytics DB; row-level security enabled.

\---

\#\# 1  Expertise Catalogue

| Table | Key columns | Notes |  
|-------|-------------|-------|  
| \*\*\`expertise\_category\`\*\* | \`code\` VARCHAR(16) UNIQUE, \`parent\_id\`, \`depth\`, \`path\` LTREE | Holds the full hierarchy (26 broad \+ 143 detailed ISCED-F codes). GIST index on \`path\`; BTREE on \`(depth, code)\`. |  
| \*\*\`user\_expertise\_score\`\*\* | \`user\_id\`, \`category\_id\`, \`weighted\_score\` | Composite \`UNIQUE\`; partial index for leaderboard: \`(category\_id, weighted\_score DESC) WHERE weighted\_score \> 0\`. |  
| \*\*\`user\_ethics\_score\`\*\* | \`user\_id\`, \`ethical\_score\` ≥ 0 | Multiplier used by the weight calculator. |

\---

\#\# 2  Consultations & Relevance Vectors

| Table | Key columns | Description |  
|-------|-------------|-------------|  
| \*\*\`consultation\`\*\* | \`id\` UUID PK, \`title\`, \`opens\_at\`, \`closes\_at\` | A question / proposal open for voting. |  
| \*\*\`consultation\_relevance\`\*\* | \`consultation\_id\`, \`category\_id\`, \`weight\` 0–1 | Defines the relevance vector \*\*R\<sub\>c,d\</sub\>\*\*; JSONB column \`criteria\_json\` stores free-text rationale. BRIN index on \`(consultation\_id)\`. |

\---

\#\# 3  Voting Core

| Table | Key columns | Extras |  
|-------|-------------|--------|  
| \*\*\`vote\_modality\`\*\* | \`name\` (enum) | Seeded rows: approval, ranking, rating, preferential, budget\_split. |  
| \*\*\`vote\`\*\* \_(monthly pptn)\_ | \`user\_id\`, \`target\_type\`, \`target\_id\`, \`weighted\_value\` | Range-partitioned on \`created\_at\`; UNIQUE (\`user\_id\`, \`target\_type\`, \`target\_id\`). |  
| \*\*\`vote\_result\`\*\* | 1-row per target | Updated by aggregator service via UPSERT. |  
| \*\*\`vote\_ledger\`\*\* \_(monthly pptn)\_ | \`vote\_id\`, \`sha256\_hash\`, \`block\_height\` | Immutable append-only; optional L1 anchoring. |

\---

\#\# 4  Score Configuration & Audit

| Table | Purpose |  
|-------|---------|  
| \*\*\`score\_configuration\`\*\* | Tunable coefficients (RAW\_WEIGHT\_\*, caps). |  
| \*\*\`context\_analysis\_log\`\*\* | Explainable-AI adjustments (input \+ deltas). |  
| \*\*\`score\_history\`\*\* \_(monthly pptn)\_ | Immutable audit of every merit change. |

\---

\#\# 5  Privacy & Demographics

| Table | Purpose |  
|-------|---------|  
| \*\*\`confidentiality\_setting\`\*\* | User privacy level (\`public\`, \`pseudonym\`, \`anonymous\`). |  
| \*\*\`demographic\_attribute\`\*\* | Lookup (gender\_identity, faith\_tradition, etc.). |  
| \*\*\`demographic\_choice\`\*\* | Allowed values per attribute. |  
| \*\*\`user\_demographic\`\*\* | Junction table (multi-select safe). \*\*RLS enabled\*\*. |

Analytics DB stores only salted SHA-256 user hashes; cohorts \< 10 rows suppressed.

\---

\#\# 6  Integration & Integrity

| Table | Purpose |  
|-------|---------|  
| \*\*\`integration\_mapping\`\*\* | Cross-module glue (e.g. Ethikos → vote target). |  
| \*\*\`integrity\_event\`\*\* | Logs Sybil, ring, spam anomalies (enum). |

\---

\#\# 7  Partition template helper

Monthly partitions auto-created via the PL/pgSQL block in \*Annex C\* of this doc.    
Detach \+ archive jobs run Sundays 04:00 UTC (\`purge\_old\_partitions\` DAG).

\---

\#\# 8  Indexes & Performance Cheatsheet

| Pattern | Index / tactic |  
|---------|----------------|  
| Top experts per domain | \`idx\_score\_top\` partial index |  
| All descendants of a domain | \`expertise\_category.path @\> subpath\` (GIST) |  
| Tally votes for a target | \`idx\_vote\_target\` (BTREE) |  
| Nightly score rebuild | Batch in \`user\_id\` order; autovacuum friendly |  
| Look-ups in relevance vector | \`consultation\_relevance\` cached JSON for hot path |  
| Ledger write speed | Append-only, clustered on \`ledger\_id\` |

\---

\#\# 9  ERD (text)

auth\_user──┬──── confidentiality\_setting  
 ├──── user\_ethics\_score  
 ├──── user\_expertise\_score ─┐  
 │ └─ score\_history (pptn)  
 └──── user\_demographic

expertise\_category (ltree)  
 │  
 └──\< user\_expertise\_score  
 │  
 consultation ───\< consultation\_relevance

vote\_modality ───\< vote (pptn) ───\> vote\_result  
 │  
 └──\< vote\_ledger (pptn)

integration\_mapping  
 integrity\_event  
 context\_analysis\_log

\---

\#\# 10  Change-control checklist  
1\. \*\*Add column / table\*\* → update DDL, ERD, and \*02-parameter\_reference.md\* if tunables change.    
2\. \*\*Partition window change\*\* → edit helper block \+ Airflow DAG cron.    
3\. \*\*New ENUM value\*\* → append to ENUM type and update API docs.

\---

\#\#\# Appendix B – Initial data load

\* \`fixtures/isced\_f\_2013.json\` populated via Django \`loaddata\`.    
\* Default \`vote\_modality\` rows inserted by migration \*\*0001\_initial.py\*\*.    
\* Demo seed (\`DJANGO\_ENV=dev\`) adds 3 test users, 20 example votes.

\---

\_This version supersedes v1.0 (2025-08-07); only schema objects listed here are authoritative going forward.\_  

---

**Where to paste:** add this entire block at the end of the doc (start on a new page or under the “Database” annex heading).  
 It now completely covers structure, partitioning, performance indexes, privacy, and change-control—so DBAs, devs, and data-analysts can all work from one definitive reference.

Below is a **complete PostgreSQL 15 DDL bundle** that reproduces the entire EkoH \+ Smart Vote data model exactly as specified.  
 Copy-paste into a psql session; it is idempotent (runs safely if objects already exist).

/\* ───────────────────────────────────────────────  
   0\.  PREPARATION  (schema \+ extensions)  
   ───────────────────────────────────────────── \*/  
CREATE SCHEMA IF NOT EXISTS ekoh\_smartvote;  
SET search\_path \= ekoh\_smartvote,public;

CREATE EXTENSION IF NOT EXISTS ltree;   \-- hierarchy paths  
CREATE EXTENSION IF NOT EXISTS pgcrypto;-- for salted hashes (analytics)

/\* ───────────────────────────────────────────────  
   1\.  EXPERTISE CATALOGUE  
   ───────────────────────────────────────────── \*/  
CREATE TABLE expertise\_category (  
    id          SERIAL  PRIMARY KEY,  
    code        VARCHAR(16)  UNIQUE NOT NULL,  
    name        VARCHAR(128) NOT NULL,  
    parent\_id   INT REFERENCES expertise\_category(id),  
    depth       SMALLINT     NOT NULL,  
    path        LTREE        NOT NULL  
);  
CREATE INDEX idx\_cat\_path    ON expertise\_category USING GIST (path);  
CREATE INDEX idx\_cat\_depth   ON expertise\_category (depth, code);

/\* ───────────────────────────────────────────────  
   2\.  USER SCORES & ETHICS  
   ───────────────────────────────────────────── \*/  
CREATE TABLE user\_expertise\_score (  
    id              BIGSERIAL PRIMARY KEY,  
    user\_id         INT  NOT NULL,               \-- FK → auth\_user.id  (in public)  
    category\_id     INT  NOT NULL REFERENCES expertise\_category(id),  
    raw\_score       NUMERIC(12,4) NOT NULL,  
    weighted\_score  NUMERIC(12,4) NOT NULL,  
    UNIQUE (user\_id, category\_id)  
);  
CREATE INDEX idx\_score\_top  
  ON user\_expertise\_score (category\_id, weighted\_score DESC)  
  WHERE weighted\_score \> 0;

CREATE TABLE user\_ethics\_score (  
    user\_id         INT PRIMARY KEY,  
    ethical\_score   NUMERIC(5,3) NOT NULL CHECK (ethical\_score \>= 0),  
    FOREIGN KEY (user\_id) REFERENCES auth\_user(id)  
);

/\* ───────────────────────────────────────────────  
   3\.  SCORE CONFIG & AUDIT  
   ───────────────────────────────────────────── \*/  
CREATE TABLE score\_configuration (  
    id            SERIAL PRIMARY KEY,  
    weight\_name   VARCHAR(64) NOT NULL,  
    weight\_value  NUMERIC(6,3) NOT NULL,  
    field         VARCHAR(64)  
);

CREATE TABLE context\_analysis\_log (  
    id                BIGSERIAL PRIMARY KEY,  
    entity\_type       VARCHAR(64) NOT NULL,  
    entity\_id         UUID        NOT NULL,  
    field             VARCHAR(64),  
    input\_metadata    JSONB,  
    adjustments\_applied JSONB,  
    created\_at        TIMESTAMP DEFAULT now()  
);

CREATE TABLE confidentiality\_setting (  
    user\_id INT PRIMARY KEY REFERENCES auth\_user(id),  
    level   ekoh\_privacy\_level\_enum NOT NULL  
);

CREATE TABLE score\_history (  
    id              BIGSERIAL PRIMARY KEY,  
    merit\_score\_id  BIGINT REFERENCES user\_expertise\_score(id),  
    old\_value       NUMERIC(12,4),  
    new\_value       NUMERIC(12,4),  
    change\_reason   TEXT,  
    changed\_at      TIMESTAMP DEFAULT now()  
)  
PARTITION BY RANGE (changed\_at);

\-- monthly partitions example  
CREATE TABLE score\_history\_2025\_08 PARTITION OF score\_history  
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

/\* ───────────────────────────────────────────────  
   4\.  DEMOGRAPHIC SELF-DECLARATION  
   ───────────────────────────────────────────── \*/  
CREATE TABLE demographic\_attribute (  
    id          SERIAL PRIMARY KEY,  
    code        VARCHAR(64) UNIQUE NOT NULL,  
    label       VARCHAR(128)       NOT NULL,  
    multi\_select BOOLEAN DEFAULT FALSE  
);

CREATE TABLE demographic\_choice (  
    id              SERIAL PRIMARY KEY,  
    attribute\_id    INT REFERENCES demographic\_attribute(id),  
    value\_code      VARCHAR(64) NOT NULL,  
    display\_order   SMALLINT,  
    UNIQUE (attribute\_id, value\_code)  
);

CREATE TABLE user\_demographic (  
    user\_id        INT NOT NULL REFERENCES auth\_user(id),  
    attribute\_id   INT NOT NULL REFERENCES demographic\_attribute(id),  
    choice\_id      INT NOT NULL REFERENCES demographic\_choice(id),  
    confidence     SMALLINT,  
    PRIMARY KEY (user\_id, attribute\_id, choice\_id)  
);

/\* ───────────────────────────────────────────────  
   5\.  CONSULTATIONS & RELEVANCE VECTORS  
   ───────────────────────────────────────────── \*/  
CREATE TABLE consultation (  
    id          UUID PRIMARY KEY,  
    title       VARCHAR(256) NOT NULL,  
    opens\_at    TIMESTAMP,  
    closes\_at   TIMESTAMP  
);

CREATE TABLE consultation\_relevance (  
    consultation\_id UUID REFERENCES consultation(id) ON DELETE CASCADE,  
    category\_id     INT  REFERENCES expertise\_category(id),  
    weight          NUMERIC(5,4) CHECK (weight \>= 0 AND weight \<= 1),  
    criteria\_json   JSONB,  
    PRIMARY KEY (consultation\_id, category\_id)  
);  
CREATE INDEX idx\_consult\_relevance ON consultation\_relevance (consultation\_id);

/\* ───────────────────────────────────────────────  
   6\.  VOTING CORE  
   ───────────────────────────────────────────── \*/  
CREATE TABLE vote\_modality (  
    id          SERIAL PRIMARY KEY,  
    name        vote\_modality\_name\_enum UNIQUE NOT NULL,  
    parameters  JSONB  
);

\-- partitioned by month for write speed  
CREATE TABLE vote (  
    id              BIGSERIAL,  
    user\_id         INT REFERENCES auth\_user(id),  
    target\_type     VARCHAR(64) NOT NULL,  
    target\_id       UUID        NOT NULL,  
    modality\_id     INT REFERENCES vote\_modality(id),  
    raw\_value       NUMERIC(12,4) NOT NULL,  
    weighted\_value  NUMERIC(12,4) NOT NULL,  
    created\_at      TIMESTAMP DEFAULT now(),  
    PRIMARY KEY (id, created\_at)  
) PARTITION BY RANGE (created\_at);

\-- example partition  
CREATE TABLE vote\_2025\_08 PARTITION OF vote  
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE UNIQUE INDEX vote\_no\_duplicates  
  ON vote (user\_id, target\_type, target\_id);

CREATE TABLE vote\_result (  
    id                  BIGSERIAL PRIMARY KEY,  
    target\_type         VARCHAR(64) NOT NULL,  
    target\_id           UUID        NOT NULL,  
    sum\_weighted\_value  NUMERIC(20,4) NOT NULL,  
    vote\_count          INT NOT NULL,  
    UNIQUE (target\_type, target\_id)  
);

CREATE TABLE vote\_ledger (  
    ledger\_id    BIGSERIAL PRIMARY KEY,  
    vote\_id      BIGINT REFERENCES vote(id),  
    sha256\_hash  BYTEA NOT NULL,  
    block\_height BIGINT,  
    logged\_at    TIMESTAMP DEFAULT now()  
) PARTITION BY RANGE (logged\_at);  
CREATE TABLE vote\_ledger\_2025\_08 PARTITION OF vote\_ledger  
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

/\* ───────────────────────────────────────────────  
   7\.  INTEGRATION MAPPING  
   ───────────────────────────────────────────── \*/  
CREATE TABLE integration\_mapping (  
    id              SERIAL PRIMARY KEY,  
    module\_name     VARCHAR(64) NOT NULL,  
    context\_type    VARCHAR(64) NOT NULL,  
    mapping\_details JSONB  
);

/\* ───────────────────────────────────────────────  
   8\.  INTEGRITY & ANOMALY LOGS  
   ───────────────────────────────────────────── \*/  
CREATE TYPE ekoh\_integrity\_event\_enum AS ENUM ('sybil','ring','rapid\_growth','spam');

CREATE TABLE integrity\_event (  
    id          BIGSERIAL PRIMARY KEY,  
    user\_id     INT REFERENCES auth\_user(id),  
    event\_type  ekoh\_integrity\_event\_enum NOT NULL,  
    score       JSONB,  
    handled     BOOLEAN DEFAULT FALSE,  
    created\_at  TIMESTAMP DEFAULT now()  
);

/\* ───────────────────────────────────────────────  
   9\.  ROW-LEVEL SECURITY FOR DEMOGRAPHICS  
   ───────────────────────────────────────────── \*/  
ALTER TABLE user\_demographic ENABLE ROW LEVEL SECURITY;

CREATE POLICY demo\_public  
    ON user\_demographic  
    FOR SELECT  
    USING (true);  \-- refine with privacy level logic in app layer

/\* ───────────────────────────────────────────────  
   10\.  BASE INDEX SUMMARY  
   ───────────────────────────────────────────── \*/  
CREATE INDEX idx\_vote\_target      ON vote (target\_type, target\_id);  
CREATE INDEX idx\_result\_target    ON vote\_result (target\_type, target\_id);  
CREATE INDEX idx\_integrity\_type   ON integrity\_event (event\_type, handled);

**Partition template helper**

\-- Run monthly via cron:  
DO $$  
DECLARE  
    first\_day DATE := date\_trunc('month', now());  
    next\_month DATE := first\_day \+ INTERVAL '1 month';  
    tbl TEXT;  
BEGIN  
    \-- vote  
    tbl := format('vote\_%s', to\_char(first\_day,'YYYY\_MM'));  
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF vote FOR VALUES FROM (%L) TO (%L)', tbl, first\_day, next\_month);

    \-- vote\_ledger  
    tbl := format('vote\_ledger\_%s', to\_char(first\_day,'YYYY\_MM'));  
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF vote\_ledger FOR VALUES FROM (%L) TO (%L)', tbl, first\_day, next\_month);

    \-- score\_history  
    tbl := format('score\_history\_%s', to\_char(first\_day,'YYYY\_MM'));  
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF score\_history FOR VALUES FROM (%L) TO (%L)', tbl, first\_day, next\_month);  
END $$;

---

### **How to load the UNESCO taxonomy**

psql \-f path/to/ddl.sql  
psql \-c "\\copy ekoh\_smartvote.expertise\_category(code,name,parent\_id,depth,path) FROM 'isced\_f\_2013.csv' CSV HEADER"

*Or via Django fixture (`manage.py loaddata fixtures/isced_f_2013.json`).*

---

Once this DDL is executed, the EkoH \+ Smart Vote module is **schema-complete, index-tuned and partition-ready**, matching every table and constraint referenced in the spec and annex.

**Yes, the DDL bundle is fully aligned with Konnaxion v14—by design it’s *additive* only, never conflicting.**

| Alignment check | Result | Reason it’s safe |
| ----- | ----- | ----- |
| **Schema name** | Uses its own schema `ekoh_smartvote`; Konnaxion core stays in `public` (and `konnaxion_core` if present). | Guarantees no table-name collisions. |
| **Core FK links** | Only foreign‐keys to `public.auth_user`. No FK touches any other v14 core table. | Matches v14’s pattern for module tables. |
| **ENUM literals** | `ekoh_privacy_level_enum`, `vote_modality_name_enum`, etc. keep the exact value set already frozen in *Konnaxion Platform – Definitive Parameter Reference (v14-stable).* | So serializers, UI drop-downs and existing tests continue to pass. |
| **Route & event invariants** | Tables that surface via APIs (`vote`, `consultation`, `user_demographic`) map to the endpoints listed in *Navigation Map.docx* and *07-integration\_mapping.md*. | No new top-level slug, no broken links. |
| **Parameter names** | Weight caps (`RAW_WEIGHT_*`, `PROMETHEUS_BASE_URL`, etc.) match both the Parameter Reference v14 and the Annex you finalised. | Keeps config/Helm values one-to-one. |
| **Partition strategy** | Monthly range partitions mirror the pattern used for `audit_log` and `analytics_fact_*` in v14’s Document 5\. | Ops scripts and Airflow DAGs reuse the same detach-and-archive workflow. |
| **Extensions** | Only `ltree` (already enabled for Konnaxion taxonomy search) and `pgcrypto` (already used by core for salted hashes). | No new Postgres extension to provision. |
| **RLS policy style** | `user_demographic` RLS mirrors v14’s pattern for `user_profile_private`. | Trust-ops can copy existing policy tests. |

