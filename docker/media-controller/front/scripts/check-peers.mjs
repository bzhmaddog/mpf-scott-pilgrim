#!/usr/bin/env node
// Check Angular peerDependencies for every Angular-related package listed in
// the "overrides" section of package.json and report whether each override is
// still NEEDED or can be REMOVED.
//
// An override is "removable" when the installed Angular version range already
// satisfies the package's published peerDependencies (so npm would not warn).
// It is "needed" when the peer range does not allow the installed version.
//
// Usage:
//   node scripts/check-peers.mjs        (exit 0 = success, 1 = lookup error)
//   node scripts/check-peers.mjs --peer @angular/core

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import semver from 'semver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(__dirname, '..', 'package.json');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const overrides = pkg.overrides ?? {};
const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };

// Optional CLI filter: --peer @angular/core
const peerArgIndex = process.argv.indexOf('--peer');
const peerFilter = peerArgIndex !== -1 ? process.argv[peerArgIndex + 1] : null;

// Minimal ANSI colors, disabled when output is not a TTY or NO_COLOR is set.
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
const color = {
  green: paint('32'),
  red: paint('31'),
  yellow: paint('33'),
  cyan: paint('36'),
  dim: paint('2'),
  bold: paint('1'),
};

/**
 * Collect the set of "@angular/*" peers referenced by an override entry.
 * @param {unknown} overrideValue
 * @returns {string[]}
 */
function angularPeersFromOverride(overrideValue) {
  if (!overrideValue || typeof overrideValue !== 'object') return [];
  return Object.keys(overrideValue).filter((key) => key.startsWith('@angular/'));
}

// Build the list of Angular-related packages to inspect.
const targets = Object.entries(overrides)
  .map(([name, value]) => ({ name, peers: angularPeersFromOverride(value) }))
  .filter((entry) => entry.peers.length > 0);

if (targets.length === 0) {
  console.log('No Angular-related packages found in the "overrides" section.');
  process.exit(0);
}

/**
 * Run `npm show <pkg> peerDependencies.<peer>` and return the trimmed result.
 * @param {string} name
 * @param {string} peer
 * @returns {string | null} the peer range, '' when none, or null on error.
 */
function showPeer(name, peer) {
  try {
    const out = execFileSync(
      'npm',
      ['show', name, `peerDependencies.${peer}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return out.trim();
  } catch {
    return null;
  }
}

/**
 * Decide whether the installed range is allowed by the peer range.
 * @param {string} peerRange
 * @param {string} installedRange
 * @returns {boolean}
 */
function installedSatisfiesPeer(peerRange, installedRange) {
  // No peer requirement -> nothing to override.
  if (!peerRange) return true;
  if (!installedRange) return false;
  // Removable only if the whole installed range fits inside the peer range.
  try {
    return semver.subset(installedRange, peerRange);
  } catch {
    return false;
  }
}

let hadError = false;
let neededCount = 0;

for (const { name, peers } of targets) {
  const peersToCheck = peerFilter ? peers.filter((p) => p === peerFilter) : peers;
  const reasons = [];
  let needed = false;
  let errored = false;

  for (const peer of peersToCheck) {
    const required = showPeer(name, peer);
    const installed = allDeps[peer] ?? '';

    if (required === null) {
      errored = true;
      reasons.push(`${peer}: lookup failed`);
      continue;
    }
    if (!installedSatisfiesPeer(required, installed)) {
      needed = true;
      reasons.push(`${peer} requires ${required || '(none)'}, installed ${installed || '(not installed)'}`);
    }
  }

  if (errored) {
    hadError = true;
    console.log(`${color.yellow('?')} ${color.bold(name)} — ${color.yellow('ERROR')} ${color.dim(`(${reasons.join('; ')})`)}`);
  } else if (needed) {
    neededCount++;
    console.log(`${color.red('✗')} ${color.bold(name)} — ${color.red('KEEP')} ${color.dim(`(${reasons.join('; ')})`)}`);
  } else {
    console.log(`${color.green('✓')} ${color.bold(name)} — ${color.green('REMOVABLE')} ${color.dim('(installed satisfies peer requirements)')}`);
  }
}

const removableCount = targets.length - neededCount - (hadError ? 1 : 0);
console.log(`\n${color.green(`${removableCount} removable`)}, ${color.red(`${neededCount} needed`)}.`);

// Exit non-zero if a lookup failed; otherwise success.
process.exit(hadError ? 1 : 0);
