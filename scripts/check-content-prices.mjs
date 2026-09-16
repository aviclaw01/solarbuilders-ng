#!/usr/bin/env node
/**
 * Fail if a content page hard-codes a naira amount.
 *
 * The site's whole claim is that every figure is real, dated, and traceable to
 * lib/prices.ts. A hand-typed "₦1,000,000" cannot drift *with* the catalogue,
 * so the moment prices move it becomes a lie on a page that promises otherwise.
 * That is not hypothetical: several posts silently drifted this way, and two of
 * them ended up contradicting pages published the same week.
 *
 * So: no bare naira literal in a page. Derive it, or drop the claim.
 *
 * Comments are stripped before scanning, because explaining *why* a number is
 * what it is ("the cheapest complete build is about ₦1m, so…") is exactly the
 * kind of note we want people to keep writing.
 *
 * Run: node scripts/check-content-prices.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

/** Pages that render prose to the public. Components and libs are exempt: they
 *  are where the formatting and the constants legitimately live. */
const SCAN_DIRS = ['app/blog', 'app/sizing', 'app/budget', 'app/solar', 'app/compare', 'app/brands'];

/** ₦ immediately followed by a digit — the signature of a typed-in amount. */
const NAIRA_LITERAL = /₦\s?\d/;

/** Blanks comments in place, preserving line numbers so reported lines match the file. */
function stripComments(src) {
  const blankLines = (m) => m.replace(/[^\n]/g, ' ');
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blankLines)   // block comments, incl. JSDoc
    .replace(/(^|[^:])\/\/.*$/gm, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) out.push(p);
  }
  return out;
}

const violations = [];
for (const d of SCAN_DIRS) {
  for (const file of walk(join(ROOT, d))) {
    const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      if (NAIRA_LITERAL.test(line)) {
        violations.push({ file: relative(ROOT, file), line: i + 1, text: line.trim().slice(0, 100) });
      }
    });
  }
}

if (violations.length) {
  console.error(`\n${violations.length} hard-coded naira amount(s) in content pages:\n`);
  for (const v of violations) console.error(`  ${v.file}:${v.line}\n    ${v.text}`);
  console.error(
    '\nDerive the figure from lib/prices.ts, lib/energy-costs.ts or the quote engine,' +
      '\nor drop the claim and say plainly that we do not hold that figure.\n',
  );
  process.exit(1);
}

console.log(`No hard-coded naira amounts in ${SCAN_DIRS.length} content directories.`);
