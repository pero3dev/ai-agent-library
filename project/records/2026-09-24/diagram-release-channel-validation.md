# Channel default correction validation

Status: candidate ready for independent limited review; not yet independently approved.

Owned changes are limited to five files in scripts/diagram-release/: verify-public.mjs, portable-validation.test.mjs, check-preparation.mjs, source-mapping.json and README.md. No root workrecord/handoff, other code, Git, network, public HTTP or browser execution was touched.

The runner's only differences from the immutable LF predecessor are two statements: launch omits channel when not specified, and result metadata records null instead of msedge for bundled Chromium. Explicit msedge selects Edge; WebKit continues to reject every channel. Public URL, all 58 cases, numerical fixtures and CI identity assertions are unchanged.

Manifest schema 3 retains original raw/normalized source hashes, identifies predecessor manifest d5ff1524136e8279af9e946ba4e4ae5faf71eb2cfa401b574a7258fd1ebaeb7c, declares both exact before/after source edits and the modified protected-section candidate hash. Preparation checks each replacement occurs exactly once, verifies the current candidate hash, reverses the two declared edits, and checks the original normalized protected-section hash. This is explicit successor provenance, not a claim that the changed runner is byte-identical to its predecessor.

Offline verification:

- 18/18 tests passed; zero failure/skip.
- New boundary test executes the runner's actual validation and launch/report statements against a launch stub. Four allowed combinations produce the required exact options and metadata; WebKit+channel, unsupported channel and unsupported browser fail before any launch attempt.
- Changed three Node files passed syntax checks. Preparation passed all file/LF/source-preservation/case/fixture checks.
- All original B source hashes and all immutable LF predecessor file hashes were rechecked and remain unchanged.
- No actual Playwright browser process, HTTP, GitHub or public case ran. Live browser acceptance remains a separate action.

Candidate source-mapping.json SHA-256: e9cf22cf7edd16443a6cd4d38c6aec9fac92bd09f4ad442f04270ef352ddac03

Protected original normalized section SHA-256: 3866ce9c96e972b28f1d823f63e2ab43f19294bf318c831cf920dab097b67d17

Protected current candidate section SHA-256: bcacd0aac5cff7dfb542dc3b30ae1843cfbb05e1d8a657fad95d0e85b996f29c

Complete per-file hashes and exact before/after statements are in channel-fix-validation.json. Test output is channel-fix-validation.log; preparation output is channel-fix-validation.preparation.json.
