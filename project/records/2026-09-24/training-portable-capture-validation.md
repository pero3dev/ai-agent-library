# C1 portable kit capture revision validation

Status: candidate complete; independent limited review pending. This record covers offline checks and localhost only.

- Candidate manifest: `4359f9abf06785671e980686f89e596eb8c0d8cd1842fc3480712941a3b40507`.
- Immutable candidate: `ai-agent-library-C1-portable-capture-clip-candidate`; 12 repository-owned files mirrored, original kits/evidence unchanged.
- Compared with `9fb0fb0d951d7ba52728b080b86948efc5bcfd6acf3288d5d044c13f6612c6a3`; exact diff: `training-portable-capture-validation.diff`.
- Final local build: `GpM7J_g8lnbvEy6H7i7nO`. All 7 HTML digests are checked before and after each rehearsal.

## Change and provenance

Existing viewport captures remain the actual screen evidence. Each C1 stage, selector-final and expanded geometry observation now also names its complete scene image. Supplemental captures use real scrolling below the site header (dialog scrolling when expanded), assert that the whole scene fits in the same viewport, take an enclosing integer clip, verify exact PNG dimensions at the original DSF, and restore the original scroll in finally. No product CSS or viewport dimensions are changed. The noJS and print cases additionally retain both complete scenes.

Original 58 cases, fixtures, 7 article identity routes and all original CI/public gates remain protected. New C1 registration stays 13 cases, 10 stages, 9 READ stops and 6 view profiles (71 total). Preparation mechanically reverses declared capture edits to complete 9fb predecessor files and restores original protected bodies. Two PR58 label assertions remain, with separate old source and PR58 proof hashes.

One leading empty LF was removed from inference-checks.mjs; no statement changed. Restoration is declared alongside the earlier single trailing-LF removal. Historical raw/normalized hashes were retained. All 12 current files have LF only, no leading empty line, exactly one final LF and no trailing whitespace. README already had one final LF when inspected; its change is explanatory text.

## Verification

- Node syntax and offline preparation: passed. Preparation reports old 58 retained, new 13, total 71, 7 routes, all reversals passed.
- Repository unit test: 19/19 passed, failed 0, skipped 0; 17882.0439 ms. Log: `training-portable-capture-clip-unit.log`.
- Exact-helper offline stubs: 7 passed, including fraction/DSF2, clipped output rejection, invisible/header-covered/outside regions and restoration on screenshot failure. `training-portable-capture-clip-probes.json`.
- Chromium 153.0.8010.12: 13/13 passed, 0 failed. Raw result SHA256: `307e6645cdc1e7df7392b48bf87009a6cfdb18c921a46324b53992817c5389f0`.
- WebKit 26.6: 13/13 passed, 0 failed. Raw result SHA256: `f95096f1210cd22d999bd4374e0c6c061ae9df7b3b91c12462918b3589dde7ea`.
- Each engine saved 138 PNGs: 68 original viewport and 70 supplemental scene captures. All 66 geometry observations link to both image files. PNG hashes, dimensions and overlap-to-image mapping are in each run's `images-and-geometry-index.json`.
- Chromium recorded 24 text BBox pairs across 8 observations; WebKit recorded 0. These are review candidates, not automatic visual failures or acceptance. The 960x540 DSF2 S2 scene images were viewed by this author; their heading, upper cards and lower text appear without header occlusion. Independent image verdict remains separate.
- Both runs blocked external destinations by construction and recorded 0 attempted external requests. Adapter SHA256: `9c7fc130519a3a942cdd25829221705beb62b978e14e64292e73b028ba0ca88b`.

## Preserved incomplete attempts

The initial 74d18b Locator-only attempt finished 12/13 with low-height dimension failure and header occlusion. The 5ab36c real-scroll Locator attempt was retained as failed/interrupted: Locator's additional scrolling changed the clip and a requestAnimationFrame wait stalled under disabled JavaScript. Neither is acceptance. Both immutable candidates, adapters, raw results and screenshots remain available; the manifest names them explicitly. The final direct-clip helper has no animation-callback dependency or implicit Locator screenshot scrolling.

## Boundaries and next action

Only C1's 13 cases were run in this localhost rehearsal. Original 58 public checks were preserved mechanically, not newly executed. No Git, GitHub or public endpoint was used. Parent's common check began on 9fb0 and is not reused as proof for the new kit. This is browser emulation, not physical iPhone Safari. Owned server PID16380 on 4209 was stopped; other owners' servers remain untouched.

The independent reviewer is checking the final candidate and new PNGs. Parent owns repository records, final submission and eventual public acceptance. Candidate code is frozen while this review runs.

## Changed file hashes

| File | Current SHA256 |
| --- | --- |
| scripts\diagram-release\check-preparation.mjs | 18ff64ea6662395d8a47b87c67f2f8df3388f4c97252f2d47521c50e349dad98 |
| scripts\diagram-release\inference-checks.mjs | 9f52ca50576dcadc6010b60e30561b768a16b5da0ea8765952e2fc2c5c69e201 |
| scripts\diagram-release\README.md | 30800235e82a4c6c661e93e80e2afa0530a15750629219d7fedf34850adf2924 |
| scripts\diagram-release\source-mapping.json | 4359f9abf06785671e980686f89e596eb8c0d8cd1842fc3480712941a3b40507 |
| scripts\diagram-release\training-checks.mjs | 83bd24b85bb4179f643d4a8ba1727a87c305ed6f8b7859e410ace76c70f5e79e |
| scripts\diagram-release\verify-public.mjs | 87a8ada23f194d9cf4cdcfceda71aacc711626d02f0c0ff7f84e95193cf2d90c |
