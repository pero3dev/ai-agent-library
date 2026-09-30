# 推論モデルの読書連動図解（D2）

状態: D2は[PR #64](https://github.com/pero3dev/ai-agent-library/pull/64)で公開済み。2026-10-01のユーザー指示により、旧手順の独立公開レビューと証跡アーカイブの追加は省略し、公開表示確認へ切り替えた。[後続5記事と現行手順](../2026-10-01/p1-completion.md)を参照。以下は中断前の経緯であり、未完了の旧ゲートを成功へ書き換えていない。

## 作業契約

- 目的: 既存の推論モデル記事に2図・9段階を組み合わせ、生成の条件、学習と実行の違い、思考量の比較と評価を読書位置から理解できるようにする。本文・例は増やさない。
- 正本: `docs/10-llm-foundations/reasoning-models.md`。[採択済み絵コンテ](../2026-09-24/p1-remaining-storyboards.md)、[具体的なインターフェースと独立レビュー](p1-interface-preparation/README.md)、[公開検査計画と独立レビュー](reasoning-kit-preparation/README.md)。
- 開始条件: [D1](alignment-reading-diagrams.md)と既存8記事の現行入力版を公開受入し、[9 completeの固定結果](diagram-acceptance-pr63.json)を保存した。2026-09-30T11:20Z、取得した最新main `b6686c92dbb678ea8b94eb12df37a33207c4c84b`から`feat/reasoning-reading-diagrams`を作成。open PRは0、前単位の公開記録・ゲート・引き継ぎ差分はroot所有として持ち越し、他worktreeは変更しない。
- 所有: D2の2モデル・2scene・2CSS・2単体試験、dispatcher、図登録・装飾・MDX許可・論点割当・受入、ASTと共通回帰、公開kitとローカルadapter、必要な検査上限、制作・公開証拠と引き継ぎ。生成物は正本から生成する。
- 許可: ユーザーの自律的な実装・通常PR・CI・squashマージ・Pages反映までの依頼。P1の全15記事の公開受入後に止め、P2には着手しない。
- 終了条件: D2と既存9記事の新しい入力版を独立ローカル・実GitHub・公開両engine・独立実画像で受け入れ、別PCで辿れる証拠を保存する。その後にE1へ進む。

## 確定した実装境界

原記事のLF正規化SHA256は`71246ca014e171936139af9083df301f16dcb7dade8f7aeb3a0b14516a19ef44`。本文訂正は0。43論点のうち動的26・静的17、6 H3と14 body blocksを包み、通常READは8停止、手動専用は1段階とする。

- `reasoning-sequence`: 4段階。READは0→2→3。0と2で既生成の内容が後続条件となる矢印を見せ、2へ直接到達しても学習の別枠・実行中の固定重み・模式表示が成立する。思考文・トークン数・時間・料金を作らない。
- `reasoning-evaluation`: 5段階すべてREAD。`taskFocus`の3値は0だけ、`effortFocus`の2値は1・2だけに作用する。他段階で有効なfocusはnull。比較は同じ入力・モデル・指示・基準で思考量だけを変え、品質・費用・待ち時間は未計測とする。4つの空試行枠を実行済み・必要標本数と表示しない。
- 読み込み確認用の表示markerは`REASONING / SEQUENCE`と`REASONING / EVALUATION`を採用する。2つのliteral lazy importを使い、共通の停止・再生・手動送り・拡大・fallbackへ接続する。

## 事前確認と必要な検証

統合helperのD2 dry-runは9ファイルの追加・追跡10記事目・READ順・43論点と採択案の一致を独立確認した。書込みは行っていない。固定した追跡配列の共通試験、モデル/scene、AST試験、公開kitはhelperが生成しないため、実装単位に含める。

公開kit計画は2026-09-30T10:18:42Zにapproved / low・must 0・should 0。14ケースを追加して121ケース・10記事とする。旧107ケースの順序・本文・assertion、artifact同一性、図なし対照を保つ。6画面条件の全9段階、全8 READ、段階限定操作、中点・逆シーク、意味、keyboard/modal、実時間再生、noJS/printを含む。これは計画承認であり、実装・runtime・公開の承認ではない。

原文AST完全復元と8 READの厳密順序、動的論点を手動専用1だけに割り当てないこと、未操作の0→2→3で意味が欠けないことを確認する。12指標セルの未計測、対象外設定の効果なし、モデル外の権限強制を、属性だけでなく可視表示と独立画像で照合する。共有入力変更後は旧9記事のゲートも根拠と結び直す。

PR #63の実績はbrowser 333成功・規定5 skip、13.2分、build job全体は約16分。build上限20分には依存・単体・audit・build・browser・artifact uploadがすべて含まれる。独立した運用点検に基づき、D2変更で同jobの上限だけ30分へ広げた。他job、workers 2、assertion、個別timeout、成功後だけのartifact公開は維持する。ファイル内並列化はD2実測が必要性を示す場合に限定し、現時点では変更しない。

## 実装・検証の途中記録

2図・9段階と共有統合を実装した。モデル単体18件、原文AST復元・MDX往復の4件、記事別受入の43件が成功。初回static exportは223 routes・230 HTMLで成功した。初回の意味・モデル独立レビューはapproved / low・must 0・should 1で、原文の限定表現を保つ「CoT 指示だけとは限らない」へ修正した。語句修正後の最終build・画像判定は別に確認する。

公開kitは旧107ケースと本文を逆適用で復元し、新14ケース・10記事へ拡張。オフライン準備と単体35件が成功した。その後の独立コードレビューはmust 3（証拠定義との連動改変、印刷で隠すselectorの可視要求、可視意味・片側測定欄の検出不足）を指摘し、修正中。最初の機械成功を最終承認として扱わない。

初回Edgeは原文のTODO引用が既存装飾でasideへ変換されることを検査が考慮せず中断した。次はSVG水平矢印の幾何高さ0を未表示と誤判定し中断。どちらも検査側を修正し、失敗原本は保持する。3回目は6画面条件・全段階、意味、keyboard、READ、実時間再生、noJSの13件が成功し、印刷1件は独立レビュー指摘と同じ理由で失敗した。印刷用の操作部非表示とSVG意味確認を分離して再検査する。これらは初回候補のローカル結果で、最終公開受入ではない。

## 最終候補の検証

文言修正を含む最終static exportはBUILD_ID `ay8Xdd-uRIpIwdWdgy70j`、223 routes・230 HTMLで成功。サイト単体419件が全成功、root `npm run check`は490件中489成功・既存音声変換1 skipで成功した。その後のproof連動改変・新ケース分断の負例を含むkit単体35件と、最終manifestのオフライン準備も成功した。

初回実画像138枚のうち83枚を独立担当が実際に視認し、視覚must 0・should 0と判定した。全6画面条件の各9段階、全selector、拡大とviewportを含み、生成数と実視認数を分ける。旧版の文言と失敗した印刷case内の診断画像はそのまま保存し、最終版の確認へ読み替えない。実ブラウザーの200%ズームや物理端末は未検証。

最終ビルドではEdgeの9段階・印刷の事前確認2件、WebKitの全14件が成功。2図それぞれのJavaScript配信を実際に遮断して本文保持を確認する追加試験もEdge・WebKit各2件成功した。最終Edge全体回帰は347成功・既存音声5 skip、18.9分で完了。追加の配信失敗2件は全体実行の開始後に加えた別実行として区別する。旧9記事については基点の132固有・共有入力を独立比較し、共有5ファイル以外はraw bytes不変、旧27図登録・9記事割当も完全一致した。共有追加のレビューと全体回帰を現行入力へ結合し、実GitHubと公開再受入は別途確認する。

## 独立ローカル受入

2026-09-30T12:28:37.439Z、approved / low / must 0 / should 0。[ローカル証拠の入口](reasoning-local-evidence/README.md)に229原本と[最終独立判定](reasoning-local-evidence/final-review.json)を保存した。初期83枚と最終候補の追加39枚を合わせて122枚を独立実視認した。旧83枚のうち1枚は既知の印刷検査失敗の診断画像で、成功ケースの画像として数え直さない。kitコードのmust 3とshould 1は、可視意味・print・proof連動改変の拒否・追加ケース連続性を修正し、担当を分けて再判定した。

Windows・Edge・1440×1000・DSF 1・負荷制限なしの単独測定で、D2のcold CLSは0、scene gzipは17,309 bytes、共通chunkは21,954 bytes、操作応答は14.2 msと10.1 ms。両図とも観測rAF間隔のp95は7.1 ms。実UIの一時停止と実スクロールによる画面外移動後、それぞれ500 ms以上の観測でアプリ用rAFの要求・実行増分0、pending 0とphase安定を確認した。観測用native rAFは別計数とした。これは当該環境の局所測定で、GPU frame timeや全端末の性能保証ではない。

性能原本の非critical fetch中断38件は原因を断定せず保持する。本文・script・styleの配信条件や公開kitの検査条件は緩和していない。測定前後のBUILD_ID、10記事のinputDigestとHTML SHA256は一致した。静的・単体・ローカル受入を公開成功と読み替えず、PRの実CIと公開121ケース・独立公開画像レビューへ進む。

保存後の[独立整合確認](reasoning-local-archive-review.md)でも229原本・122画像の出所・10記事のローカルゲート・相対参照が一致し、approved / low / must 0 / should 0となった。旧9記事のpublic欄はPR63の旧入力版、D2のpublicはnullのまま保持する。

共通の表示要件に合わせ、1920×1080・768×1024のlightを両engineで追加確認した。4ケースが全9段階で成功し、生成72枚中44枚を独立実視認、2026-09-30T12:48:48.371Zにapproved / low / must 0 / should 0。元122枚と合わせ166枚の視認となる。[提出前の追補証拠](reasoning-submission-evidence/README.md)に元記録と分離して保存した。補足2幅のdark・native 200% zoomは未確認。

最終root `npm run check`は489成功・既存音声1 skipで完了した。最初の提出前実行では一時PR本文の`.md`拡張子が記事lintへ混入し終了1となり、提出用`.txt`へ改名後に全体を再実行した。両ログを追補証拠へ保存し、最初の失敗を削除していない。製品・kit・本文の変更は追加していない。

## PR提出と公開前の確認

PR #64のheadは`da5a61e8584de10943f28b5eb939f0f3d98a890e`、baseは`b6686c92dbb678ea8b94eb12df37a33207c4c84b`。PR CIは[36719009030](https://github.com/pero3dev/ai-agent-library/actions/runs/36719009030)。2026-09-30T13:17Zの実APIで11検査中10成功・build進行中を確認した。マージ、main CI、Pages、公開121ケースと独立画像レビューはこの時点では未完了。

最初のpush/PR作成要求は、保存証拠に旧PCの絶対パスが含まれるため自動承認審査で実行前に差し止められた。全643ファイルのGit blob（79 text・261 gzip text・303 PNG）を検査し、秘密情報の検出0、PNGのtext/exif metadata 0、利用者パスは同じプロジェクトの既公開証拠に存在するものと確認した。別担当の独立内容監査もmust 0・should 0だった。同じ操作を再審査した結果、承認され通常pushとPR作成が成功した。審査を迂回した操作や、認証情報の引き継ぎは行っていない。監査原本は公開証拠保存時に相対索引へ追加する。

PRの11必須検査が成功し、2026-09-30T13:27:18Zに`b7bb4b12f3878d2f7b12c542c32b66d1ac6709c6`として通常squashマージした。取得した実マージメッセージの件名・本文・名義は共通検査に成功。PR buildは17分55秒、browserは349成功・既存音声5 skipで14.8分だった。ローカル全体実行後に追加した配信失敗2件もPR CIには含まれる。

2026-09-30T13:31:24.356Zの独立照合で、候補とマージのtree `7a57521f23b03a6b34586ee4f839770a1eac1abc`・全2517 entryが一致した。実merge blobから10記事のinputDigestを再計算し、最終local reviewの10値、関連142 source、kit全20ファイルと照合した。これはソース同一性の証拠であり、公開ブラウザー受入ではない。main CIは[36721749315](https://github.com/pero3dev/ai-agent-library/actions/runs/36721749315)で実行中。

GitHubのジョブ一覧APIの一時的なHTTP 502によりwatchが終了したが、CI失敗ではなかった。既知jobの個別APIでPR build成功と原ログを取得した。mainの完了監視はrun APIを使い、collectorでは実attempt・artifact・Pagesの条件を改めて照合する。検査を省略した成功扱いにはしない。

main CI `36721749315`（attempt 1）とPages job `109913755187`が成功し、2026-09-30T13:44:39.174Zのcollectorでartifact `11101346874`、BUILD_ID `4tjwjOwQRImwvRy83cFRh`、同一artifactの10 HTMLを取得した。main browserは349成功・既存音声5 skip、10.2分。13:45ZからEdge・WebKitの全121ケースをそれぞれ実行している。途中の機械結果や画像確認を最終公開受入とは扱わない。

## native 200% zoom の補足

既存DSF 2検査と区別するため、使い捨てのChromium profileと標準tabs APIで100%→200%→100%を試した。実API値、viewport幅1424→712→1424、DPR 1→2→1、visualViewport.scale 1、前後の入力・BUILD・HTML一致を確認した。普段のprofileや設定を変更していない。[限定診断の原本](reasoning-native-zoom-evidence/README.md)に2回の実行・画像12枚と実視認7 pathを保存した。

同じ200%・同じスクロール位置で、直接取得したCDP画像には図があり、Playwrightのviewport画像は白くなった。取得経路の不一致を分離したが、内部原因は未確定。低い画面で中央に合わせた画像では固定headerが図の上部を覆うため、全段階の可読性確認とは扱わない。全9段階・明暗・通常スクロールでの到達性は別の補足検査として準備する。
