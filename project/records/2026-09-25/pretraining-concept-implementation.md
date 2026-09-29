# C2 concept implementation record

- Checked: 2026-09-24T16:33:37.257Z
- Author: /root/training_public_acceptance
- Status: implementation and owned unit tests complete; independent acceptance is pending.
- Ownership: exactly the eight files below. Root handles common integration, build, browser, Git and public acceptance.

## Meaning and interaction

Data uses four source documents with two positions each, read A B C D A B. Six reads produce twelve distinct processing occurrences while the eight source positions keep their identities. Eight positions do not mean eight distinct vocabulary items; independent information, quality score and learning effect remain unknown. All four design cards remain visible; selection changes emphasis only.

Metrics uses the same six illustrative inputs A–F with integer scores 30–80, fixed x positions, and simultaneous continuous/binary views. Thresholds 50, 60 and 70 use integer >= comparison, including equality; division by 100 is display only. Other stages retain threshold 60. The figure does not report real model ability, implement exact-match/Brier, settle the emergence debate, or prove every emergence claim false.

Both scenes have four stages, READ stages 0, 2 and 3, and a manual supplementary stage 1. They use existing ReadingFigure/SceneBase/Select/Wire contracts. Shared integration and article prose are outside this worker's ownership.

## Validation

`node --test website/tests/unit/pretraining-data-model.test.mjs website/tests/unit/pretraining-metrics-model.test.mjs`

Passed 13/13, exit 0, no skipped tests. Tests cover fixed identities/counts, all selector choices, inclusive integer boundaries, fixed source positions, inactive-stage isolation, midpoint/reverse seeks, invalid inputs, clamping, mutation isolation and unknown/no-verdict fields. This is a model-unit result; it is not browser or visual acceptance.

Independent code-read fixes: relative reuse-icon arrow segment; continuous-axis endpoint label alignment and separation; wider processing label card. Requested quality-score and denominator DOM hooks are present. Exact DOM hook contracts are listed in the JSON companion.

No build, browser, public, physical-device or Git operation was performed by this worker. Root was notified that the eight files are ready for integration; actual image review remains required.

## File identity

| File | SHA-256 |
| --- | --- |
| `website/lib/pretraining-data-model.mjs` | `5338703ea3cd88e8c2df1df41e4d077be40a01042dc62ba2a69ede28c97673fa` |
| `website/components/diagrams/pretraining-data-walkthrough.jsx` | `d2724eb12d8426bc52f812c1a6e7d4171171295bc4ac3d4acfde71b1793527bf` |
| `website/components/diagrams/pretraining-data.css` | `99a72eb0fa72e29d7c302d51dec8f357fedda7cd0ad1862a2498e22a7158ef6d` |
| `website/tests/unit/pretraining-data-model.test.mjs` | `23465e6b87a3c5ec52b7cfff882694050d6dd4e1aa9afdc3fbb174250f23d0f9` |
| `website/lib/pretraining-metrics-model.mjs` | `a5986c1f309ba58d976786ba4f14c0f20fcce6c9e387f12d52967cd33b182ad0` |
| `website/components/diagrams/pretraining-metrics-walkthrough.jsx` | `2cc7142adf8d6728af65c5111495c6e431b4ea7f98d51564376f893729211d62` |
| `website/components/diagrams/pretraining-metrics.css` | `132da226d439b465509d09f46129a8a07904e0184bde99897884e105a53a57fa` |
| `website/tests/unit/pretraining-metrics-model.test.mjs` | `8cdceea11535719f600cca40696331252f908747c39c9e983cabb6ac27c01502` |
