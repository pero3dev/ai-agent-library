# データ取り扱い・学習利用ポリシー横断インデックス(C-R10)

- **調査日**: 2026-07-05(各ツール別調査メモ C-R1〜C-R8 からの集約)
- **用途**: 比較記事 表 B と選定チェックの根拠。詳細な出典・確度は各ツール別メモの §9 を参照
- **注意**: 「学習利用の既定」は 2026 年に複数ベンダーが変更しており、本表の基礎は 2026-07-05 のスナップショットです。2026-09-10 に Gemini API、Cursor、Cognition(Windsurf / Devin)の行を更新しました。他の行は記載された旧確認日の範囲です

| ツール | 学習利用の既定 | オプトアウト等の条件 | 主要文書 |
| --- | --- | --- | --- |
| Claude Code | Consumer(Free/Pro/Max): ユーザー設定オンで学習利用(保持 5 年 / オフで 30 日)。Commercial(Team/Enterprise/API): 不使用(保持 30 日、Enterprise は ZDR 個別適用可) | claude.ai の Data Privacy 設定 | <https://code.claude.com/docs/en/data-usage> |
| OpenAI Codex | 個人プラン: ChatGPT のデータ設定に従い学習利用されうる + Codex 独自の環境学習設定。Business / Enterprise / Edu / API: 不使用(Enterprise は ZDR 対応) | プライバシーポータルの「do not train」設定 | <https://help.openai.com/en/articles/5722486>(2026-07-05 時点 403・2026-08-18 も 403 継続で機械取得不能、要ブラウザ確認。反証情報なし) |
| Gemini CLI / Code Assist | Code Assist ライセンス経由: 不使用(CDPA)。Gemini API Unpaid: 改善利用・人手レビューあり得る。Paid: その目的に不使用 | EEA / スイス / 英国の無料利用にも Paid のデータ条項。Gemini API は有効な Cloud Billing に紐づく project、AI Studio は課金 project へのアクセスまたは Workspace enterprise account の条件も確認。請求額のみで分類しない | [Gemini API Terms](https://ai.google.dev/gemini-api/terms)(2026-03-23 発効、2026-09-10 確認) / [Cloud data governance](https://docs.cloud.google.com/gemini/docs/discover/data-governance)(2026-08 確認) |
| Jules | プライベートリポジトリで学習不使用(FAQ 明記)。無料 / 有料の差は未確認 | — | <https://jules.google/docs/faq> |
| GitHub Copilot | Free / Pro / Pro+ / Max: **既定で学習利用**(2026-04-24 発効、オプトアウト方式。対象が Max を含む 4 プランであることを 2026-08-18 に確認)。Business / Enterprise: 契約で禁止 | Copilot settings の Privacy 配下 | <https://github.blog/news-insights/company-news/updates-to-github-copilot-interaction-data-usage-policy/> |
| Cursor | Privacy Mode 無効時: 学習利用され得る。有効時: 学習不使用・通常 ZDR | 不正検知でフラグが立ったデータの調査保持、非 ZDR モデルの表示 / 管理者 opt-in は別条件。暗号化一時ファイルキャッシュもあり、Cloud Agents のみが保存するわけではない。BYOK も Cursor backend 経由 | [Data Use](https://cursor.com/data-use)(2026-09-03 更新、2026-09-10 確認) |
| Windsurf(Devin Desktop) | Cognition Platform Terms §3.3.1: 学習・改善利用され得る。有料 tier は opt-out 可 | Teams の opt-out は管理者のみ。モデルプロバイダー ZDR が有効になるが、§3.3.3 の安全・不正・法的保持例外あり。旧 Chat 利用不可条項を現行条件にしない。Free・個別契約の適用は未確認 | [Platform Terms](https://cognition.com/legal/platform-terms-of-service)(2026-06-30 更新、2026-09-10 確認) / [Security](https://docs.devin.ai/admin/security) |
| Devin | セルフサーブ: 学習利用され得る。有料 tier は opt-out 可。Enterprise: 個別契約・Security 文書で既定不使用 | Teams の opt-out は管理者のみ。通常のプロバイダー ZDR と安全・不正・法的保持の例外を分ける | [Platform Terms](https://cognition.com/legal/platform-terms-of-service) / [Security](https://docs.devin.ai/admin/security)(2026-09-10 確認) |
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
