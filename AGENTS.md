# Agent Execution Rules

## File Operation Boundary (Hard Constraint)

- Never create, modify, delete, or rename any file outside these directories:
  `E:\WorkSoftWare\VsCodeSpace\ruoyi\ruoyi-ui`
- This boundary includes only the directories above and all of their subdirectories.
- If any operation outside this boundary is truly required, the agent must ask the user first and wait for explicit approval before proceeding.

## High-Risk Windows Operations (Hard Constraint)

- Never run destructive system-level commands, including but not limited to:
  `format`, `diskpart clean`, `bcdedit`, `bootrec`, `reg delete` on system hives, `cipher /w`,
  `vssadmin delete shadows`, `wmic shadowcopy delete`, `shutdown /r /t 0` used for forced recovery workflows.
- Never execute recursive or wildcard deletes outside the allowed workspace, including patterns like:
  `del /s /q`, `rmdir /s /q`, `Remove-Item -Recurse -Force`, especially against drive roots or system paths.
- Never operate on Windows system directories (for example `C:\Windows`, `C:\Program Files`, `C:\Users`)
  unless the user gives explicit approval and the action is non-destructive.
- Inside the allowed workspace, delete/move/modify actions (including batch operations) are permitted
  without per-operation reconfirmation.
- Reconfirmation is required only when an operation is outside the allowed workspace, touches system
  directories, or has unclear blast radius.
- If a command has unclear blast radius, stop and ask the user before running it.
