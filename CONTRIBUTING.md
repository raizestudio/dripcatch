# Contributing to DripCatch

Thanks for helping improve DripCatch! Because DripCatch is a privacy-first ledger with strict localization and build requirements, please review these guidelines before opening a Pull Request.

---

## Project Rules (Non-Negotiable)

1. **Zero-Credential Philosophy:** Never introduce open-banking integrations (Plaid, Finicity, etc.), bank scraping, or credit card storage. All ledger entries are strictly user-inputted.
2. **Bilingual Parity (`en` & `fr`):** Every user-facing string must be added to both `messages/en.json` and `messages/fr.json` under the appropriate namespace. PRs with hardcoded English strings will not be merged.
3. **Next.js 16 Static Prerendering:** Any new page under `app/[locale]/` must call `setRequestLocale(locale)` so `pnpm build` prerenders cleanly without dynamic server opt-out warnings.
4. **Modular Components:** Keep UI components small and focused. Avoid monolithic files—split charts, modals, and logic utilities into dedicated modules.
5. **Theme Support:** All UI changes must look clean and maintain high contrast in both light and dark modes.

---

## Local Development Setup

1. Fork the repository and clone your fork:
   ```bash
   git clone [https://github.com/your-username/dripcatch.git](https://github.com/your-username/dripcatch.git)
   cd dripcatch
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env.local` and configure your Supabase project keys.
4. Start the development server:
   ```bash
   pnpm dev
   ```

---

## Pull Request Workflow

1. **Claim an Issue:** Comment on an open issue before starting work so efforts aren't duplicated.
2. **Branch Naming:** Use conventional prefixes (`feat/...`, `fix/...`, `docs/...`, `refactor/...`).
3. **Verify the Build:** Run `pnpm build` and `pnpm lint` locally before pushing to ensure zero TypeScript, ESLint, or prerendering errors.
4. **Keep PRs Focused:** Address one issue per Pull Request. Include screenshots or screen recordings for UI changes (both light and dark mode).

---

## Contributor License Agreement

By submitting a Pull Request to DripCatch, you agree that your contributions will be licensed under the project's [Non-Commercial License](./LICENSE.md).
