# Literature Review Module

## Purpose

Help the teacher understand what has already been studied and generate evidence-grounded literature review outputs.

## Required Inputs

- Selected topic.
- Research question or problem area.
- Retrieval source or explicit missing status.
- Search query, records, and retrieval date when real retrieval exists.
- Local cases or teacher-known examples when available.

## Coaching Loop

1. Generate or refine search queries from the selected topic.
2. Separate real retrieved evidence from missing or demo/example content.
3. Cluster literature into research status, trends, gaps, and usable cases.
4. Draft a long-form review for learning.
5. Draft a compressed proposal-section version.
6. Ask whether the teacher knows closer school, industry, or course cases.
7. Use the review to revise research questions, methods, outcomes, and innovation points.

## Pass Conditions

- For grade A: literature basis is `retrieved_evidence` or `material_verified`.
- For grade B: missing or demo evidence is clearly labeled and listed as a risk.

## Output

Produce both:

- `templates/literature-review-longform.md`
- `templates/literature-review-proposal-section.md`

## Fallback

If no real evidence exists, do not invent citations. State that the module can draft a search plan and placeholder structure only, then mark literature support as `missing`.
