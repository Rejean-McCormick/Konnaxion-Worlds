**Konnaxion v14 — Documentation Index**

*Use this as a directory: each entry tells you **which file** answers a given class of question and **where inside** that file the relevant details live. All filenames below are aligned with the current **DocV14** documentation set.*

---

### **1  System-wide references**

| What you will find | File | Look under these headings / anchors |
| ----- | ----- | ----- |
| **Frozen configuration values** (env-vars, settings constants, route ownership, invariants) | *Konnaxion v14 – Global Parameter Reference (v14-stable).docx.md* | “0 Global / Core (shared by all apps)”, module sections, “6 Navigation & Route Invariants”, “7 Environment-variable Matrix …” |
| **Complete top-level route list** (pages grouped by module) | *Konnaxion v14 – Site Navigation Map (Top-Level Routes).docx.md* | “Global & Cross-Module Shell”, then each module block |
| **Every custom Django / platform table** (model name, purpose, key columns) | *Konnaxion v14 – Database Schema Reference (Custom Tables).docx.md* | Module headings → sub-module table lists |
| **Functional capability catalogue** (code-names, one-line purpose, service/hook naming) | *Konnaxion v14 – Functional Code-Name Inventory (Services & Hooks).docx.md* | Module → Sub-module matrix |

---

### **2  Module technical specifications**

*All major module architecture details live in the platform-wide technical specification. Use the module heading, then jump to the layer you need.*

| Module | File | Sections / layer anchors |
| ----- | ----- | ----- |
| **Kollective Intelligence** | *Konnaxion v14 – Full-Stack Technical Specification.docx.md* | “Kollective Intelligence → Frontend …”, “Backend …”, “Database …”, “DevOps …” |
| **ethiKos** | same file | “ethiKos → Frontend …”, “Backend …”, “Database …”, “DevOps …” |
| **keenKonnect** | same file | “keenKonnect → Frontend …”, “Backend …”, “Database …”, “DevOps …” |
| **KonnectED** | same file | “KonnectED → Frontend …”, “Backend …”, “Database …”, “DevOps …” |
| **Kreative (+ Kontact)** | same file | “Kreative → Frontend …”, “Backend …”, “Database …”, “DevOps …” |

---

### **3  Reporting & Analytics / Insights slice**

| What you need | File | Look under these headings / anchors |
| ----- | ----- | ----- |
| **Frontend UI / route spec** | *Konnaxion v14 – Insights Module UI Spec (Reporting & Analytics Frontend).docx.md* | “1. Scope”, “2. Routes & Navigation”, page/component sections |
| **Configuration parameters and invariants** | *Konnaxion v14 – Insights Module Config Parameters.docx.md* | “Configuration Parameters and Invariants” |
| **Shared platform architecture context** | *Konnaxion v14 – Full-Stack Technical Specification.docx.md* | Common/core frontend/backend sections and any Reporting / Analytics references |
| **Global environment-variable and route invariants** | *Konnaxion v14 – Global Parameter Reference (v14-stable).docx.md* | “6 Navigation & Route Invariants”, “7 Environment-variable Matrix …” |

*These references collectively cover the current Insights / Reports surface, including routes under `/reports` and the wider platform constraints that govern them.*

---

### **4  How to use this index**

1. **Need a setting, constant, route invariant, or env var?**  
   Open the **Global Parameter Reference** and jump to the relevant numbered section.

2. **Need module architecture (frontend / backend / DB / DevOps)?**  
   Open the **Full-Stack Technical Specification** and search for the module name, then the layer heading.

3. **Need Reporting / Insights frontend behavior or route definitions?**  
   Open the **Insights Module UI Spec**.

4. **Need Reporting / Insights configuration rules or operational invariants?**  
   Open the **Insights Module Config Parameters**.

5. **Need to know which module owns a route or which routes exist at top level?**  
   Check the **Site Navigation Map (Top-Level Routes)**.

6. **Need to know which table or model stores something?**  
   Check the **Database Schema Reference (Custom Tables)**.

7. **Need to decode a code-name or functional label?**  
   Check the **Functional Code-Name Inventory (Services & Hooks)**.

---

### **5  Notes on source-of-truth usage**

- The **Global Parameter Reference** is the source of truth for shared invariants, route ownership, and configuration-style constants.
- The **Full-Stack Technical Specification** is the source of truth for layered module architecture.
- The **Insights Module UI Spec** is the source of truth for the Reporting / Analytics frontend surface.
- The **Insights Module Config Parameters** file is the source of truth for Reporting / Analytics configuration and invariants.
- The **Site Navigation Map** is the source of truth for top-level reachable routes.
- The **Database Schema Reference** is the source of truth for custom tables and storage ownership.
- The **Functional Code-Name Inventory** is the source of truth for module capability names and code-name mapping.

This mapping removes ambiguity: each architectural, implementation, route, or reporting question has a concrete file and section to start from.