# P2: IDEとクラウド委任の製品

## 作業契約と方針

- 次単位はCursor・Windsurf（Devin Desktop）・Devinの3記事。実行場所、索引とデータの保存、第三者Agentの契約、事前承認と事後レビューを原文と並べて追える形にする。
- 原文の表・例・数値・確認日・未確認事項を保持する。図は料金の現在値・性能順位・法的適合を生成しない。所有は専用モデル・本文対応・SVG・遅延包装・登録・MDX許可・固有試験、本記録とproject索引・引き継ぎ。
- 前単位のマージ後の最新mainから通常PRを提出し、前単位の公開表示後にマージする。通常PR・必須CI・squash・既存Pagesはユーザー許可済み。サブエージェント・任意独立レビュー・追加台帳・大量証跡を省き、公開後は表示確認のみ。

| 記事 | 主要論点の割当 | 保持する境界 |
| --- | --- | --- |
| Cursor | 専用IDEと複数面・self-host、現行ローカル索引と、旧埋め込み・メタデータ・平文と暗号化一時キャッシュ・cloudのcheckout・ignore、編集と復元・Run Modes、階層規約とTeam強制・MCPとhook、Privacy Mode・BYOK経路と保持例外、起動とsubscriptions・SDK・含有枠と従量・管理と採用条件 | Privacy Mode・BYOK・自社実行だけでは外部送信が消えない。索引・一時キャッシュ・チェックアウトを別に扱う。ガードレールはハードな境界としない |
| Windsurf系 | 買収・改名・Devinファミリー・LocalとCascadeの移行時点、入口とcloud・ACPの第三者契約、ローカル／共有索引とFast Context・編集承認と不可逆な巻戻し、旧4段階と新ルール×スコープ・階層、規約・MemoriesとSkills・混在パス、隔離と組織設定・MCP／ACP・プランと換算未確認・用途 | 旧Cascadeの設定をDevin Localへ一律適用しない。第三者ACPの課金・プライバシーをDevin契約と同一視しない。ZDRを例外なしの保持ゼロにせず、契約の更新・適用日を分ける |
| Devin Cloud | 委任・製品群・モデルとFusionの公表条件、クリーンVMとBlueprints・トリガー・SCMと専用VPC・独立並列、事前索引とDeepWiki／Ask・VM探索・停止と引継ぎ・PR、教え込み5機構とCLIの差、事前／途中／事後の人の介入・現行Guardrailsと旧セッション終了・データ条件、管理者MCPと企業／組織優先・private tunnel・API／server、消費とスリープ・上限・管理とタスク適性 | コマンド単位の事前承認を図に足さない。PR保護・CI・人のレビューを維持する。顧客VPCを推論オンプレミスとせず、未定義のACUを回数や請求額へ変換しない。SWE世代の追加を旧世代の終了にしない |

2026-10-01、原文と[Cursorのデータ利用](https://cursor.com/data-use)、[Run Modes](https://cursor.com/docs/agent/security/run-modes)、[Cognitionのデータ条件](https://docs.devin.ai/admin/security)、[現行規約の学習・保持例外](https://cognition.com/legal/platform-terms-of-service)、[Cascadeの資料](https://docs.devin.ai/desktop/cascade/cascade)を参照。部分更新日と移行期の未確認事項を保持する。

## 一次資料との不一致の訂正

図の主要な境界に直結する2点だけ、共通契約の事実訂正に従って同期した。文章・具体例を増やすための改訂ではない。

- [Cursor Search](https://cursor.com/docs/agent/tools/search)を2026-10-01に確認。旧Codebase Indexingから転送され、Instant Grepは端末内で索引を構築・検索し、検索用埋め込みを保存しないと明記。旧方式の確認時点を残し、概要・仕組み・用途・チェックリスト・出典と確認日を同期。図は新旧を切り替え、推論送信・一時キャッシュ・cloud checkoutは索引と別に示す。
- [Devin AI Guardrails](https://docs.devin.ai/enterprise/features/ai-guardrails)を2026-10-01に確認。現行はOffとlog_only／warn_user／block_messageで、block_messageはsessionを継続する。kill_sessionは過去の記録に残るが新規設定不可。該当箇条書き・出典と確認日を同期し、図の旧対応には現在設定不可を明示した。

どちらも既存の段落・表・リスト構造を保持。その他の提供表・旧数値・TODOを現況へ補完しない。

## 実装・検証

9図44段階を制作し、本文AST保持・許可外MDX拒否・送信と学習・cloud承認・ACP契約・現行遮断と旧終了の境界7検査が成功。

- rootとwebsiteの`npm ci`成功。共通487成功・3skip、サイト単体507成功。
- 静的ビルド223ルート・230 HTML、対象ブラウザ12検査が成功。全44段階・全選択肢の1440px明色／390px暗色、同期・前後・シーク・拡大、3記事JS無効、1280×720再生停止・印刷を確認。
- 9図をPC表示またはSVGで目視。一時キャッシュのラベルの折返しを整え、最終ビルド・12検査と該当図の再目視が成功。文書215件・リンク・Markdown・差分検査も成功。

比較表のCursor検索行・部分確認日・出典も同じ根拠で同期。比較表全体の鮮度更新と図解制作は行っていない。本文2記事と比較表の同期箇所に限り、現行の必須CIが求める通常記事manifestと最終独立記事レビューを行う。任意の図解レビュー・追加ハッシュ台帳・大量証跡は行わない。必須の候補digest以外を受入条件へ追加しない。

提出baseはPR #80の実squash daf4cde2f30d659c1475409dc562aee5cb790fd5。上記本文2記事と比較表の同期箇所だけ、必須の最終記事レビューへ不変候補を提出する。通常記事manifestへ実行結果を記録し、承認済みの最終候補で提出する。次はSEの工程マップ・要件設計・テストの3記事。P2残りとP3〜P5は未完了。

最終候補の必須記事レビューは実IDとUTC付きで承認され、manifestの候補digestと最終treeのharness-policyが成功。提出head d380979de72912f30655eadc3a4d457104a4170b、PR CI 36845576289と必須9検査が成功。[PR #81](https://github.com/pero3dev/ai-agent-library/pull/81)の実squashは59c1f5c1747eec09349b250fdc4412a4523356e9（2026-10-01T10:17:07Z）。実メッセージと提出ツリーを確認。main CIとPages・公開表示は待機中。
