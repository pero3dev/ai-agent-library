# 06-security — セキュリティ

Agent 固有の脅威と対策を扱うセクションです。従来の Web セキュリティとの差分(自然言語による攻撃、ツール実行権限、自律性のリスク)に焦点を当てます。

- **置くもの**: 脅威モデル、攻撃パターンと対策、権限設計、ガードレール、レビューチェックリスト
- **置かないもの**: 一般的な Web セキュリティの解説(外部資料へリンクする)

## 収録予定ドキュメント

ファイル名がリンクになっているものは執筆済みです(バッククォートのみの名前は計画段階)。

| ファイル | 内容 |
| --- | --- |
| [threat-model-overview.md](threat-model-overview.md) | Agent の脅威モデル概観(脅威の列挙と分類。防御層の設計は guardrails へ) |
| [prompt-injection.md](prompt-injection.md) | プロンプトインジェクション(直接・間接)と対策 |
| [tool-permissions-and-sandboxing.md](tool-permissions-and-sandboxing.md) | ツール権限設計とサンドボックス(外部 MCP サーバーの信頼、コンピュータ操作型の隔離を含む) |
| [data-exfiltration.md](data-exfiltration.md) | データ漏えい(exfiltration)経路と対策 |
| [guardrails.md](guardrails.md) | ガードレール(入力・出力・アクションの 3 層防御の設計) |
| [agent-identity-and-auth.md](agent-identity-and-auth.md) | エージェントの認証・認可(個別 ID・委任・権限の交差・帰属・資格情報 vault) |
| [red-teaming-agents.md](red-teaming-agents.md) | エージェントのレッドチーミング(演習設計・手動/自動・修正の優先順位・継続運用) |
| [compliance-and-governance.md](compliance-and-governance.md) | コンプライアンスとガバナンス(規制の地図・会話ログのデータ保護・監査・ベンダー契約) |
| [ai-standards-and-certification.md](ai-standards-and-certification.md) | AI 規格・認証の実務(規格の地図〔要求事項型/指針/任意 FW〕・認証 ≠ 安全・適合の進め方・監査・取得判断。ISO/IEC 42001 ほか・入口マップ+免責) |
| **── 発展層(信頼・新興攻撃・プライバシー技術)──** | 上記の基本(脅威 → 防御)の後に、上流(サプライチェーン)・攻撃の進化・プライバシー技術を足す(設計は `TRUST-SECURITY-PLAN.md`) |
| [ai-supply-chain-security.md](ai-supply-chain-security.md) | AI サプライチェーンセキュリティ(モデル・重み・データ・MCP・スキルを実行前に検証する受け入れプロセス) |
| [advanced-attack-patterns.md](advanced-attack-patterns.md) | 新興攻撃パターンの体系(記憶・知識源・ツール・マルチエージェント経由の注入と既存防御へのマップ) |
| [privacy-enhancing-technologies.md](privacy-enhancing-technologies.md) | プライバシー強化技術の概観(マスキング → 匿名化 → 差分プライバシー → 連合学習 → 秘密計算の見取り図) |
| [content-provenance-and-detection.md](content-provenance-and-detection.md) | 生成物の来歴と検出(C2PA/透かしの仕組みと剥がれ方・検出の限界「断定しない」・組織運用。鮮度管理型) |
| [deepfake-and-impersonation-defense.md](deepfake-and-impersonation-defense.md) | ディープフェイク・なりすまし防御(声/顔を本人確認に使わない・コールバック検証・多重化・公的注意喚起) |
| [frontier-safety-overview.md](frontier-safety-overview.md) | フロンティアセーフティの概観(能力の安全・共通 4 段構造・AISI・調達時の評価軸。鮮度管理型) |
