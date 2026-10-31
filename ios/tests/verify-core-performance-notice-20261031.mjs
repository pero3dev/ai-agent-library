import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createObservationVerifier, parseVerificationArgs } from './verify-core-performance.mjs';

// Fixed Notice Source4 profile, reviewed before any new observation is produced.
// This is a distinct trusted entrypoint; the cb66 contract and legacy CLI stay fixed.
// Neither saved metadata, caller options, flags, environment nor a profile file
// can select policy. Revision provenance still requires the caller's own binding.
export const NOTICE_BYTE_CONTRACT = Object.freeze({
  production_source_sha256: Object.freeze({
    'ios/AILibrary/Sources/Models.swift': '459423194145e677834d35b57201ae60f0c9e9b5ab449a620cb519f5a070292c',
    'ios/AILibrary/Sources/NativeDocument.swift': 'ce96e4960eef766e325b1b4b7d3701d4a7d5b5c3b1e69ae9599fd0f2622af2ab',
    'ios/AILibrary/Sources/ContentValidator.swift': 'ffcdab90f0a8f39fc8b7cfceea0ba48aac7f18df1c033b237d2da311562e385a',
    'ios/AILibrary/Sources/ReadingStore.swift': 'da88bdb3ef99a93ddb842f53e7e92bdba2dfc4e95bff0f78f9d467387e9acfe7'
  }),
  harness_sha256: '92d8005e1d0fe98008e6deeff54773ee0866e0fb75c4b9dc80ce5507a03d71aa',
  runner_sha256: '4276643f3c0df1e21d62f020c0ebd5ec32639b536fa6933806e7ad611edcaf5f',
  query_source_sha256: '3bb988b77a8d8da65ae3e401d092a3ff5cfdebbad73e11e99c5efd6fb8d98eb7',
  query_sha256: '39995c2b75ba04eec4e1dc610b35c28b1b0f386cc5b250eaeab5211d13cfa31b',
  query_count: 16,
  expected_article_count: 199,
  expected_count_method: 'independent immutable docs NN-section Markdown front-matter status scanner',
  published_sources_sha256: '4ba18c1b5d72fdd3acfdac32ece203a1d8c2a1bbf7c11fa9a0a4169c1feacaee'
});

export const verifyNoticeObservation = createObservationVerifier({
  trustedByteContract: NOTICE_BYTE_CONTRACT,
  trustedRunnerDirectory: path.dirname(fileURLToPath(import.meta.url))
});

export async function main(args) {
  const options = parseVerificationArgs(args);
  if (!options) {
    console.log('Usage: node ios/tests/verify-core-performance-notice-20261031.mjs --observation <absolute saved directory> --corpus <absolute preserved Content> --revision <expected 40hex>\nOffline read-only Notice byte verification; no compiler, benchmark or saved command is executed.');
    return;
  }
  console.log(JSON.stringify(await verifyNoticeObservation(options), null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(`Notice Core observation rejected: ${error.message}`); process.exitCode = 1;
  });
}
