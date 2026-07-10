// Safe static deploy to GitHub Pages (gh-pages branch). Cross-platform.
//
//   REPO=my-repo node scripts/deploy.mjs      (REPO empty = root/user-site/custom-domain)
//   npm run deploy   (set REPO in package.json's deploy script, or export it first)
//
// Why a Node script and not a shell one-liner:
//   • sets NEXT_PUBLIC_BASE_PATH in process.env so git-bash can't rewrite "/repo" into a filesystem path
//   • guarantees out/.nojekyll (without it GitHub Pages' Jekyll drops every _next/ path → blank site)
//   • publishes via the gh-pages package (works the same on Windows/macOS/Linux)
//
// ⚠ STOP `next dev` FIRST. `next build` shares ./.next with the dev server and will clobber the running
//   tab (raw unstyled HTML / preloader stuck at 0%). The #1 self-inflicted "the site is broken" bug.

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const repo = process.env.REPO ?? "";
const base = repo ? `/${repo}` : "";
const run = (cmd, env = {}) => execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });

console.log(`\n[deploy] building  basePath=${base || "(root)"}`);
run("npx next build", { NEXT_PUBLIC_BASE_PATH: base });

writeFileSync("out/.nojekyll", "");
console.log("[deploy] publishing ./out → gh-pages branch");
run('npx --yes gh-pages -d out -t -b gh-pages -m "Deploy"'); // -t includes dotfiles (.nojekyll)

console.log("\n[deploy] done.");
console.log("First deploy only — point Pages at the gh-pages branch (then it's automatic after):");
console.log(`  gh api -X POST repos/<owner>/${repo || "<repo>"}/pages -f "source[branch]=gh-pages" -f "source[path]=/"`);
if (repo) console.log(`  live → https://<owner>.github.io/${repo}/\n`);

// Always verify the live URL after: load it headless, assert 0 asset 4xx (serving out/ at root hides
// subpath 404s — see references/production-hardening.md §F).
