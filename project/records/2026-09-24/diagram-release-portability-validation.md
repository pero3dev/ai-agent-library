# LF portability correction

Status: implementation and offline validation complete; independent LF re-review pending. The earlier approved manifest (6c28da90...) is historical and does not approve this updated manifest.

The repository's LF checkout contract requires hashes to survive text normalization. All 11 portable files now use LF; the only pre-normalization CRLF occurrences were one in inference-checks.mjs and one at README.md's end. The frozen public source kit was read only and remains unchanged.

Source mapping schema 2 records sourceRawSHA256 and normalizedSourceSHA256 separately. The latter applies only CRLF-to-LF. inference-checks.mjs is no longer in byteIdenticalFiles and is checked against normalizedSourceIdenticalFiles. Its normalized bytes exactly match the CRLF-to-LF-transformed original; all fixtures, assertions and case definitions retain their content. The other two assertion modules remain byte-identical. Five protected identity/browser/extractor code sections match their normalized sources. README explicitly documents this contract.

Validation:

- check-preparation succeeded with LF-only gating, portable file hashes, original raw source provenance, normalized module/source-section comparisons and all fixture/case checks.
- 17/17 offline tests passed, zero failure/skip. Added an all-file LF/idempotence regression; other 16 test cases remain unchanged in behavior.
- Eight Node syntax checks and PowerShell parser succeeded.
- validation-notes.md received only the requested blank line before its list. Its prior test count and manifest remain a historical record.
- No repository/Git edits, original source changes, network, public HTTP, browser or GitHub operations occurred.

Current source-mapping.json SHA-256: d5ff1524136e8279af9e946ba4e4ae5faf71eb2cfa401b574a7258fd1ebaeb7c

inference-checks.mjs original raw SHA-256: 90808bc9fb9dcf9c1e0f06e3b1ddc4e243bd0a0460f1d8d30c8997bb7415f80e

inference-checks.mjs normalized source and portable SHA-256: d0f83f658e4f4ff286a7262f2a06a16faeee59f10adebfd88e56d7dbef820133

Evidence: lf-source-comparison.json, lf-preparation-console.json, lf-offline-tests.log. Root must replace its owned kit copy with this complete 11-file revision and perform the scoped independent LF review before treating the prior approval as refreshed.
