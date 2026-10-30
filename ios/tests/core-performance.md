# Published core host benchmark

This CLI provides three descriptive host scenarios for IOS-15. It uses the app's
unchanged Foundation/CryptoKit sources, without an app or XCTest lifecycle. It
requires a preserved, previously audited public Content directory and a full
immutable source commit. It does not generate the corpus.

| Scenario | Monotonic timed region |
| --- | --- |
| `published-core.validation.v1` | Exactly `ContentValidator.validate(root:)`, with the returned snapshot retained at stop. |
| `published-core.index-construction.v1` | Exactly `LibrarySearchIndex(articles:)` after manifest decode; manifest and index retained at stop. |
| `published-core.indexed-filter.v1` | One complete literal query batch through production `LibraryArticleFilter.articles`, using a prebuilt index and materialized result arrays. |

Manifest read/SHA checks, summary extraction and ordered-ID digests are outside
timing. Index construction consumes its index in a query batch after stop to
retain observable use of the constructed value. Its RSS therefore includes that
post-timing batch. Filter timing includes query normalization. Validator timing
includes the validator's full enumeration, hashes, document and PNG structural
checks; it does not include a second document traversal, import, or activation.

The query JSON reproduces the exact literal array in the selected commit's
`SearchIndexTests.swift`. At `b79c0a3f6b76a7603077b0a30a07cdecb94cda93` this is
**16 queries**, including `__no_match_128__`. The older historical search record
used 15 queries and a different timing region. Its numeric results do not measure
this harness and must not be copied into a new result.

A separate correctness invocation validates the corpus and compares every
query's ordered indexed IDs with production `LibraryArticleFilter` without an
index. It copies no search normalization algorithm. The runner accepts measured
query digests only when they equal this invocation's digests. Each scenario has
one discarded warmup and five recorded samples, each in a fresh process. Raw
records, sample order, commands, median, minimum, maximum and range are retained.
There are 19 harness invocations total, including correctness. No timing threshold,
p95 estimate, performance budget, or SLO is inferred.

`wall_seconds` uses `DispatchTime.now().uptimeNanoseconds` converted to seconds.
`process_peak_resident_bytes` uses macOS Darwin
`getrusage(RUSAGE_SELF).ru_maxrss`. The local primary Darwin `getrusage(2)` manual
(`MacOSX13.3.sdk/usr/share/man/man2/getrusage.2`, lines 94–95) explicitly defines
this field in bytes. The reading is the whole process high-water through the
post-work, pre-JSON-output probe. It includes runtime setup, manifest decode,
retained index/results, and post-timing digest work. It excludes any later JSON
output allocation. It is not a phase delta, isolated index size, completed-process
lifetime maximum, or iOS app memory; do not subtract two high-water marks to claim
cache allocation. Non-Darwin, failed, missing or nonpositive RSS is rejected.

The runner independently scans published article front matter with `git show`
and compares its count and source-path/SHA pairs with the actual corpus. Its
narrow status parser fails on unfamiliar YAML for review. Raw identities include
manifest/corpus revision and SHA, actual consumed article count/order, corpus
files/bytes/PNG count, production/test/harness/query/runner hashes, binary hash,
compiler version/target/flags, OS and architecture. The preserved corpus is hashed
before and after each invocation; this warms filesystem caches, so results are
not cold-disk measurements. A changed corpus, absent checksum/metric, unexpected
field, malformed output or mismatched identity fails the run. A partial output
directory without `summary.json` is not a successful observation.

Explicit host execution, with an independently prepared resource guard:

```bash
bash ios/tests/check-core-performance.sh --run \
  --repo "<repo>" --revision b79c0a3f6b76a7603077b0a30a07cdecb94cda93 \
  --corpus "<preserved-Content>" --output "<new-private-output-directory>" \
  --swiftc /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc \
  --sdk /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX15.2.sdk \
  --target arm64-apple-macosx14.0 --swift-version 5
```

These four toolchain options must be supplied together. They select the same
explicit Swift5 language mode, `-O -whole-module-optimization`, MacSDK15.2 and
arm64 macOS14 deployment target used by the earlier private first-run wrapper.
Use the same Xcode16.2 build16C5032a installation, immutable production commit and
preserved corpus bytes to reproduce that profile. Raw identity and commands must
still be checked: a pathname alone does not establish toolchain or corpus equality.

Omitting all four selectors uses the system `xcrun --find swiftc` and
`xcrun --show-sdk-path`, the compiler-reported macOS target and explicit Swift5
language mode. This default selection can choose a different toolchain or target;
its actual selections are recorded rather than labelled as the earlier profile.
`--help` performs no compilation. Unknown or duplicate options, partial selector
sets, free-form compiler args, non-macOS targets, host-architecture mismatches,
SDK versions older than the deployment target and unsupported Swift modes fail.

Compiler and SDK paths are made absolute and resolved with `realpath`. Official
symlinks are accepted. Identity records requested, invocation and resolved paths,
SDK metadata SHA, compiler version/default target, actual typed flags and the
complete compiler argv. The absolute requested `swiftc` invocation name is
retained because its resolved binary may select driver behavior from `argv[0]`.
The SDK sysroot uses its resolved directory. The compiler is spawned directly
with argument arrays; there is no compiler shell, eval or arbitrary-args option.

The prior successful host observation compiled the frozen v2 Swift source with a
separately hashed first-run wrapper. It did **not** execute the v2 default CLI.
The proposed v3 CLI execution stopped at preflight because its sanitized child
environment did not forward a private TMPDIR; no Swift/SDK/metric was produced.
The v4 source freeze first passed Node fixtures; a later actual frozen CLI run
completed one compile and19 processes. The [host observation record](../../project/records/2026-10-26/ios-published-core-benchmark.md)
keeps that result separate from the earlier wrapper and source-only validation.

Before any production child is spawned, the CLI creates an owned 0700
`.process-tmp` directory inside its new output directory, with a 0600 ownership
marker. Parent/root realpaths, UID, directory device/inode, mode and owner token
are checked before every child and before removal. Missing, replaced, linked or
otherwise invalid ownership fails without falling back to the operator's TMPDIR.
The compiler, metadata commands, correctness process and all measured processes
receive only PATH plus this controlled TMPDIR from the runner. Operator TMPDIR,
HOME, secrets and caller environment overrides are not forwarded. The absolute
temp path and spawn policy are saved in `identity.json` as `spawn_environment`.
Platform runtimes may add their own internal environment entries after launch;
these are distinct from the two keys explicitly passed by the runner.

Normal completion and errors remove only the registered owned temp root in a
finally block. SIGINT/SIGTERM/exit cleanup first kills registered child groups and
then synchronously removes validated owned temp roots. A changed ownership marker
or directory is rejected rather than deleting a substitute. Module cache and raw
outputs retain their existing lifecycle. The exported `runBounded` default keeps
its prior explicit-env compatibility for fixture callers; all production calls
supply a controlled context, which ignores such overrides.

This controlled TMPDIR is an environment change from the historical first-run
wrapper/earlier CLI source. Matching compiler flags does not make those runs an
observation of v4. The separate outer disk/cache/process-tree RSS guard is still
required for resource envelopes; TMPDIR is not a general filesystem sandbox.

Inputs are frozen from Git objects into the new output directory; dirty worktree
production sources are not used. Output must not overlap inputs. Child execution
is sequential with a 60-second sample limit, 180-second compile limit, 1 MiB combined
output limit (8 MiB for bounded Git source reads), and a 15-minute total deadline
plus a one-second shutdown allowance. SIGINT/SIGTERM/exit cleanup kills only its
registered child groups and signals exit nonzero. No package installation occurs.
Set `NODE_BINARY` only when the existing Node runtime is outside PATH.

Runner time/output bounds do not constrain disk usage, module-cache growth or
process-tree RSS. An independent outer resource guard remains a separate layer
for actual execution. The first-run wrapper's 180-second/512 MiB output-cache/
1.5 GiB sampled-tree-RSS envelope is historical execution configuration, not a
new built-in resource guarantee or performance acceptance budget.

Node/shell fixture validation and the recorded actual host CLI run are separate
evidence. Simulator/device/UI acceptance and performance budgets remain open;
this host run does not complete them. Keep `PackageAudit.swift`, its consumer
contract, and the strict launchClock exporter unchanged. This CLI does not
complete IOS-15: input-to-visible-results latency, scrolling/image decode,
Release/device/app memory and adopted acceptance budgets remain open.

## Preregistered offline acceptance of saved observations

Before a future rerun, `verify-core-performance.mjs` fixes the Source4,
runner/harness, production test-query source, exact 16-query bytes and independent
199-published-source digest to the `cb66343ddc18f28f780b8f240c07910839e7cc6a`
snapshot. That snapshot includes newer `ContentValidator.swift` and
`ReadingStore.swift`; older host measurements cannot be relabelled as its result.
The caller supplies the expected full revision independently and must retain a
frozen checkout or equivalent proof binding that revision to these bytes. A later
documentation-only revision can qualify with the same byte contract. The verifier
does not consult Git, authenticate the producer, or treat a self-claimed revision
or checksum as provenance proof.

The CLI always uses the builtin frozen byte contract and its adjacent runner
artifact. Only trusted JavaScript callers can explicitly construct
`createObservationVerifier({ trustedByteContract, trustedRunnerDirectory })`.
Construction checks exact keys, SHA types and bounded counts/strings, then clones
and freezes the policy before reading candidate files. Candidate identity/summary
data, CLI flags and environment variables cannot select a policy or runner proof.
Policy limits are 2000 articles and 4096 queries. Ordinary library article/Core
edits do not require changing the historical builtin contract to keep fixtures
passing; a new actual observation of changed bytes needs its own reviewed policy.

```bash
node ios/tests/verify-core-performance.mjs --help
node ios/tests/verify-core-performance.mjs \
  --observation "<absolute-saved-output-directory>" \
  --corpus "<absolute-preserved-Content>" --revision "<expected-full-commit>"
node --test tests/unit/ios-core-performance-acceptance.test.mjs
```

Fixture tests explicitly inject three synthetic articles/queries and small
synthetic Source4/harness/query/runner identity bytes. They do not scan live docs
or copy the current production inputs. A single guarded child Node replay in a
sparse verifier/runner/test tree checks this independence. Synthetic observations
must be rejected by the builtin API and CLI; successful production CLI acceptance
against a real saved observation is unverified in this source-only unit.

This read-only replay uses the existing runner schema and exported inventory,
record validation and statistics functions. It requires `identity.json`,
`summary.json`, frozen Source4/harness/query/binary bytes, compiler stderr and all
19 raw JSON/stderr pairs. It rehashes the preserved corpus, checks the fixed
source-path/SHA set and article order, verifies the correctness oracle against
indexed query results, enforces unique fresh PIDs/UUIDs and exact invocation order,
and recalculates median/minimum/maximum/range from each five recorded samples.
One warmup per scenario is excluded. Raw records and summary copies must agree;
missing or inconsistent records, statistics, typed compiler flags/commands,
toolchain/spawn metadata and nonfinite numbers fail closed. The accepted profile
is Swift5 `-O -whole-module-optimization` on a Darwin macOS host. The 60-second
subprocess lifetime remains a runner resource bound, not a performance target.
The 18 sequential timed regions include all discarded warmups and recorded
samples; correctness has no timed region. Their sum must fit the 900-second
runner deadline and saved overall elapsed time. The latter allows at most 1 ms
for the difference of two integer-millisecond `Date.now()` readings, plus
binary64 division/sum roundoff. The watchdog's shutdown second adds no timed
work allowance. Clock adjustments cannot be reconstructed from the saved schema;
an inconsistent clock/timing claim is rejected, without inventing a correction.

Only normalized absolute input directories and fixed artifact basenames are read.
Symlink ancestors, linked/special artifacts, traversal names and overlapping
inputs are rejected. Artifact reads are bounded to 1 MiB each, except a 2 MiB
summary and 64 MiB binary. Corpus inventory retains the runner's 4096-file and
256 MiB bounds and is repeated after replay. Module-cache contents and unrelated
output files are not traversed; saved command/compiler/SDK paths are compared as
metadata and are never opened or executed. No compiler, SDK, benchmark, network
or external resource guard runs during verification. Corpus checksum/provenance
audit uses the existing inventory; this is not a new Swift package consumer audit.
For each of the 19 invocations, raw stdout JSON bytes plus stderr bytes must also
fit the runner's combined 1 MiB output bound; the individual file limits do not
double that allowance.

Success prints `status: "accepted-host-observation"` and
`performance_budget: "unadopted"`. This is acceptance of saved host-observation
consistency, with no new measurement, timing threshold, p95 estimate, SLO or iOS
Release/device acceptance. IOS-15 stays unchecked; the completion TODO remains
14 of 32, and the independent execution resource guard remains separate.
