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
