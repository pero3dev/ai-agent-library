# データ取り扱い・学習利用ポリシー横断インデックス(C-R10)

- **調査日**: 2026-07-05(各ツール別調査メモ C-R1〜C-R8 からの集約)
- **用途**: 比較記事 表 B と選定チェックの根拠。詳細な出典・確度は各ツール別メモの §9 を参照
- **注意**: 「学習利用の既定」は 2026 年に複数ベンダーが変更しており、本表は 2026-07-05 時点のスナップショット

| ツール | 学習利用の既定 | オプトアウト等の条件 | 主要文書 |
| --- | --- | --- | --- |
| Claude Code | Consumer(Free/Pro/Max): ユーザー設定オンで学習利用(保持 5 年 / オフで 30 日)。Commercial(Team/Enterprise/API): 不使用(保持 30 日、Enterprise は ZDR 個別適用可) | claude.ai の Data Privacy 設定 | <https://code.claude.com/docs/en/data-usage> |
| OpenAI Codex | 個人プラン: ChatGPT のデータ設定に従い学習利用されうる + Codex 独自の環境学習設定。Business / Enterprise / Edu / API: 不使用(Enterprise は ZDR 対応) | プライバシーポータルの「do not train」設定 | <https://help.openai.com/en/articles/5722486>(2026-07-05 時点 403、要ブラウザ確認) |
| Gemini CLI / Code Assist | Code Assist ライセンス経由: 不使用(CDPA 準拠を公式明記)。無料 API キー経由: Gemini API 規約に従う(未確認) | — | <https://docs.cloud.google.com/gemini/docs/discover/data-governance> |
| Jules | プライベートリポジトリで学習不使用(FAQ 明記)。無料 / 有料の差は未確認 | — | <https://jules.google/docs/faq> |
| GitHub Copilot | Free / Pro / Pro+: **既定で学習利用**(2026-04-24 発効、オプトアウト方式)。Business / Enterprise: 契約で禁止 | Copilot settings の Privacy 配下 | <https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/> |
| Cursor | Privacy Mode 無効時: 学習利用と公式明記。有効時: 不使用 + モデルプロバイダーと ZDR(例外モデルあり)。Enterprise: Privacy Mode 既定オン + 強制可。Cloud Agents のみコード保存が必要 | Privacy Mode 設定 | <https://cursor.com/data-use> |
| Windsurf(Devin Desktop) | 個人: Autocomplete 既定利用(オプトアウト可)、Chat はオプトアウトすると機能不可(個人規約 2026-04-14 版)。有料: Data Controls でオプトアウト → ZDR 有効化。Enterprise: 書面同意なしに不使用 | Data Controls 設定 | <https://devin.ai/windsurf/terms-of-service-individual/> / <https://docs.devin.ai/admin/security> |
| Devin | セルフサーブ(有償含む): **既定で学習利用されうる**(オプトアウト可 → ZDR 有効化)。Enterprise: 既定不使用 | Data Controls 設定 | <https://docs.devin.ai/admin/security> |
| OSS 系 | ツール自体は学習しない(ローカル実行)。**BYOK 接続先のモデルプロバイダーのポリシーに従う** | プロバイダーごとに確認 | 各プロバイダーの規約 |

## コンプライアンス認証の参照先

| 提供元 | 参照先 |
| --- | --- |
| Anthropic | <https://trust.anthropic.com>(SOC 2 Type II・ISO 27001・ISO 42001 をヘルプセンターで確認) |
| OpenAI | Enterprise ドキュメント(AES-256・TLS 1.2+・ZDR)+ セキュリティホワイトペーパー |
| Google | CDPA・Gemini for Google Cloud データガバナンス文書 |
| GitHub | <https://copilot.github.trust.page/>(2026-07-05 時点で機械取得不可、要ブラウザ確認) |
| Anysphere(Cursor) | <https://trust.cursor.com>(SOC 2 Type II、サブプロセッサ一覧) |
| Cognition(Devin) | <https://trust.cognition.ai>(SOC 2 Type II、政府向け提供あり) |

> **TODO(要確認):** 本表の全行を四半期ごとに再確認する。特に「既定で学習利用」側に変更があったベンダー(GitHub 2026-04、Devin)と、機械取得できなかった Trust Center 系ページ(最終確認: 2026-07)
