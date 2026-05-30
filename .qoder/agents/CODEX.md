# Codex Project Notes

This repository keeps project-local agent guidance under `.qoder`.

For frontend development, API integration, dictionary options, status displays, and related UI work, read the matching local skill instructions before making changes:

- `.qoder/skills/form-page/SKILL.md`: page structure, UI style, API layer patterns, and templates for list/form pages.
- `.qoder/skills/backend-api-docs/SKILL.md`: how to use backend API documentation from `doc/api`.
- `.qoder/skills/dict-management/SKILL.md`: dictionary loading and display rules; avoid hard-coded option/status labels when a dictionary should be used.

Important defaults:

- Only add, delete, or modify files under `E:\WorkSoftWare\VsCodeSpace\ruoyi\ruoyi-ui` and its subdirectories.
- Treat `doc/api` as backend-owned API documentation. Read it to implement frontend behavior, but do not edit it.
- For new list/form pages, prefer the `form-page` guidance and templates.
- For select options and status text, prefer dictionary-backed data following `dict-management`.
- Do not sync these `.qoder` notes into global Codex skills automatically. They are repository-local project knowledge.
