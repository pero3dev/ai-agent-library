# 全体レビュー S02 対応記録 — 基礎・実装・運用の参考資料

確認日: 2026-09-10

対象は、全体レビューで参考資料節に外部 URL がなかった追加 18 記事と、初期の指摘修正で同じ状態を解消した 3 記事の計 21 記事です。記事ごとに本文の主張と原典の対応を確認しました。20 記事に資料を追加し、1 記事は独自の学習計画として外部資料なしを維持しています。全記事で内容・適用範囲を実質的に修正したため、`last_updated` は `2026-09-10`、`status` は `published` です。

確認範囲は原論文の要旨、公式ドキュメントの該当節、文化審議会答申の本文です。API の呼び出し、モデル比較、ハードウェア性能の再実験は行っていません。論文の実験結果は対象モデル・タスクの範囲に限定し、本ライブラリの設計例と区別しました。

| 対象記事 | 分類 | 確認した一次資料・本文で支える範囲 | 修正した断定・独自整理の範囲 |
| --- | --- | --- | --- |
| [research-literacy](../docs/00-overview/research-literacy.md) | 資料追加・断定修正 | [NeurIPS Paper Checklist](https://neurips.cc/public/guides/PaperChecklist): 主張の範囲・限界・実験条件・再現性 | 一次情報を一律に最も信頼できるとする順位を修正。独立実験も測定結果の一次情報と明記。要旨・図表だけで採用判断を完了させない |
| [skill-map](../docs/00-overview/skill-map.md) | 独自整理維持・断定修正 | 外部資料なし。根拠は本ライブラリの章構成と学習課題の対応 | 「業界標準がない」という未確認の主張を削除。資格・妥当性検証済み人事評価尺度ではないと明記 |
| [agent-api-design](../docs/02-architecture/agent-api-design.md) | 資料追加・断定修正 | [RFC 9110 §15.3.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.3): 202 の意味。[AWS Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): 要求 ID・原子性・保持期間 | 通常の REST では必ず破綻するという断定を修正。ジョブ受付と成功を分離し、認証キー更新に耐える業務キーと受信側契約を追加 |
| [code-execution-sandboxes](../docs/03-implementation/code-execution-sandboxes.md) | 資料追加・断定修正 | [gVisor](https://gvisor.dev/docs/): アプリ用カーネル。[Firecracker](https://firecracker-microvm.github.io/): KVM・仮想デバイス削減。[Wasmtime Security](https://docs.wasmtime.dev/security.html): メモリ・制御フロー・ホスト機能の境界 | 執筆テンプレートを参考資料にしていた状態を解消。隔離強度の一律順位・条件なしの起動時間を削除。Wasm の入出力権限とネットワーク以外の返却経路を明記 |
| [data-preprocessing-for-llm](../docs/03-implementation/data-preprocessing-for-llm.md) | 資料追加・断定修正 | [Unstructured Partitioning](https://docs.unstructured.io/open-source/core-functionality/partitioning): 形式別抽出・PDF 処理。[AWS Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): 再試行時の副作用制御 | 冪等性と決定性を区別。版・権限・有効期間を保って重複排除し、過去時点の検索も考慮 |
| [prompt-engineering-fundamentals](../docs/03-implementation/prompt-engineering-fundamentals.md) | 資料追加・断定修正 | [Wei et al.](https://arxiv.org/abs/2201.11903): 推論ステップの例示実験。[OpenAI Reasoning best practices](https://developers.openai.com/api/docs/guides/reasoning-best-practices): 内部推論モデルへの指示 | 考察を書けば精度が上がるという保証を削除。表示用の説明と内部推論を区別 |
| [prompt-engineering-patterns](../docs/03-implementation/prompt-engineering-patterns.md) | 資料追加・断定修正 | [Lu et al.](https://arxiv.org/abs/2104.08786): 例の順序感度。[Liu et al.](https://arxiv.org/abs/2307.03172): 長文中の配置。[Huang et al.](https://arxiv.org/abs/2310.01798): 外部フィードバックなしの自己修正。[OpenAI](https://developers.openai.com/api/docs/guides/reasoning-best-practices): 推論モデルへの指示 | 最後の例が出力を決める・考察を先に強制すべきという断定を修正。区切りは認可境界ではなく、原理による説明も因果関係の証明ではないと明記 |
| [prompt-management](../docs/03-implementation/prompt-management.md) | 資料追加・断定修正 | [MLflow Prompt Registry](https://mlflow.org/docs/latest/genai/prompt-registry/): テンプレート版・可変の別名・モデル設定。[scikit-learn Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html): 調整用と最終評価用データの分離 | 外部資料がないという主張と費用・検出率の無根拠な比較を削除。実際に使用した版と設定を記録し、判定用データを分離 |
| [prompt-optimization](../docs/03-implementation/prompt-optimization.md) | 資料追加・断定修正 | [DSPy 原論文](https://arxiv.org/abs/2310.03714): 指標に合わせた最適化。[scikit-learn Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html): 候補選択と判定の分離 | 頻度だけで対策順を決めない。数十ケースで必ず過適合するという断定、事実誤りはすべてプロンプト外という分類を修正 |
| [slm-strategy](../docs/03-implementation/slm-strategy.md) | 資料追加・断定修正 | [RouteLLM](https://arxiv.org/abs/2406.18665): モデル間のルーティングを学習・評価する例 | 小型は常に安い・速い、一定領域で必ず急落するという断定を修正。二段呼び出しの費用と時間、ガードレールの危険入力通過率を評価 |
| [japanese-quality-evaluation](../docs/04-evaluation/japanese-quality-evaluation.md) | 資料追加・断定修正 | [文化審議会「敬語の指針」](https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/keigo_tosin.pdf): 第 2 章第 3 節 6、二重敬語と慣用の例外 | 二重敬語の一律禁止を修正。引用・見出しの文体例外、用途の文体規定と用法上の誤りを区別。judge は生成モデルの順位でなく対象基準で検証 |
| [batch-processing](../docs/05-operations/batch-processing.md) | 資料追加・断定修正 | [OpenAI Batch API](https://developers.openai.com/api/docs/guides/batch): `custom_id`・順序・期限切れの扱い。[AWS Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): 重複排除契約 | 処理期限を納期保証とする説明を修正。入出力の対応 ID は重複呼び出し・課金防止の保証ではないと明記 |
| [conversation-data-management](../docs/05-operations/conversation-data-management.md) | 資料追加・断定修正 | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html): 記録から除外する情報・アクセス・廃棄 | デバッグ・削除対応に会話全文の全件保存が必須という説明を修正。匿名化処理の実施だけでアクセスを緩和しない |
| [data-governance-for-ai](../docs/05-operations/data-governance-for-ai.md) | 資料追加・断定修正 | [Datasheets for Datasets](https://arxiv.org/abs/1803.09010): 目的・構成・収集方法・利用条件を文書化する提案 | すべての AI 品質が知識源だけで決まるという一般化を修正。架空ケーススタディを実証根拠に扱わない |
| [feedback-loops](../docs/05-operations/feedback-loops.md) | 資料追加・断定修正 | [Google PAIR Feedback + Control](https://pair.withgoogle.com/guidebook-v2/chapter/feedback-controls/): 明示・暗黙のシグナル、解釈、収集の説明 | 暗黙シグナルを必ず主指標にする推奨や質問頻度の確定的な効果を修正。週次・四半期は運用例と明記 |
| [gpu-and-hardware-basics](../docs/05-operations/gpu-and-hardware-basics.md) | 資料追加・断定修正 | [NVIDIA Matrix Multiplication](https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/index.html): 演算・帯域制約。[Accelerate Big Model Inference](https://huggingface.co/docs/accelerate/usage_guides/big_modeling): CPU・ディスク退避 | 単一 GPU に全量載らないと動かない・量子化すれば必ず載るという説明を修正。重みだけの算術例とピーク容量、生成段階・バッチの違いを区別 |
| [long-running-agents](../docs/05-operations/long-running-agents.md) | 資料追加・断定修正 | [Anthropic Effective harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): 外部状態からのセッション引き継ぎ。[AWS Idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): 副作用の制御 | 起動時間だけで必ず劣化するという誤読を防止。週・月の管理は独自運用例とし、新旧の並行比較で副作用を二重実行しない |
| [mlops-and-llmops](../docs/05-operations/mlops-and-llmops.md) | 資料追加・断定修正 | [Google Cloud MLOps](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning): 実験から監視までの骨格。[MLflow Prompt Registry](https://mlflow.org/docs/latest/genai/prompt-registry/): プロンプト管理を追加する例 | 従来 ML は決定的・単一指標、LLM だけ多面的という対比を修正。比較表と組織分担は代表的な設計例 |

初期指摘の修正に含めた S02 対応 3 記事は次のとおりです。

| 対象記事 | 分類 | 確認した一次資料・本文で支える範囲 | 関連する指摘と修正 |
| --- | --- | --- | --- |
| [multi-tenancy-and-isolation](../docs/02-architecture/multi-tenancy-and-isolation.md) | 資料追加・断定修正 | [OpenAI Rate limits](https://developers.openai.com/api/docs/guides/rate-limits): 組織・プロジェクト・共有モデル枠 | F08。API キーの分割と容量の物理分離を区別し、上位の共有制限とテナント間の公平性を設計 |
| [semantic-caching](../docs/05-operations/semantic-caching.md) | 資料追加・断定修正 | [Redis Semantic cache](https://redis.io/docs/latest/develop/use-cases/semantic-cache/): 類似度のしきい値・名前空間・保持期限 | F09。語順のソートを低リスクな正規化から外し、逆向きの送金例で意味の違いを示す。完全一致にも権限・文脈・知識の版を反映 |
| [privacy-enhancing-technologies](../docs/06-security/privacy-enhancing-technologies.md) | 資料追加・断定修正 | [NIST SP 800-226](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-226.pdf): DP の保証・保護単位・合成。[NIST Privacy attacks in federated learning](https://www.nist.gov/blogs/cybersecurity-insights/privacy-attacks-federated-learning): 更新・モデルからの情報漏えい | F07・S07。差分プライバシーを個人への推論の完全防止と同一視せず、連合学習・秘匿集計・出力保護の役割を分離 |

外部資料のアクセス日はすべて 2026-09-10 です。特定の採用環境における価格・上限・レイテンシ・モデル品質は、この調査では測定していません。各記事の未確認事項と採用時の確認項目を維持しています。

検証結果は、全体の修正記録 [review-remediation-2026-09-10.md](../review-remediation-2026-09-10.md) に統合します。
