# TODO と定期メンテナンスの棚卸し(2026-09-10)

[レビュー S03](../review-2026-09-10.md) への対応として、未実施の定点観測と、採用条件が決まってから行う確認を区別しました。これは確認作業の追跡表です。外部仕様の全件再検証や、全 16 系統の最新化完了を示すものではありません。

判断の正本は [ROADMAP の定期メンテナンス](../ROADMAP.md#定期メンテナンスフェーズ完了後も継続) と [2026Q3 メンテナンス計画](../MAINTENANCE-2026Q3-PLAN.md) です。M1〜M3 は 2026-08-18 実施済み、M4〜M5 は未着手です。M6 は 9 月のサンプル検査と本棚卸しを実施した段階で、系統全体の定点観測とは分けます。M1〜M3 の完了も、対象記事の全 TODO が解消済みという意味ではありません。

## スナップショットと集計方法

- 取得日: 2026-09-10
- コマンド: `node scripts/todo-report.mjs --json`
- 保存先: [JSON スナップショット](review-todo-inventory-2026-09-10.json)
- 対象: `docs/` 本文の `TODO(要確認)`。コードフェンス内、`examples/`、`research/` は集計対象外です。
- 件数: **186 件 / 121 記事**。本文と末尾の重複掲出も、スクリプトが検出した各箇所を 1 件として保持しています。
- 最終確認月: 2026-07 が 115 件、2026-08 が 66 件、2026-09 が 5 件。
- JSON の SHA-256: `eaa5621c20d5f96517208b09cc94ba6b4c9524dfe4e9c7ef750a6ff908a2e4ab`

ID は保存した JSON 配列の 1 始まりの順序です。たとえば T001 は配列の先頭であり、恒久的な TODO ID ではありません。下表の行番号もスナップショット時点です。記事編集後は再取得して対応表・集計も一緒に更新します。

本棚卸しでは TODO の削除、原文の変更、最終確認月の更新はしていません。同日の別担当によるレビュー修正を取り込んだスナップショットです。月の古さだけで期限切れと判定せず、確認対象と次に作業できる条件から分類しました。記事が実質編集されても、その TODO の外部仕様を再検証していなければ 7 月・8 月を維持します。

## 分類基準と件数

| 区分 | 意味・次の実施条件 | 件数 | 関係する記事数 |
| --- | --- | --- | --- |
| P: 未実施の定点観測 | M4/M5 として予定済みの、一次情報の観測・未取得資料の確認です。対応バッチで実施します。 | 10 | 7 |
| C: 継続的な仕様確認 | 仕様・提供形態・料金・参照先の変化を追います。M1〜M3 の次回観測、または記事・仕様の改訂が実施条件です。 | 85 | 47 |
| A: 採用・実装時確認 | 利用製品、モデル、契約、地域、データ等が決まらないと確認対象を確定できません。導入・更新・引用・試算等の時点で確認・実測します。 | 81 | 67 |
| R: 継続的な研究確認 | 未決着の理論や最新の実証結果を、研究・記事の改訂時に一次論文で追います。 | 5 | 5 |
| U: 要振り分け | 執筆依存が残っている項目、または定期観測の担当系統が未定の項目です。次回計画時に担当と完了条件を決めます。 | 5 | 5 |
| 合計 | 各 TODO は 1 区分だけに計上しています。 | 186 | 121(一意) |

記事数は複数区分を含む記事を各区分に数えるため、列の単純合計は一意の記事数と一致しません。区分とバッチは別の軸です。たとえば `green-ai` の TODO は引用・採用時の A に分類していますが、この記事を含む M5 の観測は未実施のままです。P 件数だけを未実施バッチの全作業量と見なさないでください。

| 区分 | 2026-07 | 2026-08 | 2026-09 | 合計 |
| --- | --- | --- | --- | --- |
| P | 10 | 0 | 0 | 10 |
| C | 33 | 52 | 0 | 85 |
| A | 63 | 13 | 5 | 81 |
| R | 5 | 0 | 0 | 5 |
| U | 4 | 1 | 0 | 5 |
| 合計 | 115 | 66 | 5 | 186 |

## 未実施バッチと確認対象

以下は実施計画の追跡です。7 月・8 月メモに書かれた制度・製品・期日の記述を、2026-09-10 の確認済み事実として扱っていません。実際の観測では、記事本文だけでなく起点メモの未確認事項・全表も確認します。

| バッチ | 未実施の対象 | 起点メモ・次の作業 | 本棚卸しとの関係 |
| --- | --- | --- | --- |
| M4 | 業界規制 | `research/supplementary/regulations.md`。資料の所在・現行版・一次未確認の記載を確認します。 | T164〜T166。M1 の一般規制との重複は、8 月の記録を読んでから差分を確認します。 |
| M4 | 来歴・なりすまし・安全枠組み・著作権 | `research/trust/provenance.md`、`frontier-safety.md`、`copyright.md`。標準・機関・注意喚起・資料の版と所在を観測します。 | T098/T101 の採用時確認、T156 の案件判断は残します。観測は T100/T155 に限りません。 |
| M4 | AI 規格・認証 | `research/ecosystem/standards.md`。規格・認定制度・機関の現行情報を確認します。 | T095 の定点観測と T094 の取得時確認を分けます。 |
| M5 | 輸出規制・環境開示 | `research/strategy/geopolitics.md`、`green-ai.md`。当局・規則・リンク・開示資料・算定サービスの変更を確認します。 | T158/T159 の未確認と、T080〜T082/T157 の案件別確認を区別します。 |
| M5 | RPA/自動化 | `research/domain-agents/rpa.md`。公式製品情報の提供形態・統制機能を観測します。 | T184。 |
| M5 | フィジカル AI | `research/supplementary/physical-ai.md`。提供形態・モデル世代・評価基盤を観測します。 | T005。派生記事 `world-models-overview` の T014 にも差分を照合します。 |
| M6 | 先端応用 | `research/domain-agents/emerging.md`。計画上の観測範囲と、9 月に改訂した記事の確認範囲を同期してから次回の対象を定めます。 | 本文は研究事例・仕様の確認範囲へ変更され、対応 TODO はありません。これを市場全体の動向観測完了とは扱いません。 |

M1〜M3 の継続確認では、比較表の未確認行、取得に失敗した公式本文、提供ステータスや価格の未再確認部分が残っています。これらは「当該バッチを一度実施した」ことと矛盾しません。記事別表の C を次回の対象に引き継ぎ、確認できた範囲と取得できなかった範囲を記録します。

## 記事別の分類理由と次の条件

「M1 関連」等は、主対象の記事・起点メモの観測から差分を照合する関連項目です。過去にその記事を全件確認したという認定ではありません。「系統外」は ROADMAP の 16 系統に主対象として割り当てられていない項目で、不要という意味ではありません。

| 記事 | TODO ID・行・区分 | バッチとの関係 | 分類理由・次の実施条件 |
| --- | --- | --- | --- |
| [00/learning-roadmap](../docs/00-overview/learning-roadmap.md) | T001(L127, C) | 系統外 | 公式学習ガイドと参照先の変更を記事改訂時に確認します。 |
| [01/agent-loop](../docs/01-concepts/agent-loop.md) | T002(L157, C) | 系統外 | SDK ごとのループ停止条件・既定値の変更を照合します。 |
| [01/computer-use-and-multimodal-agents](../docs/01-concepts/computer-use-and-multimodal-agents.md) | T003(L109, C) | 系統外 | computer use API の対応環境と隔離推奨の変更を追います。 |
| [01/memory-and-state](../docs/01-concepts/memory-and-state.md) | T004(L116, C) | M1 関連 | モデル系統の観測結果からコンテキスト上限とキャッシュ仕様を照合します。 |
| [01/physical-ai-overview](../docs/01-concepts/physical-ai-overview.md) | T005(L120, P) | M5 | フィジカル AI の提供形態・モデル世代・評価基盤の四半期観測が未実施です。 |
| [01/planning-and-reasoning](../docs/01-concepts/planning-and-reasoning.md) | T006(L59, C), T007(L100, C) | M1 関連 | 推論制御・料金の重複掲出です。モデル別ガイドの観測時に両箇所を照合します。 |
| [01/rag-vs-agent](../docs/01-concepts/rag-vs-agent.md) | T008(L111, A) | 系統外 | 検索要件と候補モデルが決まった時点でベンチマークと公式仕様を比較します。 |
| [01/single-vs-multi-agent](../docs/01-concepts/single-vs-multi-agent.md) | T009(L116, C) | M3 関連 | A2A の仕様・採用動向を連携プロトコルの観測から照合します。 |
| [01/tool-use](../docs/01-concepts/tool-use.md) | T010(L87, C), T011(L130, C), T012(L132, C) | M3 関連 / 系統外 | MCP 対応状況の重複掲出です。仕様と実装の差分を両箇所へ同期します。 各社のツール API と並列呼び出しの仕様差を継続確認します。 |
| [01/what-is-an-ai-agent](../docs/01-concepts/what-is-an-ai-agent.md) | T013(L139, C) | 系統外 | 各社の Agent 分類と記事の独自整理との齟齬を記事改訂時に確認します。 |
| [01/world-models-overview](../docs/01-concepts/world-models-overview.md) | T014(L97, C) | M5 関連 | 世界モデルは M5 の起点メモを共有する派生記事として差分を照合します。 |
| [02/async-and-durable-agents](../docs/02-architecture/async-and-durable-agents.md) | T015(L170, A) | 系統外 | 耐久実行エンジンの採用候補が決まってから API・容量上限を確認します。 |
| [02/context-engineering](../docs/02-architecture/context-engineering.md) | T016(L105, C) | M1 関連 | モデル系統の観測からキャッシュ境界・期間・割引の説明を照合します。 |
| [02/multi-tenancy-and-isolation](../docs/02-architecture/multi-tenancy-and-isolation.md) | T017(L166, A) | 系統外 | 利用組織・モデル・契約を選定後、実アカウントの制限値を確認します。 |
| [02/orchestration-patterns](../docs/02-architecture/orchestration-patterns.md) | T018(L74, C), T019(L114, C) | M3 関連 | A2A 仕様・採用状況の重複掲出です。連携プロトコルの観測と同期します。 |
| [03/agent-interop-protocols](../docs/03-implementation/agent-interop-protocols.md) | T020(L138, C) | M3 | 8 月実施済み系統の継続観測です。仕様・標準化・認証の次回差分を追います。 |
| [03/agent-prompt-design](../docs/03-implementation/agent-prompt-design.md) | T021(L106, C) | M1 関連 | モデル移行時の指示追従特性を特化ガイドの観測と照合します。 |
| [03/claude-prompting](../docs/03-implementation/claude-prompting.md) | T022(L192, C), T023(L194, C), T024(L198, C) | M1 | 未確定の停止指定とモデル別 system 対応を公式資料で継続確認します。 四半期の特化ガイド観測を継続します。8 月の実施で TODO は消えません。 |
| [03/code-execution-sandboxes](../docs/03-implementation/code-execution-sandboxes.md) | T025(L145, A) | 系統外 | 隔離要件と候補サービスを選定してから機能・起動時間を確認します。 |
| [03/computer-use-implementation](../docs/03-implementation/computer-use-implementation.md) | T026(L139, C) | 系統外 | computer use の操作・隔離仕様を追い、概念記事 T003 と照合します。 |
| [03/cross-model-prompting](../docs/03-implementation/cross-model-prompting.md) | T027(L132, C) | M1 | 3 社の特化ガイドを再確認した後、横並び表を同期します。 |
| [03/embeddings](../docs/03-implementation/embeddings.md) | T028(L151, A) | 系統外 | 言語・ドメイン・検索要件を決めて埋め込み候補を比較します。 |
| [03/fine-tuning-and-distillation](../docs/03-implementation/fine-tuning-and-distillation.md) | T029(L146, A) | M2 | 提供状況は M2 の対象でも、実利用する FT・蒸留モデルの採用時確認を残します。 |
| [03/framework-selection](../docs/03-implementation/framework-selection.md) | T030(L55, A), T031(L103, A) | 系統外 | フレームワーク候補を決め、8 軸で比較します。重複掲出です。 |
| [03/gemini-prompting](../docs/03-implementation/gemini-prompting.md) | T032(L172, A), T033(L174, C), T034(L178, C) | M1 | 利用 API の実装時に prefill・出力フィールドの正確な綴りを照合します。 未確定パラメータの扱いと四半期の Google ガイド観測を継続します。 |
| [03/graph-rag-and-knowledge-graphs](../docs/03-implementation/graph-rag-and-knowledge-graphs.md) | T035(L130, A) | 系統外 | GraphRAG 導入時に実装・名寄せ・コミュニティ検出の候補を比較します。 |
| [03/llm-landscape](../docs/03-implementation/llm-landscape.md) | T036(L73, A), T037(L165, C), T038(L167, C) | M1 | 採用する API モデル ID ごとに提供・終了予定・実行モード・価格を再確認します。 9 月の OpenAI 部分更新と、他社を含むカタログ全体の観測を分けます。 |
| [03/local-and-on-device-llm](../docs/03-implementation/local-and-on-device-llm.md) | T039(L64, A), T040(L127, A) | M3 | ローカル実行の候補と環境を決め、形式・モデル・API 互換性を確認します。 |
| [03/long-term-memory-implementation](../docs/03-implementation/long-term-memory-implementation.md) | T041(L138, A) | 系統外 | 記憶機能の採用候補を決めて API・フレームワーク仕様を確認します。 |
| [03/mcp-and-tool-protocols](../docs/03-implementation/mcp-and-tool-protocols.md) | T042(L42, C), T043(L98, C), T044(L100, C) | M3 関連 | MCP の版・輸送・認可と A2A の役割分担を M3 の差分から照合します。 |
| [03/model-selection](../docs/03-implementation/model-selection.md) | T045(L153, C), T046(L155, C) | M1 | モデル具体例の世代交代と料金傾向を次回のモデル観測で再確認します。 |
| [03/open-source-ai-ecosystem](../docs/03-implementation/open-source-ai-ecosystem.md) | T047(L140, A), T048(L144, C) | M3 | 利用モデルの世代・規模・用途に対応した現行ライセンスを採用時に確認します。 ライセンス・規約・ガバナンス・保守状態の四半期観測を継続します。 |
| [03/openai-prompting](../docs/03-implementation/openai-prompting.md) | T049(L169, A), T050(L171, C), T051(L175, C) | M1 | 停止指定・prefill が必要な API 実装で、対応を公式リファレンスに照合します。 要約経由で残った未確定原文と四半期の OpenAI ガイド観測を継続します。 |
| [03/prompt-engineering-fundamentals](../docs/03-implementation/prompt-engineering-fundamentals.md) | T052(L119, A) | M1 関連 | 利用モデルの世代を決めて明示的な推論技法の有効性を確認します。 |
| [03/prompt-engineering-patterns](../docs/03-implementation/prompt-engineering-patterns.md) | T053(L134, A) | M1 関連 | モデル採用前に区切り・prefill・停止指定の対応を確認します。 |
| [03/prompt-management](../docs/03-implementation/prompt-management.md) | T054(L126, A) | 系統外 | レジストリ・実験管理ツールの選定時に機能を確認します。 |
| [03/prompt-optimization](../docs/03-implementation/prompt-optimization.md) | T055(L138, A) | 系統外 | プロンプト最適化の導入候補を決め、評価との接続方式を確認します。 |
| [03/rag-implementation-patterns](../docs/03-implementation/rag-implementation-patterns.md) | T056(L180, A) | 系統外 | RAG の要件・候補モデル・DB を選定するときに比較します。 |
| [03/slm-strategy](../docs/03-implementation/slm-strategy.md) | T057(L125, A) | M1 関連 | 対象業務の必要能力を決め、SLM 候補の性能を実測します。 |
| [03/streaming-and-agent-ux](../docs/03-implementation/streaming-and-agent-ux.md) | T058(L96, A) | 系統外 | 対象 API のストリーミング実装時にイベントの種類を照合します。 |
| [03/structured-output](../docs/03-implementation/structured-output.md) | T059(L42, C), T060(L111, C) | 系統外 | 構造化出力の対応モデル・スキーマ制約の重複掲出です。仕様変更時に同期します。 |
| [03/synthetic-data-for-training](../docs/03-implementation/synthetic-data-for-training.md) | T061(L130, A) | M1/M2 関連 | 教師モデル・合成データの用途を決め、現行規約を契約条件と照合します。 |
| [03/tool-definition-design](../docs/03-implementation/tool-definition-design.md) | T062(L116, C) | 系統外 | strict モードと並列制御の固有オプションを仕様変更時に確認します。 |
| [03/vector-databases](../docs/03-implementation/vector-databases.md) | T063(L131, A) | 系統外 | ベクトル DB 選定時にフィルタ・検索・量子化の対応を比較します。 |
| [03/voice-agents](../docs/03-implementation/voice-agents.md) | T064(L139, A) | M2 | 音声 API 系統の観測後も、選定する API・電話統合・上限を採用時に確認します。 |
| [04/agent-benchmarks-landscape](../docs/04-evaluation/agent-benchmarks-landscape.md) | T065(L146, C) | M2 | ベンチマーク系統の継続観測です。8 月に未確認の行・一次数値も引き継ぎます。 |
| [04/agent-evaluation-basics](../docs/04-evaluation/agent-evaluation-basics.md) | T066(L136, A) | 系統外 | 評価ツールの選定時に必要な支援機能を比較します。 |
| [04/fairness-and-bias-evaluation](../docs/04-evaluation/fairness-and-bias-evaluation.md) | T067(L121, A) | M1 関連 | 用途・地域を決めて公平性手法と適用規制を照合します。 |
| [04/japanese-quality-evaluation](../docs/04-evaluation/japanese-quality-evaluation.md) | T068(L120, A) | M2 関連 | 日本語評価の用途を決め、ベンチマークと方法論を選定時に確認します。 |
| [04/llm-as-a-judge](../docs/04-evaluation/llm-as-a-judge.md) | T069(L110, A) | M1 関連 | judge モデルの導入・更新時に対象データと人手ラベルで較正します。 |
| [04/regression-testing](../docs/04-evaluation/regression-testing.md) | T070(L113, A) | 系統外 | API・プランと CI 並列数を決めてレート制限・再試行を確認します。 |
| [04/trajectory-evaluation](../docs/04-evaluation/trajectory-evaluation.md) | T071(L102, A) | 系統外 | トレース基盤導入時に記録形式・semantic conventions の対応を確認します。 |
| [05/ai-slo-design](../docs/05-operations/ai-slo-design.md) | T072(L122, A) | 系統外 | 運用する judge・SLI・対象データを決め、更新時・定期に較正を測り直します。 |
| [05/batch-processing](../docs/05-operations/batch-processing.md) | T073(L40, A), T074(L114, A) | 系統外 | 採用するバッチ API の割引・時間・件数・サイズ・モデルを確認します。重複掲出です。 |
| [05/cost-management](../docs/05-operations/cost-management.md) | T075(L59, A), T076(L111, A) | M1 関連 | 費用試算の対象モデル・利用量を決めて公式料金を確認します。重複掲出です。 |
| [05/deployment-and-scaling](../docs/05-operations/deployment-and-scaling.md) | T077(L140, A) | 系統外 | スケーリング設計時に実際のプロバイダー・ティアの制限を確認します。 |
| [05/gpu-and-hardware-basics](../docs/05-operations/gpu-and-hardware-basics.md) | T078(L87, A), T079(L123, A) | 系統外 | ハードウェア選定時に容量・世代・価格を現物仕様で比較します。重複掲出です。 |
| [05/green-ai](../docs/05-operations/green-ai.md) | T080(L144, A), T081(L146, A), T082(L148, A) | M5 | M5 は未実施ですが、数値の引用時には対象年度の環境開示を別途確認します。 カーボン算定ツールを利用する時点で現行サービス・移行先を確認します。 企業・地域・開示制度を特定して適用範囲を法務等と確認します。 |
| [05/incident-response](../docs/05-operations/incident-response.md) | T083(L129, A) | 系統外 | 運用設計時に利用契約の SLA と障害時の移行先を確認します。 |
| [05/latency-optimization](../docs/05-operations/latency-optimization.md) | T084(L104, A) | 系統外 | 並列ツール呼び出しを実装する API・モデルの仕様を照合します。 |
| [05/llm-gateway](../docs/05-operations/llm-gateway.md) | T085(L57, A), T086(L132, A) | M3 | ゲートウェイの採用候補を決め、機能・ライセンスを確認します。重複掲出です。 |
| [05/observability-and-tracing](../docs/05-operations/observability-and-tracing.md) | T087(L82, A), T088(L125, A) | 系統外 | 観測基盤導入時に semantic conventions の安定度・製品対応を確認します。 |
| [05/self-hosted-inference](../docs/05-operations/self-hosted-inference.md) | T089(L56, A), T090(L138, A) | M3 | 推論エンジン・モデルの採用時に機能・ライセンスを確認します。重複掲出です。 |
| [05/versioning-and-model-updates](../docs/05-operations/versioning-and-model-updates.md) | T091(L55, C), T092(L115, C) | M1 関連 | モデルの版管理・廃止ポリシー変更をモデル系統の差分から照合します。 |
| [06/agent-identity-and-auth](../docs/06-security/agent-identity-and-auth.md) | T093(L184, C) | M3 | 8 月に残った Connectors の OAuth 認可ガイド本文を継続確認します。 |
| [06/ai-standards-and-certification](../docs/06-security/ai-standards-and-certification.md) | T094(L141, A), T095(L145, P) | M4 | 認証取得を検討する組織・規格を決めて現行条件を確認します。 規格・認証制度の四半期観測が未実施です。版・番号・機関を一次資料で追います。 |
| [06/compliance-and-governance](../docs/06-security/compliance-and-governance.md) | T096(L162, C), T097(L164, C) | M1 | 8 月実施後も未確定・一次未確認だった法令・政策文書を継続確認します。 |
| [06/content-provenance-and-detection](../docs/06-security/content-provenance-and-detection.md) | T098(L128, A) | M4 | M4 の来歴観測とは別に、標準・検出ツール・地域を選んで実装条件を確認します。 |
| [06/data-exfiltration](../docs/06-security/data-exfiltration.md) | T099(L109, A) | 系統外 | 契約する LLM・監視 SaaS のデータ保持・学習利用条件を導入時に確認します。 |
| [06/deepfake-and-impersonation-defense](../docs/06-security/deepfake-and-impersonation-defense.md) | T100(L118, P) | M4 | なりすまし分野の公的注意喚起・手口の観測が未実施です。 |
| [06/frontier-safety-overview](../docs/06-security/frontier-safety-overview.md) | T101(L127, A) | M4 | M4 の安全枠組み観測とは別に、採用モデル・提供者の現行版を確認します。 |
| [06/guardrails](../docs/06-security/guardrails.md) | T102(L106, A) | 系統外 | ガードレールの導入候補を決めて担う防御層・機能を比較します。 |
| [06/prompt-injection](../docs/06-security/prompt-injection.md) | T103(L72, A), T104(L109, A) | M4 関連 | 利用モデルの世代を選び、安全性評価・システムカードを照合します。 |
| [06/red-teaming-agents](../docs/06-security/red-teaming-agents.md) | T105(L138, A) | 系統外 | レッドチーミング導入時に対象攻撃・ツール・データセットを選定します。 |
| [06/threat-model-overview](../docs/06-security/threat-model-overview.md) | T106(L119, A) | 系統外 | OWASP をレビュー基準に採用する際に版・分類を確認します。 |
| [06/tool-permissions-and-sandboxing](../docs/06-security/tool-permissions-and-sandboxing.md) | T107(L119, A) | M3 関連 | MCP の認可・完全性検証を実装する版の公式仕様で照合します。 |
| [08/claude-code-in-practice](../docs/08-coding-agents/claude-code-in-practice.md) | T108(L130, C), T109(L132, C) | M2 | 機能ステータス・コスト・上限を観測し、未再確認の既定値を追います。 |
| [08/claude-code](../docs/08-coding-agents/claude-code.md) | T110(L141, C), T111(L143, C) | M2 | 提供ステータス・利用枠を観測します。8 月確認を 9 月確認に読み替えません。 |
| [08/coding-agent-automation-patterns](../docs/08-coding-agents/coding-agent-automation-patterns.md) | T112(L127, C) | M2 | 08 章の自動化パターンと公式機能名を次回観測で同期します。 |
| [08/coding-agent-cost-optimization](../docs/08-coding-agents/coding-agent-cost-optimization.md) | T113(L115, C) | M2 | 08 章の課金モデルの具体対応を次回の公式料金観測で確認します。 |
| [08/coding-agent-evaluation](../docs/08-coding-agents/coding-agent-evaluation.md) | T114(L46, A), T115(L108, C) | M2 | スコア引用時に対象版・評価条件・一次数値を確認します。 ベンチマーク一覧・ベンダーの公表条件を次回の評価系観測で照合します。 |
| [08/coding-agent-rules-and-config](../docs/08-coding-agents/coding-agent-rules-and-config.md) | T116(L46, C), T117(L128, C) | M2 | ルール形式・階層の仕様差と本文の対応表を継続観測で照合します。 |
| [08/coding-agent-security](../docs/08-coding-agents/coding-agent-security.md) | T118(L128, U) | M2 候補 | 比較記事は存在します。執筆時という条件を、比較表への同期確認か継続観測へ振り分けます。 |
| [08/coding-agent-selection](../docs/08-coding-agents/coding-agent-selection.md) | T119(L102, U) | M2 候補 | 比較表 A/C の完成待ちが残っています。既存表と本文を照合して完了条件を決めます。 |
| [08/coding-agent-team-adoption](../docs/08-coding-agents/coding-agent-team-adoption.md) | T120(L120, U) | M2 候補 | 比較記事執筆時という条件を、現行表との同期と提供プランの継続確認へ振り分けます。 |
| [08/coding-agents-comparison](../docs/08-coding-agents/coding-agents-comparison.md) | T121(L153, C), T122(L155, C), T123(L157, C) | M2 | 比較表に未確認行が残ります。8 月の部分確認と全表更新を区別して追います。 |
| [08/coding-agents-overview](../docs/08-coding-agents/coding-agents-overview.md) | T124(L123, U) | M2 候補 | ツール別記事の執筆待ちが残ります。既存記事との同期か次回観測かを振り分けます。 |
| [08/cursor](../docs/08-coding-agents/cursor.md) | T125(L134, C), T126(L136, C), T127(L138, C) | M2 | プラン・既定モード・例外・SDK・課金を次回観測し、一次未確認分を追います。 |
| [08/devin](../docs/08-coding-agents/devin.md) | T128(L137, C), T129(L139, C), T130(L141, C) | M2 | Devin の料金・提供・環境対応を追い、取得制限のあった参照先も再確認します。 |
| [08/gemini-cli-and-code-assist](../docs/08-coding-agents/gemini-cli-and-code-assist.md) | T131(L139, C), T132(L141, C), T133(L143, C), T134(L145, C) | M2 | Google 系開発ツールの提供・終了・規約・チーム対応の次回差分を確認します。 |
| [08/github-copilot-in-practice](../docs/08-coding-agents/github-copilot-in-practice.md) | T135(L124, C), T136(L126, C) | M2 | Copilot の料金・preview・保持期間・上限の未確認分を追います。 |
| [08/github-copilot](../docs/08-coding-agents/github-copilot.md) | T137(L140, C), T138(L142, C), T139(L144, C) | M2 | Copilot の利用枠・機能・除外仕様の次回差分と未再確認部分を追います。 |
| [08/open-source-coding-agents](../docs/08-coding-agents/open-source-coding-agents.md) | T140(L101, C), T141(L103, C) | M2 | OSS の活動・ガバナンスと未取得のサポート方針を継続確認します。 |
| [08/openai-codex-in-practice](../docs/08-coding-agents/openai-codex-in-practice.md) | T142(L140, C), T143(L142, C) | M2 | Codex の料金・レートカードの未取得本文を継続確認します。 |
| [08/openai-codex](../docs/08-coding-agents/openai-codex.md) | T144(L150, A), T145(L152, C), T146(L154, C), T147(L156, C) | M2 | 保存設定・定期実行で採用するモデル ID と認証方式を点検します。 9 月のモデル節更新と分け、未再検証の料金・製品・利用条件を追います。 |
| [08/se-enterprise-constraints](../docs/08-coding-agents/se-enterprise-constraints.md) | T148(L143, A) | M2 | 閉域・ZDR・残留地域など導入条件とプランを決めて公式仕様を確認します。 |
| [08/se-legacy-code-analysis](../docs/08-coding-agents/se-legacy-code-analysis.md) | T149(L81, A), T150(L124, A) | M2 | 対象言語・実コードを決め、対応仕様と読解・変換精度を実測します。 |
| [08/windsurf](../docs/08-coding-agents/windsurf.md) | T151(L139, C), T152(L141, C), T153(L143, C), T154(L145, C) | M2 | Windsurf の提供終了・料金統合・製品存続・未取得規約を継続確認します。 |
| [09/ai-copyright-and-ip-map](../docs/09-business/ai-copyright-and-ip-map.md) | T155(L183, P), T156(L185, A) | M4 | 著作権・知財の資料名・版・所在の四半期観測が未実施です。 案件の用途・地域・権利関係を決めて法務等に適法性・帰属を確認します。 |
| [09/ai-geopolitics-map](../docs/09-business/ai-geopolitics-map.md) | T157(L183, A), T158(L185, P), T159(L189, P) | M5 | 取引・技術・国・規則を特定して現行版と対象を確認します。 未取得の CAC 一次本文を引き継ぎます。到達困難なら現地法務等を通じた確認が必要です。 所管当局・リンク・規則リストの四半期観測が未実施です。 |
| [09/ai-industry-map](../docs/09-business/ai-industry-map.md) | T160(L127, C), T161(L131, C) | M3 | 代表プレイヤー・垂直統合・政策調達の次回差分を観測します。 |
| [09/ai-pricing-and-packaging](../docs/09-business/ai-pricing-and-packaging.md) | T162(L115, C) | M1 関連 | 原価の価格確認に連動し、課金モデルの類型の変更要否を四半期に見直します。 |
| [09/ai-usage-policy](../docs/09-business/ai-usage-policy.md) | T163(L113, C) | M1/M4 関連 | 社内ルールの前提を規制記事の観測から照合します。個別案件の判断とは分けます。 |
| [09/industry-regulations-map](../docs/09-business/industry-regulations-map.md) | T164(L169, P), T165(L171, P), T166(L175, P) | M4 | 業界規制の所在・最終化・全表の版数観測が未実施です。M1 の記録との重複も照合します。 |
| [10/multimodal-models](../docs/10-llm-foundations/multimodal-models.md) | T167(L91, A), T168(L127, A) | M1 関連 | 利用するマルチモーダルモデルを決め、入出力・換算・課金・実装を照合します。 |
| [10/reasoning-models](../docs/10-llm-foundations/reasoning-models.md) | T169(L131, A) | M1 関連 | 推論モデル選定時に思考制御・可視性・課金の個別仕様を確認します。 |
| [11/alignment-theory](../docs/11-llm-internals/alignment-theory.md) | T170(L156, R) | 系統外 | 進展中のアラインメント研究を論文・記事の改訂時に確認します。 |
| [11/attention-variants-and-long-context](../docs/11-llm-internals/attention-variants-and-long-context.md) | T171(L156, A) | 系統外 | 採用するモデルの注意方式と対応長を公式仕様で照合します。 |
| [11/in-context-learning-and-memorization](../docs/11-llm-internals/in-context-learning-and-memorization.md) | T172(L130, R) | 系統外 | 文脈内学習の競合仮説は未決着なので一次研究の進展を追います。 |
| [11/interpretability-basics](../docs/11-llm-internals/interpretability-basics.md) | T173(L139, R), T174(L143, U) | 系統外 | 解釈可能性の手法・成果・限界を一次研究で継続確認します。 四半期確認を明記していますが 16 系統に独立した担当がありません。安全系統への追加か研究の別枠かを次回計画で決めます。 |
| [11/pretraining-and-scaling-laws](../docs/11-llm-internals/pretraining-and-scaling-laws.md) | T175(L153, R) | 系統外 | 推論時計算・スケーリングの新手法・指数を一次研究で追います。 |
| [12/document-ai](../docs/12-multimodal/document-ai.md) | T176(L54, A), T177(L119, A) | 系統外 | 対象文書と候補 OCR・VLM を決め、精度を実測します。重複掲出です。 |
| [12/image-generation-integration](../docs/12-multimodal/image-generation-integration.md) | T178(L131, A) | M1 | 画像モデル・利用地域・用途を決めて権利・来歴・商用条件を確認します。 |
| [12/realtime-multimodal-agents](../docs/12-multimodal/realtime-multimodal-agents.md) | T179(L141, A) | M1 | リアルタイム API の候補を決め、映像・時間・料金の制約を確認します。 |
| [12/speech-synthesis-and-voice-design](../docs/12-multimodal/speech-synthesis-and-voice-design.md) | T180(L131, A) | M1 | 日本語ボイス・用途を選び、仕様・同意要件・発音制御を実機確認します。 |
| [12/video-ai-overview](../docs/12-multimodal/video-ai-overview.md) | T181(L132, A) | M1 | 動画モデル・地域・用途を決めて生成上限・課金・権利を照合します。 |
| [13/hr-and-recruitment-ai](../docs/13-domain-agents/hr-and-recruitment-ai.md) | T182(L133, A) | M4 関連 | 導入地域・採用用途を決め、法務と適用範囲を確認します。9 月確認は確認先の調査です。 |
| [13/legal-review-agents](../docs/13-domain-agents/legal-review-agents.md) | T183(L127, A) | M4 関連 | 法務支援の用途・業際規制の適用を一次情報・専門家と照合します。 |
| [13/rpa-and-agents](../docs/13-domain-agents/rpa-and-agents.md) | T184(L145, P) | M5 | RPA/自動化ベンダーの Agent 機能・提供形態の観測が未実施です。 |
| [15/ai-career-strategy](../docs/15-human-ai/ai-career-strategy.md) | T185(L122, A) | 系統外 | 職種・地域・進路など意思決定の条件を決めて一次統計を確認します。 |
| [15/automation-bias-and-deskilling](../docs/15-human-ai/automation-bias-and-deskilling.md) | T186(L127, R) | 系統外 | LLM 協働のバイアス・スキル退化の最新実証研究を一次資料で追います。 |

## 要振り分けの引き継ぎ

- T118/T119/T120/T124: 08 章の比較表・ツール記事が存在するため、執筆完了待ちという条件をそのまま次回まで持ち越さず、M2 の次回計画で現物との同期確認に割り当てます。同期済みと判断できた項目だけを解消し、変化し続ける仕様は確認先と次回条件を残します。本棚卸しでは内容の再照合をしていません。
- T174: 解釈可能性の記事は四半期確認を求めていますが、独立した観測系統が未定です。次回計画で、M4 の安全関連へ関連項目として加えるか、継続研究の別枠として担当・頻度を定めるかを決めます。研究内容の再検証前に日付は更新しません。

## ROADMAP・計画への同期結果

[ROADMAP の定期メンテナンス節](../ROADMAP.md#定期メンテナンスフェーズ完了後も継続)には、本記録への参照、186 件・121 記事の分類、次の確認条件の追跡結果を反映済みです。M4〜M5 と M6 の系統全体の観測が未実施であることも併記しています。

[メンテナンス計画](../MAINTENANCE-2026Q3-PLAN.md)の冒頭と[進捗表の M6](../MAINTENANCE-2026Q3-PLAN.md#進捗表)にも、サンプル検査と TODO の分類・確認条件の追跡を実施した範囲を反映済みです。M6 は「一部実施」であり、先端応用の定点観測と外部仕様の全件再確認は未完了のままです。

S03 の完了範囲は、未実施の定点観測、継続的な仕様確認、採用・実装時確認、継続的な研究確認、要振り分けを区別した追跡整備です。全 16 系統の最新化や、全 TODO の解消を意味しません。計画の完了条件「7 月残が実装選定時確認型のみ」は未達であり、残る P/C/R/U の分類や確認月を形式的に変更して達成扱いにはしません。先端応用は記事の確認範囲が変わったため、次回計画で起点メモと観測対象を同期します。

## 検証と範囲

- 保存 JSON の構造、各項目の `file` / `line` / `month` / `text`、186 件すべての分類と ID の一意性、月別・区分別の総数を確認しました。
- 記事別表は 121 記事を網羅し、各行の TODO ID は JSON のファイル・行番号と対応しています。
- Markdown lint と相対リンク検査で本記録の書式・参照先を確認しました。
- 本棚卸しでは外部ページの全件調査、採用案件の適合判断、P/C/R/U の確認作業そのものは実施していません。未実施の内容は上表の担当バッチと条件に引き継ぎます。
