# Repository Guidelines

## Project Structure & Module Organization
- Root stores `climb-you_MVP_spec_AppsSDK.md`; update after any scope shift.
- `.specify/memory` houses decision context, `scripts/powershell/` automation, `templates/` doc skeletons. Stage runtime code under future `appsdk/src`, tests in `appsdk/tests`, static assets in `appsdk/assets`.

## Build, Test, and Development Commands
- `pwsh .\.specify\scripts\powershell\check-prerequisites.ps1` confirms Node >=20, pnpm, Git; run before onboarding or after toolchain changes.
- `pwsh .\.specify\scripts\powershell\update-agent-context.ps1` syncs automation with spec edits; execute whenever `.md` guidance changes.
- When the Apps SDK shell exists, use `pnpm install`, `pnpm dev`, and later `pnpm build` inside `appsdk/`.

## Coding Style & Naming Conventions
- TypeScript modules: ES2023, 2-space indent, Prettier enforced via `pnpm lint:fix`.
- Components, hooks, and schemas: PascalCase filenames (`QuestComposer.tsx`), camelCase functions (`generateQuestBundle`), snake_case JSON payload keys to match MCP contracts.
- PowerShell scripts stay idempotent, use Verb-Noun naming (`Update-AgentContext`), and expose comment-based help for each flag.

## Testing Guidelines
- Use Vitest for TypeScript (`pnpm test`); mirror file names (`src/quests/service.ts` -> `tests/quests/service.test.ts`).
- Protect quest generation, auth adapters, and MCP handlers with >80% coverage; include boundary cases for token quotas and streak resets.
- Script automation gains Pester specs under `.specify/scripts/powershell/tests/`; run `pwsh -File Invoke-Pester.ps1` before merging.

## Commit & Pull Request Guidelines
- Git is not initialised; once it is, follow Conventional Commits (`feat:`, `fix:`, `chore:`) and include scope tags when touching multiple modules.
- PRs must summarise the change, point to relevant spec sections, attach screenshots or command logs for UI or script output, and list commands executed.
- Request reviews from Apps SDK + automation maintainers; flag any schema changes in the description header.

## Documentation & Spec Updates
- Date-stamp edits in `climb-you_MVP_spec_AppsSDK.md` and keep diagrams or sequence lists in sync with MCP channel definitions.
- New templates belong in `.specify/templates/`; keep placeholders explicit so future agents can reuse them without guesswork.
