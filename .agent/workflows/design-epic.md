---
description: How to design the implementation of an epic
---

At all points in this workflow, when you move between items in the list output to the chat what workflow you are running and what step you are on. Maintain a checklist of the workflow steps you have completed and the steps you have not completed. 

1.  **Identify Relevant Domains**: Read the `product_standards/docs/STANDARDS_INDEX.md` (if available) or determine technical domains (UI, Backend, Data, etc.) based on `stories.md`.
2.  **Standards Audit (Local First)**: 
    - Search the product repository for core configuration files copied from blueprints (e.g., `tailwind.preset.js`, `ruff.toml`, `Makefile`, `Dockerfile`, `api-standards.md` if present). 
    - These local files are the **Primary Authority** for the project's standards.
    - If `product_standards/docs` is available, use the index to find supporting ADRs for context, but do not override the constraints found in the local config files.
3.  **Establish Epic Standards (standards.md)**:
    - Create `standards.md` in the same folder as the epic's `stories.md`.
    - Extract specific "Inviolable Rules" from the local configuration files (e.g., exact brand colors from `tailwind.preset.js`, UK English from `ruff.toml` or `standards.md`).
    - List these rules clearly (e.g., # UI Constraints, # API Constraints).
    - If UI is involved, you MUST explicitly extract the brand tokens (colors, fonts) from the local `tailwind.preset.js`.
4.  **Verified Design (design.md)**: Using your `standards.md` as a strict constraint set, create a design. Each major component in the design should note which standard(s) it is adhering to.
5.  **Implementation Plan (implementation.md)**: Create a phased implementation plan that enforces the standards at each step.
6.  **Traceability & Testing (testing.md)**: Create `testing.md`. Ensure 100% E2E coverage for functional requirements as per the traceability standard.
7.  **Commit**: Label the commit with the epic number and "design".