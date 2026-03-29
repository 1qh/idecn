# Progress

**Philosophy:** Great defaults out of the box. One way to customize each thing. Maximum type safety. Minimal DOM. Dark mode ready. Consolidated logic.

**Workflow:** Copy a batch from IDEA.md → work through it → user reviews demo → confirm or iterate → mark done → next batch.

**Review checklist (every phase):**

- Great defaults — everything works out of the box
- No overlapping options — one way to customize each thing
- Maximum type safety — no `as const`, no `as any`, no `@ts-ignore`
- Minimal DOM — every element earns its place
- Dark mode ready — all colors use CSS variables
- Consolidated logic — no duplicate code paths
- Use shadcn components from src/ui/ — never hand-roll UI that shadcn already provides
- Never style what shadcn already styles — no manual icon sizing, spacing, or colors on shadcn primitives
- Read shadcn component source before using — understand DOM structure and usage patterns
- Every new interaction must have activityLog — exhaustive verbose logging for all features
- Memory overflow avoidance — cap arrays, use refs for high-frequency state, no unbounded growth
