# C1 scene/model implementation

- Started: 2026-09-24. Author: /root/inference_public_review (this C1 task is authorship, not independent approval).
- Purpose: Implement the approved two training pipeline diagrams without editing article prose, shared wrappers, registry, integration, browser tests, generated files, or Git.
- Ownership: website/lib/training-stages-model.mjs; website/components/diagrams/training-stages-walkthrough.jsx; website/components/diagrams/training-stages.css; website/tests/unit/training-stages-model.test.mjs; website/lib/training-runtime-boundary-model.mjs; website/components/diagrams/training-runtime-boundary-walkthrough.jsx; website/components/diagrams/training-runtime-boundary.css; website/tests/unit/training-runtime-boundary-model.test.mjs.
- Basis: AGENTS.md, CONTRIBUTING.md, training-reading-diagrams.md, approved training-storyboards.md/json, original llm-training-pipeline.md. Parent authorizes C1 implementation after B public acceptance. No external mutation is delegated.
- Verification: owned model unit tests only. Root owns integrated build, browser and delivery. No parallel build.
- Exit: 8 files, stable browser attributes shared with root/portable_handoff_kit, meaningful structural/midpoint/reverse/invalid-input invariants, results and remaining checks recorded here.
- Concurrency: shared checkout; other agents own dispatcher/registry/integration and public kit. Their changes must not be reverted.

Status: implementing. Browser/visual acceptance not yet performed for C1.

## Implementation completed

- Authored the approved six-stage training diagram and four-stage runtime diagram using ReadingFigure, SceneBase (640 x 430), Wire and Select. The parent-owned reading map supplies six and three READ stops respectively.
- The model weight rectangle stays at x=240, y=186, width=160, height=98 in all six training stages. Training paths enter weights; retrieval paths enter the separate runtime context. Preference stage keeps RLHF and DPO as two different update routes.
- Coverage/accuracy/instruction, behavior/facts, hallucination/sycophancy/refusal and instruction/permission/verification selectors only change emphasis. Default comparisons retain caveats and all their rows/cards.
- Runtime output graph retains model-candidate -> permission-check -> operation -> result-verification. Permission, operation and result checks belong to code outside the model. The model performs no operation, judgment, numerical quality estimate or effect calculation.
- The scenes export TrainingStages and TrainingRuntimeBoundary. Article prose, shared wrappers, dispatcher, registry, generated assets, integration, browser tests and Git were not edited by this author.

## Stable browser contract

- training SVG: data-training-stage, data-model-id=training-model, data-training-target=weights, data-retrieval-target=runtime-context, data-numeric-performance=none, data-knowledge-focus/data-evaluation-focus (none outside their stages).
- Weight group: data-node-id=weights, data-model-id=training-model; fixed rectangle. Context group: data-node-id=runtime-context, data-weights-updated=false.
- Learning edge groups: data-route-source/target/effect. Sources by stage: 0=text,demonstration,preference; 1=text; 2=additional-training,retrieval; 3=demonstration; 4=additional-training,retrieval; 5=preference:RLHF,preference:DPO. Retrieval targets runtime-context with context-input; learning targets weights with parameter-update.
- Comparison data-knowledge-card IDs coverage/accuracy/instruction, data-evaluation-row IDs behavior/facts. Each carries data-emphasized.
- Runtime SVG: data-training-runtime-stage, data-permission-node=outside-model, data-output-route=model-candidate,permission-check,operation,result-verification; data-judgment=none and data-operation-executed=false.
- Runtime data-trait-row IDs hallucination/sycophancy/refusal. Boundary data-boundary-node IDs model-candidate/permission-check/operation/result-verification. data-emphasized selects model-candidate for instruction, permission-check for permission, result-verification for verification. Operation is never emphasized by a selector.
- Boundary edges expose data-edge-source/target/meaning. Controls expose data-control=knowledge-focus/evaluation-focus/trait-focus/boundary-focus.
- Contract sent to root and portable_handoff_kit. Product sources frozen for root's integrated export; only follow-up fixes coordinated with root will change them.

## Verification

- Command: node --test website/tests/unit/training-stages-model.test.mjs website/tests/unit/training-runtime-boundary-model.test.mjs
- Result: exit 0, 16 tests passed, 0 failed/cancelled/skipped/todo; duration 243.0991 ms.
- Covered independent route fixtures, fixed coordinates, preserved comparisons under every focus, inactive focus irrelevance, outside-model permission topology, distinct preference methods, non-causal associations, absent invented metrics/judgments, forward and reverse midpoint transitions, invalid inputs, finite endpoint clamp and returned-data mutation isolation.
- No build was run by this author. Browser rendering, narrow/low-height/dark readability, print/reduced-motion/SSR/no-JS integration, independent semantic review, CI and public acceptance remain the parent's verification tasks. Unit success is not visual or public approval.

Recorded UTC: 2026-09-24T14:08:22.6619980Z

SHA256 of owned files:

- website/lib/training-stages-model.mjs : 86bb6fd18d34adb01f8511b9f139a3218d875a7d0febe9d90e382358abdd648b
- website/components/diagrams/training-stages-walkthrough.jsx : 1e59e2821f9e6622704934a1796294019164e621584c816444589e2bfd2c52aa
- website/components/diagrams/training-stages.css : a9188e12f0141444ffbe8334de052f5ae3447ad923ac71b803b3e885c1897f03
- website/tests/unit/training-stages-model.test.mjs : 2c6004084fd20ecc110f0c6de5d59a5f05f4918d8b95ec49cf89d37e5579c868
- website/lib/training-runtime-boundary-model.mjs : 9bf9d4a15e5da3fcbbf28f1ddeb56267c7133c361166a187f6cd06f759c435cc
- website/components/diagrams/training-runtime-boundary-walkthrough.jsx : a849affa2c14a4ac55ab6b77cfa350e38feecc35b3dd9071ef4d8f1ee9c0f1e7
- website/components/diagrams/training-runtime-boundary.css : 71061427c9108c0612ca896910435a6a926f2b02cbc1f5dbd2c1d2a53dc9defb
- website/tests/unit/training-runtime-boundary-model.test.mjs : c991b5ec08400a96cb82f3f58cb1c89da6f6434a8222daf3ad4c7b788788ca03
