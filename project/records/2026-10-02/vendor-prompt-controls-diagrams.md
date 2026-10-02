# P3: Claude・OpenAI・Geminiのプロンプトと制御

## 作業契約と方針

- 既存3記事の本文を保ち、配置・例、思考と出力、ツール・履歴・更新の境界を操作できる図にする。文章や例の増量を目的にしない。
- 専用モデル・本文対応・SVG・包装・登録・MDX許可・固有検査と本記録・索引・引き継ぎを所有する。モデル一覧・数値・既定・料金・停止予定・未確認の記述は元記事の時点を保持する。
- 最新の実マージ済みmainから通常PRを提出し、前単位の公開表示後にマージする。通常PR・必要検査・必須CI・squash・既存Pagesは依頼で許可済み。任意レビュー・追加台帳・大量証跡を省き、公開後は表示確認のみ。

| 記事 | 主要論点の割当 | 保持する境界 |
| --- | --- | --- |
| Claude | XMLと例・長文の配置、adaptiveとeffort・出力・toolの分担、Fableの履歴・強制呼出し・設定更新・保持、逐語解釈と回帰 | strictな引数を呼出し強制にせず、effortを長さや品質の保証にせず、旧履歴の編集を追記にしない |
| OpenAI | developerとuserの優先関係、例の整合、推論量と出力長・schema・業務検証、検索と停止、モデル別設定、asyncのcall_id、設定更新と圧縮、退役と移行 | 未確認の4層定式化を現行の確定仕様にせず、非同期を耐久実行や取消保証、TTLを削除期限にしない |
| Gemini | systemと区切り・一貫した例、モデル／API別の思考制御、JSONと検証・sampling・tool、長文と各モダリティの参照、署名と移行 | SDKの型を全モデルでの受理にせず、例の量を品質、低温度を安全な決定性、API名を全機能互換にしない |

3記事の原文を確認した。2026-10-02に[Claude prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)、[OpenAI Prompting](https://developers.openai.com/api/docs/guides/prompting)、[Gemini prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)を参照した。部分確認を元記事全体の確認日へ広げない。

## ローカル検査

9図41段階を実装した。rootとwebsiteの`npm ci`後、rootの`npm run check`は487成功・失敗0・Windowsでの既知skip 3。websiteは601成功、固有の本文対応・状態モデルは9成功。静的出力は223ルート・230 HTMLを確認した。

Edgeで14件が成功した。3記事の1440px明色・390px暗色で全段階と選択肢、本文対応、前後移動、seek、拡大とEscのfocus復帰、例・履歴・設定更新・モデル／API照合、遅れた結果の識別、JSなしの本文とTODO、低性能PC相当の停止と印刷を確認した。PCの9図を目視し、文字と枠・配置・操作の対応を確認した。実モデル呼出し・API送信・設定更新・デプロイは行っていない。

通常PR・公開は未実施。P3〜P5は未完了。

提出baseは[PR #123](https://github.com/pero3dev/ai-agent-library/pull/123)の実squash b386b03d913cba9903c3b3bf0bb6937e589b0763。前単位の提出headとPR CI 36945981907・必須9検査・実メッセージ・ツリーを確認。文書・リンク・Markdown・差分を提出前に検査する。公開済みは93/199記事で、公開後は表示確認のみ。
