#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function checkLiteratureRun({ inputDir } = {}) {
  const root = resolve(requiredText(inputDir, 'inputDir'));
  const corpus = await readJson(resolve(root, 'corpus.json'), 'corpus.json');
  const claims = await readJsonl(resolve(root, 'claims.jsonl'));
  const review = await readFile(resolve(root, 'review.md'), 'utf8');
  const errors = [];

  if (!corpus || !Array.isArray(corpus.records)) {
    throw new Error('corpus.json must contain a records array');
  }

  const recordById = new Map();
  for (const record of corpus.records) {
    const recordId = textOrError(record?.record_id, 'record_id', errors);
    if (!recordId) continue;
    if (recordById.has(recordId)) {
      errors.push(`duplicate record_id ${recordId}`);
      continue;
    }
    recordById.set(recordId, record);
    if (!['included', 'uncertain', 'excluded'].includes(record.screening_status)) {
      errors.push(`record ${recordId} has invalid screening_status ${record.screening_status}`);
    }
    if (!['verified', 'unresolved', 'conflicted', 'rejected'].includes(record.verification_status)) {
      errors.push(`record ${recordId} has invalid verification_status ${record.verification_status}`);
    }
    if (
      ['verified', 'conflicted', 'rejected'].includes(record.verification_status)
      && (!Array.isArray(record.verification_notes) || record.verification_notes.length === 0)
    ) {
      errors.push(`record ${recordId} requires verification_notes for ${record.verification_status}`);
    }
  }

  const claimById = new Map();
  const usedRecords = new Set();
  if (claims.length === 0) errors.push('claims.jsonl must contain at least one claim');
  for (const claim of claims) {
    const claimId = textOrError(claim?.claim_id, 'claim_id', errors);
    if (!claimId) continue;
    if (claimById.has(claimId)) {
      errors.push(`duplicate claim_id ${claimId}`);
      continue;
    }
    claimById.set(claimId, claim);
    textOrError(claim.claim, `claim ${claimId} text`, errors);
    if (!Array.isArray(claim.limitations)) errors.push(`claim ${claimId} limitations must be an array`);
    if (!Array.isArray(claim.evidence) || claim.evidence.length === 0) {
      errors.push(`claim ${claimId} must contain evidence`);
      continue;
    }

    for (const [index, evidence] of claim.evidence.entries()) {
      const label = `claim ${claimId} evidence ${index + 1}`;
      const recordId = textOrError(evidence?.record_id, `${label} record_id`, errors);
      const location = textOrError(evidence?.location, `${label} location`, errors);
      const excerpt = textOrError(evidence?.excerpt, `${label} excerpt`, errors);
      textOrError(evidence?.support_level, `${label} support_level`, errors);
      if (!recordId) continue;
      const record = recordById.get(recordId);
      if (!record) {
        errors.push(`${label} refers to unknown record ${recordId}`);
        continue;
      }
      usedRecords.add(recordId);
      if (record.screening_status !== 'included') {
        errors.push(`${label} cannot use screening_status ${record.screening_status}`);
      }
      if (['conflicted', 'rejected'].includes(record.verification_status)) {
        errors.push(`${label} cannot use verification_status ${record.verification_status}`);
      }
      if (!location || !excerpt) continue;
      if (location === 'abstract') {
        if (!containsExcerpt(record.abstract, excerpt)) {
          errors.push(`${label} excerpt not found in abstract`);
        }
      } else {
        await checkSavedTextEvidence({ root, location, excerpt, label, errors });
      }
    }
  }

  const reviewClaimIds = markers(review, /\[([A-Z][A-Z0-9_-]*\d+)\]/g);
  for (const claimId of reviewClaimIds) {
    if (!claimById.has(claimId)) errors.push(`review contains unknown claim marker ${claimId}`);
  }
  for (const claimId of claimById.keys()) {
    if (!reviewClaimIds.has(claimId)) errors.push(`review is missing claim marker ${claimId}`);
  }

  const reviewRecordIds = markers(review, /\[record:([^\]]+)\]/g);
  for (const recordId of reviewRecordIds) {
    if (!recordById.has(recordId)) {
      errors.push(`review contains unknown record marker ${recordId}`);
    } else if (!usedRecords.has(recordId)) {
      errors.push(`review cites record ${recordId} that no claim uses`);
    }
  }
  for (const recordId of usedRecords) {
    if (!reviewRecordIds.has(recordId)) errors.push(`review is missing reference marker for ${recordId}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      records: recordById.size,
      claims: claimById.size,
      cited_records: usedRecords.size,
    },
  };
}

async function checkSavedTextEvidence({ root, location, excerpt, label, errors }) {
  const hashIndex = location.indexOf('#');
  const relativePath = hashIndex === -1 ? location : location.slice(0, hashIndex);
  const locationDetail = hashIndex === -1 ? '' : location.slice(hashIndex + 1);
  if (!relativePath || !locationDetail || isAbsolute(relativePath)) {
    errors.push(`${label} has unsafe evidence path ${location}`);
    return;
  }
  const evidencePath = resolve(root, relativePath);
  const pathFromRoot = relative(root, evidencePath);
  if (!pathFromRoot || pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`)) {
    errors.push(`${label} has unsafe evidence path ${location}`);
    return;
  }
  let content;
  try {
    content = await readFile(evidencePath, 'utf8');
  } catch (error) {
    errors.push(`${label} cannot read evidence path ${relativePath}: ${error.message}`);
    return;
  }
  if (!containsExcerpt(content, excerpt)) {
    errors.push(`${label} excerpt not found in ${relativePath}`);
  }
}

function containsExcerpt(content, excerpt) {
  if (typeof content !== 'string') return false;
  return normalizeWhitespace(content).includes(normalizeWhitespace(excerpt));
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function markers(document, pattern) {
  return new Set([...document.matchAll(pattern)].map((match) => match[1]));
}

function textOrError(value, field, errors) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${field} is required`);
    return null;
  }
  return value.trim();
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`cannot read ${label}: ${error.message}`);
  }
}

async function readJsonl(path) {
  const content = await readFile(path, 'utf8');
  const records = [];
  for (const [index, line] of content.split('\n').entries()) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`claims.jsonl line ${index + 1}: ${error.message}`);
    }
  }
  return records;
}

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index === -1 || !args[index + 1]) throw new Error(`${name} is required`);
  return args[index + 1];
}

async function main() {
  const input = option(process.argv.slice(2), '--input');
  const result = await checkLiteratureRun({ inputDir: input });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.ok) {
    for (const error of result.errors) process.stderr.write(`${error}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stdout.write(`${JSON.stringify({ ok: false, errors: [error.message] })}\n`);
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
