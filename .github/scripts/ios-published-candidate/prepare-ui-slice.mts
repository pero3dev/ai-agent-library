type EventInput = { repository: { full_name: unknown; private: unknown }; pull_request?: { head: { sha?: unknown } } };
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readPublishedSimulatorReady } from '../../../ios/tests/native-simulator-prepare.mjs';
const owned = readPublishedSimulatorReady();
import { ORIGINAL_CASE_IDS, caseIDsForSlice, validatePartitions, validateSwiftCaseSources, flatUISourceNames } from './ui-slice-contract.mts';
assert.equal(process.env.GITHUB_ACTIONS, 'true');
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH as string, 'utf8')) as EventInput;
assert.equal(event.repository.full_name, 'pero3dev/ai-agent-library'); assert.equal(event.repository.private, false);
const sourceHead = event.pull_request?.head.sha ?? process.env.GITHUB_SHA;
assert.equal(sourceHead, process.env.EXPECTED_SOURCE_HEAD); assert.match(sourceHead as string, /^[a-f0-9]{40}$/);
assert.match(process.env.GITHUB_SHA as string, /^[a-f0-9]{40}$/);
const sourceNames = flatUISourceNames(readdirSync('ios/AILibraryUITests', { withFileTypes: true }));
const sourceBuffers = Object.fromEntries(['ios/AILibraryUITests/NativeReaderUITests.swift',
  'ios/AILibraryUITests/PublishedReaderUITests.swift'].map(file => [file, readFileSync(file)]));
const otherSourceFiles = sourceNames
  .map(file => `ios/AILibraryUITests/${file}`).filter(file => !Object.hasOwn(sourceBuffers, file));
const otherSources = Object.fromEntries(otherSourceFiles.map(file => [file, readFileSync(file, 'utf8')]));
const sourceCaseInventory = validateSwiftCaseSources(Object.fromEntries(
  Object.entries(sourceBuffers).map(([file, bytes]) => [file, bytes.toString('utf8')])), otherSources);
const sourceCaseFiles = Object.entries(sourceBuffers).map(([file, bytes]) => ({
  path: file, bytes: bytes.length, SHA256: createHash('sha256').update(bytes).digest('hex') }));
validatePartitions();
const slice = process.env.UI_SLICE, ids = caseIDsForSlice(slice);
const contract = readFileSync('.github/scripts/ios-published-candidate/ui-slice-contract.mts');
const selection = { schema_version: 1, status: 'fixed-disjoint-full-UI-slice', slice,
  repository: event.repository.full_name, run_id: process.env.GITHUB_RUN_ID, run_attempt: process.env.GITHUB_RUN_ATTEMPT,
  source_head: sourceHead, event_commit: process.env.GITHUB_SHA, pull_request_head: event.pull_request?.head.sha ?? null,
  source_case_inventory: sourceCaseInventory, source_case_files: sourceCaseFiles,
  expected_case_IDs: ids, expected_count: ids.length, original_full_case_IDs: ORIGINAL_CASE_IDS,
  contract_SHA256: createHash('sha256').update(contract).digest('hex'),
  owned_simulator: { context: owned.context, token: owned.token, UUID: owned.UUID },
  destination: { platform: 'iOS Simulator', id: owned.UUID, name: owned.name, osVersion: '18.5' },
  native_units_required: slice === 'reading-state', code_copy_and_Release_required: slice === 'content-copy' };
writeFileSync('.local/ios-published-candidate/evidence/ui-selection.json', JSON.stringify(selection, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
writeFileSync('.local/ios-published-candidate/evidence/ui-selectors.txt',
  ids.map(id => `-only-testing:AILibraryUITests/${id.slice(0, -2)}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 });
