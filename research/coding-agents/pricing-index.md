# 料金・プラン横断インデックス(C-R9)

- **調査日**: 2026-07-05(各ツール別調査メモ C-R1〜C-R8 からの集約)
- **方針**: docs/ 本文には金額を転記しない。本メモは参照先 URL と課金構造の記録が目的(金額メモは各ツール別調査メモを参照)
- 詳細な出典・確度は各ツール別メモ(`claude-code.md` 等)の §11 を参照

| ツール | プラン名(2026-07-05 時点) | 課金単位・構造 | 料金参照先(正) |
| --- | --- | --- | --- |
| Claude Code | Pro / Max(5x・20x)/ Team(standard・premium seat)/ Enterprise + Console(API 従量) | 定額 + 使用量上限(5 時間窓 + 週次、チャット製品と共通プール)。超過は使用クレジット購入 | <https://claude.com/pricing> |
| OpenAI Codex | ChatGPT Free / Go / Plus / Pro(5x・20x)/ Business / Edu / Enterprise + API キー従量 | 5 時間ウィンドウあたりメッセージ数(プラン・モデル依存)。超過はクレジット | <https://developers.openai.com/codex/pricing> |
| Gemini CLI / Code Assist | Code Assist Standard / Enterprise(シート)、有料 API キー、Vertex AI 従量 | シート/月(月次・年次コミット)+ 日次クォータ(agent mode・CLI: Standard 1,500 / Enterprise 2,000 req/日)。個人向けは 2026-06-18 に再編(Antigravity へ移行) | <https://cloud.google.com/products/gemini/pricing> |
| Jules | Google AI プラン特典(Free / Pro / Ultra) | タスク/日(15 / 100 / 300)+ 同時実行数(3 / 15 / 60) | Google AI プランのページ(URL 要検証) |
| GitHub Copilot | Free / Student / Pro / Pro+ / Max / Business / Enterprise | シート + **GitHub AI Credits**(1 credit = $0.01、トークン量 × モデルレート。2026-06-01 に旧 premium requests 制を置換)。補完は有料プランで無制限 | <https://github.com/features/copilot/plans> |
| Cursor | Hobby / Pro / Pro+ / Ultra / Teams(Standard・Premium)/ Enterprise | シート + 含有利用枠。超過はオンデマンド従量(API 価格、明示有効化 + 支出上限)。Cloud Agents・Bugbot は従量 | <https://cursor.com/pricing> |
| Windsurf(Devin Desktop)・Devin | Free / Pro / Max / Teams(Full・Flex seat)/ Enterprise(統合体系) | 含有クォータ(Pro / Teams: 日次 + 週次、Max: 週次のみ)+ オンデマンドクレジット(繰越可)。Enterprise のみ ACU 課金(1 ACU の定義は公式に記載なし) | <https://devin.ai/pricing> |
| OSS 系(Aider / Cline / OpenHands / Goose / opencode) | ソフトウェア無料(OSS) | BYOK: 接続先モデルプロバイダーの API 従量。OpenHands は Cloud / Enterprise の商用提供あり | 各モデルプロバイダーの料金ページ |

> **TODO(要確認):** 各料金ページの再確認(四半期ごと)。特に Copilot の AI Credits 付与量(2026-04 発表から増額済みで変動が速い)、Devin のクォータ + クレジット制(Windsurf 統合直後)、Gemini 個人向けの移行先(Antigravity)の料金(最終確認: 2026-07)
