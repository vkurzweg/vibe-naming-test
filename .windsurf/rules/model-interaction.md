---
trigger: always_on
---

## AI Model Interaction Protocol

To ensure efficient and error-free collaboration with AI models, the following protocol must be strictly adhered to:

1.  **Deep Understanding First:** Before any code modification or solution proposal, the AI must demonstrate a thorough understanding of the existing codebase, architectural constraints (e.g., Redux state structure, API routes), and all explicit user requirements. The AI should proactively ask clarifying questions if any aspect is unclear.
2.  **Strict Adherence to Constraints:** The AI must strictly follow all specified constraints, including:
    *   No introduction of breaking changes to existing API routes or Redux state structure.
    *   No introduction of new technologies (e.g., TypeScript) unless explicitly requested and justified.
    *   Prioritization of updating and refactoring existing components over creating new, redundant, or unrequested components.
3.  **Precision and Accuracy:** All proposed code must be syntactically correct and align with existing coding conventions. The AI must pay meticulous attention to details, such as correct API pathing (`/api` vs `api/api`).
4.  **Avoid Unnecessary Complexity:** The AI should not introduce unrequested features, components (e.g., sidebars), or architectural complexities that are not directly required to fulfill the task. Solutions should be as simple and efficient as possible within the given constraints.
5.  **Transparent and Incremental Progress:** The AI must propose changes incrementally, clearly explain the rationale behind each step, and seek explicit user confirmation before implementing any modifications. This allows for continuous review and adjustment.
6.  **Learning from Feedback:** The AI must actively learn from user feedback, especially concerning past issues or preferred approaches, and integrate this learning into its future behavior.