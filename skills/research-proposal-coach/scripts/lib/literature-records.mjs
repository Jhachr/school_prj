export function mapOpenAlexWork(work, { queryId, retrievedAt, rawRef }) {
  if (!work || typeof work !== 'object') throw new Error('OpenAlex work must be an object');
  const sourceRecordId = openAlexId(work.id);
  const title = requiredText(work.title ?? work.display_name, 'OpenAlex title');
  const authors = (work.authorships ?? [])
    .map((authorship) => authorship?.author?.display_name)
    .filter((name) => typeof name === 'string' && name.trim())
    .map((name) => name.trim());
  const year = normalizeYear(work.publication_year);
  const doi = normalizeDoi(work.doi);
  const url = firstHttpUrl([
    work.primary_location?.landing_page_url,
    work.best_oa_location?.landing_page_url,
    work.id,
  ]);
  const abstract = reconstructAbstract(work.abstract_inverted_index);

  return {
    record_id: `openalex:${sourceRecordId}`,
    title,
    authors,
    year,
    doi,
    url,
    abstract,
    provenance: [{
      source: 'openalex',
      source_record_id: sourceRecordId,
      query_id: requiredText(queryId, 'queryId'),
      retrieved_at: normalizeTimestamp(retrievedAt),
      raw_ref: requiredText(rawRef, 'rawRef'),
    }],
    screening_status: 'uncertain',
    screening_reason: '',
    verification_status: 'unresolved',
    verification_notes: [],
  };
}

export function reconstructAbstract(invertedIndex) {
  if (invertedIndex === undefined || invertedIndex === null) return null;
  if (typeof invertedIndex !== 'object' || Array.isArray(invertedIndex)) {
    throw new Error('abstract_inverted_index must be an object or null');
  }
  const positioned = [];
  for (const [term, positions] of Object.entries(invertedIndex)) {
    if (!Array.isArray(positions)) throw new Error('abstract positions must be arrays');
    for (const position of positions) {
      if (!Number.isInteger(position) || position < 0) {
        throw new Error('abstract positions must be non-negative integers');
      }
      positioned.push([position, term]);
    }
  }
  if (!positioned.length) return null;
  positioned.sort((left, right) => left[0] - right[0] || left[1].localeCompare(right[1]));
  return positioned.map(([, term]) => term).join(' ');
}

export function normalizeDoi(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('DOI must be a string or null');
  const normalized = value
    .trim()
    .replace(/^doi:\s*/i, '')
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .toLowerCase();
  return normalized || null;
}

export function normalizeTitle(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error('title must be a string');
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mergeExactRecords(inputRecords) {
  if (!Array.isArray(inputRecords)) throw new Error('records must be an array');
  const records = [];
  let exactOverlapCount = 0;

  for (const rawRecord of inputRecords) {
    const incoming = validateRecord(structuredClone(rawRecord));
    const existing = records.find((candidate) => exactIdentity(candidate, incoming));
    if (!existing) {
      records.push(incoming);
      continue;
    }
    exactOverlapCount += 1;
    mergeInto(existing, incoming);
  }

  records.sort((left, right) => left.record_id.localeCompare(right.record_id));
  return { records, exact_overlap_count: exactOverlapCount };
}

function exactIdentity(left, right) {
  if (left.record_id === right.record_id) return true;
  return Boolean(left.doi && right.doi && left.doi === right.doi);
}

function mergeInto(target, incoming) {
  const conflicts = [];
  if (normalizeTitle(target.title) !== normalizeTitle(incoming.title)) {
    conflicts.push(`title conflict: ${target.title} <> ${incoming.title}`);
  }
  if (target.year !== null && incoming.year !== null && target.year !== incoming.year) {
    conflicts.push(`year conflict: ${target.year} <> ${incoming.year}`);
  }
  if (target.doi && incoming.doi && target.doi !== incoming.doi) {
    conflicts.push(`DOI conflict: ${target.doi} <> ${incoming.doi}`);
  }
  if (target.authors.length && incoming.authors.length && target.authors[0] !== incoming.authors[0]) {
    conflicts.push(`first author conflict: ${target.authors[0]} <> ${incoming.authors[0]}`);
  }

  for (const field of ['doi', 'url', 'abstract', 'year']) {
    if ((target[field] === null || target[field] === '') && incoming[field] !== null) {
      target[field] = incoming[field];
    }
  }
  if (!target.authors.length && incoming.authors.length) target.authors = [...incoming.authors];
  target.provenance = uniqueProvenance([...target.provenance, ...incoming.provenance]);
  if (conflicts.length) {
    target.verification_status = 'conflicted';
    target.verification_notes = [...new Set([...target.verification_notes, ...conflicts])];
  } else {
    target.verification_notes = [...new Set([
      ...target.verification_notes,
      ...incoming.verification_notes,
    ])];
  }
}

function validateRecord(record) {
  requiredText(record.record_id, 'record_id');
  requiredText(record.title, 'title');
  if (!Array.isArray(record.authors)) throw new Error('authors must be an array');
  if (!Array.isArray(record.provenance) || !record.provenance.length) {
    throw new Error('provenance must contain at least one source');
  }
  if (!['included', 'uncertain', 'excluded'].includes(record.screening_status)) {
    throw new Error(`invalid screening_status: ${record.screening_status}`);
  }
  if (!['verified', 'unresolved', 'conflicted', 'rejected'].includes(record.verification_status)) {
    throw new Error(`invalid verification_status: ${record.verification_status}`);
  }
  if (!Array.isArray(record.verification_notes)) throw new Error('verification_notes must be an array');
  return record;
}

function uniqueProvenance(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => (
    left.source.localeCompare(right.source)
    || left.source_record_id.localeCompare(right.source_record_id)
    || String(left.query_id).localeCompare(String(right.query_id))
    || left.raw_ref.localeCompare(right.raw_ref)
  ));
}

function openAlexId(value) {
  const id = requiredText(value, 'OpenAlex id').replace(/^https?:\/\/openalex\.org\//i, '');
  if (!/^W\d+$/i.test(id)) throw new Error(`invalid OpenAlex work id: ${value}`);
  return id;
}

function normalizeYear(value) {
  if (value === undefined || value === null) return null;
  if (!Number.isInteger(value) || value < 1000 || value > 9999) {
    throw new Error(`invalid publication year: ${value}`);
  }
  return value;
}

function normalizeTimestamp(value) {
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.valueOf())) {
    throw new Error('retrievedAt must be an ISO timestamp');
  }
  return date.toISOString();
}

function firstHttpUrl(values) {
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) continue;
    try {
      const url = new URL(value);
      if (['http:', 'https:'].includes(url.protocol)) return url.toString();
    } catch {
      // Try the next source URL.
    }
  }
  return null;
}

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}
