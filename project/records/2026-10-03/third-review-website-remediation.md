# 第3回レビュー: サイト・読者導線の修正記録

作業日: 2026-10-03〜04(JST)。比較基準: `f3af9b045c3703a6540b68301f6ef25dd2690d9c`。

## 作業契約

ユーザーの「GithubのIssueのすべて自律的にCloseに向けて進めてください」を根拠に、Issue #189–194・#202・#209・#210 の修正と検証を進めます。所有は `website/`、`.github/ISSUE_TEMPLATE/`、README の品質・制作開示節、CONTRIBUTING の報告受付節、SECURITY の CSP 節です。Git 提出・GitHub 更新・公開確認は統括担当が実行します。他者の編集を戻さず、生成物は正本・生成スクリプトから更新します。

入口は `AGENTS.md`、`CONTRIBUTING.md` のサイト・提出前チェック、`ROADMAP.md` の継続メンテナンス、`project/README.md` の記録配置です。終了条件は各 Issue の受入条件を満たす実装、サイト単体・静的ビルド・実ブラウザー検証と、その証拠の保存です。人の関与はオーナーの回答に基づいて記載し、推測で人のレビューを主張しません。

## 実装と検証

| Issue | 変更前の問題 | 実装後の状態・検査 |
| --- | --- | --- |
| #189 | 記事初期JSに依存マップなどの専用部品が混入し、一覧の大量リンクが prefetch される | 専用4部品を遅延import、一覧・共通ナビの prefetch を無効化。初期JSの混入マーカーと gzip 320 KiB 予算を postbuild で検査。最終tool-use は12 scripts、968,165 B raw、308,285 B gzip。Issue の基準373,644 B gzipから65,359 B(63.83 KiB)減少。基準はレビュー環境、今回値はWindowsの公開相当ビルドであり、同一ホストの計測とは主張しない。 |
| #190 | スクロール時にブラウザーが Mermaid を描画する | 74種類の図を strict 設定で2テーマのSVGに事前変換。外部通信を禁止したローカルChromiumで生成し、XMLとして検査。閲覧時は画像として表示し、図名・テーマ切替・JS無効表示を試験。5記事・2条件の long task 実測は後掲。 |
| #191 | 共通description、canonical等と検索エンジン入口の不足 | 「この記事の目的」から記事固有description、正規URLと og:url、230 routes に一致する sitemap と robots を生成。公開ビルドで SITE_URL 未設定・basePath不一致は失敗。全記事206ページのdescription重複と全230ページのURLを postbuild で検査。 |
| #192 | 公開用索引に執筆管理文言・ファイル名、検索と目次に英語 | docs正本を維持し、公開変換で16セクションの見出し・表・リンク題名を読者向けに変更。検索・目次を日本語化し、postbuildで管理文言と既定英語の残存を検査。 |
| #193 | 記事リンク・コードのコントラスト違反、2ページの検査除外 | light/dark のリンク色、darkコメントとlight橙色トークンを修正。color-contrast除外を撤去。生成された全230 routes×2テーマのWCAG A/AA走査を既存CIの test:browser に組み込んだ。最終460件の結果は後掲。 |
| #194 | 依存方向とキーボード操作・テキスト代替が不足 | 全20 edgeに矢印、凡例、Enter/Spaceによる遷移、同じEDGESから20関係の一覧。375pxでは一覧を主表示。16 node・20 arrow・20関係・キーボード遷移をブラウザーで検査。 |
| #202 | CSP・referrer指定がない | 全232 HTMLのhead先頭にCSPとreferrerを挿入。Nextの実出力のinline scriptを個別hash許可、Pagefind wasm、KaTeX font、静的SVG、音声配信元を明示。制約と理由をSECURITYに記載。実ブラウザーの securitypolicyviolation を収集し、Chromium/WebKitの検索・数式・図・テーマ・実HTTP音声で検査する。 |
| #209 | 訂正・要望フォームと記事からの報告導線がない | GitHub Issue Forms 2種、非公開セキュリティ案内、正本docsパスと更新日を埋めた全記事の報告リンク。README/CONTRIBUTINGに外部PRの受付手順。既存content/enhancementラベルは統括担当が実GitHub CLIで確認。フォームschema・生成HTML・ブラウザーで検査し、試験用Issueは作成していない。 |
| #210 | AI執筆とAIレビュー、人の役割と検証の限界が不明瞭 | READMEと/aboutでAI執筆・別AI実行の独立レビュー・定期最新化・訂正・ライセンス範囲を開示。2026-10-03のオーナー回答「方針決定と公開判断を担当し、記事の人による全件レビューは行っていない」に基づき役割を明記。 |
| #211(公開入口) | 系統単位の一次情報確認と記事更新日の違いを読者が確認できない | harnessの observationReport から/freshnessに16系統を公開。部分観測を宣言範囲の完了に格上げせず、最終確認記録なし・期日未確定・部分観測日と根拠を区別。完了記録も全記事の全主張の保証ではないと明記。10/03のmodels部分観測を反映して16系統のunknownを維持。停止検知workflow・復旧手順はharness担当の記録を参照。 |
| #200(サイト部分) | 生成されたcontentに対するNextra Git timestamp warning | 正本のlast_updatedを記事日付として使用し、NextraのGit照会専用repository初期化だけをadapterで無効化。他のcompiler処理と診断を維持し、上流の構造変更で失敗。公開相当ビルドで当該警告0、Next workspace root警告も0。 |

## 検証結果と確認水準

lockfileを `npm ci` で準備し、npm auditのadvisoryは0。サイト単体試験は82件成功、その後追加したCSPのexact hashと隔離音声許可の2件も成功した。実行はWindows、Node v24.14.0、Playwright 1.63.0、Chromium 153(v1243)、WebKit 26.6(v2359)。これはサイトの検証環境であり、rootのNode要求版・診断検証とは別に記録する。

公開相当の `STATIC_EXPORT=1`・basePath `/ai-agent-library`・SITE_URL `https://pero3dev.github.io/ai-agent-library` でclean build成功。230 routesの全出力、232 HTMLのskip target、16セクションへの本文リンク、206種類の記事descriptionを確認。生成物はsync/build/postbuildのみから更新した。

公開相当clean buildは2026-10-03 15:54 UTC(10/04 00:54 JST、ログ最終書込15:54:08 UTC)に成功した。Git timestamp warningとworkspace root warningはいずれも0。AUDIO_TEST_CATALOGを外し、実公開カタログ・記事日付・models部分観測を同期した。その後の最終記事レビューの訂正17記事を反映した再生成は後掲。

10/03 14:58:08 UTC開始の全652ブラウザーcaseは645成功・5件の本番native音声skip・2件失敗だった。失敗は初期hydrationの操作待機不足で、networkidle待機を追加した15:29:11 UTC開始のmobile-menu/audio回帰は12成功・5本番native音声skip・失敗0だった。

公開出力の全ルート再走査は10/03 15:55:46.944〜16:09:36.969 UTC(10/04 00:55〜01:09 JST)に642件を実行し、635成功・本番native音声5 skip・2失敗だった。静的図のCPU/scroll計測10件は後掲の成功計測を使用した。検索は初回のPagefind索引読み込み中に5秒の結果待機が切れ、音声ページのメニュー操作は新しいrouteの完了前に次の操作へ進んでいた。同じ出力で当該2件を単独実行すると2成功。試験側を、検索の実結果待機15秒、各routeのnetworkidleとメニューのclosed/open viewport確認へ修正した。

修正後のモバイル6条件・音声nav・CSP・JS無効図9件は16:13:28.658〜16:13:55.430 UTCに9成功、同じ問題の2件を4 workers・各3回で実行した6件も16:15:34.680〜16:15:47.525 UTCに6成功だった。この2失敗は製品・公開出力の変更を伴わない待機条件の修正で検証を取り直している。unique 652条件の証拠は647成功・本番native音声5 skipだが、単一実行で全652件が成功したとは主張しない。過去の中断した試験を成功件数に数えない。

全ルートaxe460件はcritical/serious 0、rule error 0。incompleteはcolor-contrastの460 case(重なり・gradient・sidebar疑似要素の背景)とroadmapのaria-prohibited-attr 2 case(React Flow Controlsのroleなしdivのaria-label)で、未自動判定として全route別に保存した。incompleteを成功判定やWCAG全適合の保証に換算しない。実UTC・環境・生成データSHA・全routeの集計・転送量・long task・音声検査の証拠は[公開用検証JSON](evidence/third-review-website.json)に保存し、機械ローカルの絶対パスやraw traceは公開しない。

## 最終記事レビュー後の再生成

統括担当が本文・参照の訂正を確定した17記事を、content-srcとdocs正本から再syncしてclean buildした。最終ログ書込は10/03 16:30:09 UTC(10/04 01:30 JST)。230 routes・232 HTML・206固有description・74図×2テーマを再確認し、Git timestamp warningとworkspace root warningは0。初期JSは12 scripts、968,165 B raw、308,285 B gzipで予算内だった。

source_pathから公開routeを一意に解決した17 route×2テーマのaxe34件、CSP、JS無効の図、TransformerのCPU/scroll2条件の合計38件を2 workersで実行し、10/03 16:31:14.104〜16:32:57.764 UTCに38成功・失敗0・skip0だった。最新34件もcritical/serious 0で、証拠JSONのroute別axeは最新34件と未変更426件を合成した。17記事訂正後に全460件を単一再実行したとは主張しない。

対象は cursor、se-test-process、devin、gemini-cli-and-code-assist、se-requirements-and-design、openai-codex、agent-benchmarks-landscape、agent-evaluation-basics、regression-testing、claude-prompting、fine-tuning-and-distillation、llm-landscape、compliance-and-governance、attention-variants-and-long-context、transformer-architecture、automation-bias-and-deskilling、rpa-and-agents。10/03 16:39:14.844〜16:39:21.614 UTCには実Chromiumのarticle DOMで、各記事の新しく変更された本文1ブロックの表示を17件確認し、正本と照合対象文のSHA256も保存した。隠れた用語tooltipの本文はDOMの複製から除外して照合し、実表示DOM・正本を変更していない。意味的な最終記事レビューは統括担当の記録を参照する。

最終再走査で375pxの末尾までスクロールしたRSC計測(CDP encodedDataLength、HTTP header込み)は `/tags`・`/audio`・`/glossary` が各3要求・3完了・147,432 B。すべて10要求/500 KiB以内。未完了要求は完了転送byteへ換算していない。

| 記事 | 1366px / CPU等倍 最大long task | 375px / CPU4倍 最大long task |
| --- | --- | --- |
| transformer-architecture | 50ms以上なし | 77ms(最終記事訂正後の再計測) |
| mixture-of-experts-internals | 50ms以上なし | 167ms |
| alignment-theory | 50ms以上なし | 610ms |
| inference-internals | 50ms以上なし | 83ms |
| roi-and-business-case | 50ms以上なし | 50ms以上なし |

初期load後の40回のスクロールをPerformanceObserverで測定した。desktop200ms/mobile1,000msの閾値を全10条件で満たす。「50ms以上なし」はObserver対象のlong taskが0であり、全処理時間0を意味しない。SVG XML不正とlight橙色トークンのコントラストを発見した中断試験から修正し、上の成功値を取り直した。

隔離音声clean buildと実HTTPの302→拡張子なしapplication/octet-stream/Range配信はChromium8件すべて成功、CSP違反0。Windows WebKitは検索を実キー入力にして、検索・KaTeX・静的図・テーマ切替のCSP試験1件成功、違反0。JS無効の図も最初のWebKit実行で成功した。WebKitのfillはcontrolled検索へ空inputを送り、実キー入力MCPでは検索できることを診断で確認した。実ユーザー入力をDOMイベントの差替えで代用していない。

Windows WebKitのnative MP3は再生に至らなかった(paused=false、readyState=0、networkState=3、error=null、source type=audio/mpeg)。CSPを外した同一出力でも検索/操作の差が残り、CSP違反もなかった。実再生の成功とは記録しない。macOSの必須 `audio-webkit` CIでAVFoundationによる実再生に加え、CSPとJS無効図の試験を実行するstepを追加した。WebKitのOSごとのmedia差とmacOSでのSafariに近い検証は[Playwrightの公式説明](https://playwright.dev/docs/browsers#webkit)(確認日:2026-10-04)も参照する。

## 残件と外部確認

GitHubのPR/CI、公開サイトへの配信、Issueの完了チェックとCloseは統括担当が実施する。このローカル記録だけでは公開済みとは扱わない。WindowsのPlaywright WebKitは実ブラウザーエンジンの検証であり、物理iPhone/Safari・macOSの音声バックエンドの検証ではない。
