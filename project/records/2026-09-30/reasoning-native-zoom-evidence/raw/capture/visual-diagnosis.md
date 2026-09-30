# Native 200% capture diagnosis

A single diagnostic run completed on the frozen local D2 build. Native zoom remained2 and the scene stayed at manual stage2 and scrollY1801.5 across the three200% captures. Unclipped CDP surface images before/after are byte-identical and visibly contain the diagram (1424x905). The intervening Playwright viewport is blank (712x452). At restored100%, all three capture hashes match.

This demonstrates a capture-path discrepancy, not a blank product scene. The exact internal coordinate cause is unproven. The200% viewport also has a fixed-header overlap at the scene top, so this probe does not establish full-scene or all-stage visual acceptance. No image crop, CSS/DSF override, real profile change or product edit was used.

The immutable raw is [result.json](result.json); identities, six actually viewed files (four current, two prior), hashes and limits are in [visual-diagnosis.json](visual-diagnosis.json). Twelve fetch aborts remain recorded separately; there were zero critical-resource failures/page errors/console errors. No further probe was run.
