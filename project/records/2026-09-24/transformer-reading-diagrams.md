# Transformer記事全体の動的図解

開始日: 2026-09-24。状態: **PR #53マージ・公開受入完了**。P1の最初の制作単位（1記事）。

## 作業契約

- 目的: Transformer記事の主要論点を、既存自己注意と追加3図（入出力・位置情報・ブロック内部）で読書に沿って追えるようにする。本文・具体例は増やさない。
- 根拠: [採択計画](../../plans/engineering/dynamic-diagrams.md)、[全体の許可と展開状況](dynamic-diagram-rollout.md)、[確定絵コンテ](llm-diagram-storyboards.md)。ROADMAPのS-1は執筆済みであり、本作業は表示機能の展開。
- 基準: P0マージ `584a379ccd56f19cc4c31162288f30880be7bb67`。P0の公開受入11件成功を確認し、04:23 JSTごろに最新origin/mainから `feat/transformer-reading-diagrams` を開始した。
- 所有: rootはT3・共通操作・dispatcher・共通CSS・記事全体の受入集計・ブラウザー統合・記録。attention_mathはT1/T2のscene・model・固有CSS・単体試験。learning_presentation_inventoryはregistry・AST装飾・MDX安全性・sync・ページとMDXの接続・対応単体試験。他者の変更を戻さない。
- 変更範囲: websiteの図解実装・検査・運用README、projectの台帳・計画・記録。docsの原文と生成物は直接編集しない。原文7 H3・40 bodyブロックを一度ずつ包装し、11 H3の論点割当を照合する。
- 検証: lockfile依存準備、root check、サイト単体、公開相当ビルド、既存3図と複数図のブラウザー回帰、数学的不変条件、明暗・狭幅・低画面・縮小モーション・印刷・noJS・通信失敗、性能、独立内容/表示レビュー、実GitHub/Pages/公開確認。
- 終了条件: 本文・式・リンク・アンカーを保持し、4図の操作が独立し、全論点割当と当該版のローカル・公開受入が完了。1記事の受入を全199記事の完了と混同しない。
- 外部操作: ユーザーの「順に作業を自律的に進めてください」に基づき、この制作単位のPR・CI・通常のsquashマージ・Pages・公開確認を含む。既存PUBLICリポジトリとPagesへ反映。有料API・新規外部サービスは含めない。

## 実装判断

T1は入力位置を本文の記号tで固定し、共有あり/なしの比較を置く。行の取得・出力への射影・転置対応を記号で示し、架空の予測値を作らない。T2は内容q/kを固定したまま、基準・共通の位置移動・位置差変更を比較する。説明用の2次元幾何と実モデル値を区別し、Vを回転させない。T3は基本FFNとSwiGLU、RMSの演算とPre/Postの配置、1層と全体の計数を別段階にし、9段階で追う。

本文装飾は全図を原文ASTで検証してから一括適用する。実際の包装の重複を拒否し、意味依存の重複は許可する。原文順で最初の図を生成し、記事内目次を1つだけ置く。段階上限は親の登録図に結び付ける。

## 受入状況

P0公開受入済み。ルートとwebsiteの `npm ci` は成功し、脆弱性検出0件。3図と複数図の接続、ローカル受入を完了。当該記事全体の公開受入は未完了。

### 内容確認と候補の有効化

追加3図の意味モデルを独立レビューし、T3の選択headと連結後の強調の不一致を修正した。Q/K/VをAttentionへ渡す接続、SwiGLUの積からW₂までの線、選択状態の代替説明も整え、T1/T2/T3の予備判定はapproved / low risk。登録・AST・MDX安全性・同期の別レビューも同判定だった。表示検証はこれから実施するため、記事全体の受入と区別する。

この予備レビューを根拠に新3図をenabled/reviewedへ進め、対象sourceDigestとreviewedDigestを一致させた。図の登録状態は本文との内容照合の状態であり、記事全体の公開受入ではない。

### 再開とビルド条件の確認

ルートの `npm run check` は成功した。最初のNextビルドは `STATIC_EXPORT=1` の指定が欠け、プリレンダーは成功したが `out/` を生成していなかった。続くブラウザー試験はサーバー起動待ちで終了し、図の動作を検証した結果として数えない。公開相当の静的ビルド成功という途中案内を訂正する。

利用制限による中断後もブランチと未コミットの担当成果物を保持した。再開後、`STATIC_EXPORT=1`・`NEXT_PUBLIC_BASE_PATH=/ai-agent-library`・公開site URLを明示し、静的出力の存在を終了時に検査するコマンドで再ビルドを開始した。本文や公開サイトへの取り消し操作は行っていない。

### 記事全体の対応と記録の境界

`website/diagrams/articles.json` に、本文9 H3と実務2 H3の全11節・33論点を割り当てた。図が不要な論点も理由を記し、必要な4図が有効でなければ完了にしない。本文AST全体・割当・選択した4図の登録・固定した表示/生成/安全性コード・lockfileを入力ダイジェストへ含め、独立レビュー・ローカル受入・公開確認の3記録が同じ版に一致したときだけ完了を算出する。

本文rendererと音声shellの依存漏れ、2月30日などが繰り上がる日付判定をレビューで修正した。契約の独立レビューはapproved / low、サイト単体は166/166成功。共有コード変更では保守的に再受入を要求する。GLOSSARY・音声カタログ等の共有データ、生成物、projectの記録、commit自体は入力外。JSONはレビューの真正性や公開サイトの現況を証明せず、終了時の実GitHub・公開検証は別に行う。

記録の追記だけでは入力版を変えないため、実装PRでは公開確認を未完として提出し、マージ・公開後の結果を次の制作単位で保存できる。CLIはリポジトリ直下の `node website/scripts/diagram-acceptance.mjs`。現時点では公開未完なので記事完了は0/199のまま。

### 最初の実ブラウザー結果

静的export `7UN43XOwSLG3ORNm8HGPq` は223/223ルート、230 HTML、16章の入口検査に成功。対象ブラウザー17件は最初14成功・3失敗だった。3件は、既存自己注意の本文stepは0〜4（手動の混合段階を含むstageは0〜5）、ラベル部分一致がSVGの代替説明にも一致すること、共有なしの式と説明の表示箇所、という試験側の期待・選択の問題だった。本文の実装と仕様に照合して検査を修正し、同じ製品ビルドで対象3件が成功した。

追加3図の全17段階は1440×1000明暗、1280×720明、390×844明暗で枠内に収まり、横あふれがなかった。4図それぞれの読書位置への復帰・操作の独立性、図の通信失敗7条件での本文保持、noJSでの4図と目次1つを確認した。初回失敗のtraceはTEMPの `p1-transformer-browser-first-export-20260924`、修正後ログは `p1-transformer-browser-corrected.log` に保持する。全体回帰とWebKit受入は続行中。

### 静的候補の表示・性能監査

2026-09-24 12:32:39〜12:34:05 JSTに、Windows・Edge `153.0.4234.48`で最終表示候補を監査した。BUILD_ID `7UN43XOwSLG3ORNm8HGPq` と、Transformer HTMLのSHA-256 `846a28aa53dc5a06b12774e2004a70c62e2becc229f01190cf3235a197e9f034`、対照記事の `e742fadb46a151fa75653e3ab3c6773fde81e7b8cea427eb57a2ccf410ec7150` は開始前後で一致した。基準mainは `584a379`、未コミットのローカル候補であり、公開確認ではない。

1440×1000 lightと1280×720 darkの4図・8表示条件、操作違いを含む15画像を確認し、重大な重なりや読めないラベルはなかった。狭いPC画面では通常スクロールで下部の操作へ到達する。縮小モーションでは即時に正しい状態へ移り、noJSでは4図の本文・式・静止表示と目次1つを保持した。

| 図 | 段階操作の応答 | 実時間再生のrAF間隔P95 | 5.5秒のphase | 明示停止・再開・画面外停止 |
| --- | --- | --- | --- | --- |
| 入出力 | 17.3 ms | 7.1 ms | 0.01 → 1.23 | 成功 |
| 位置情報 | 16.9 ms | 13.8 ms | 0.01 → 1.24 | 成功 |
| ブロック | 9.3 ms | 13.9 ms | 0.01 → 1.23 | 成功 |

応答は段階ボタンのクリックをhandlerより前で捕捉してから最初のrange値変更まで。再生は仮想時計を使わず、native performance.now/rAFで5.5秒測定し、明示停止後450ms・画面外停止後350msの位置不変を確認した。rAF間隔はGPU描画時間ではない。通信・CPU制限のないローカル静的HTTPで、主担当の4183回帰と4205監査を並行した観測値である。

初回CLSはTransformerと図なし対照の両方0。1440×900 light・縮小モーション、新規contextでload→fonts.ready→実時間5秒を待ち、クリック・スクロール・Mermaidの先行表示をしない条件で、session windowの最大値を採った。全端末の応答や描画性能を保証する値ではない。

資産は実際にダウンロードしたユニークなJS応答本文をNode gzipSyncの既定設定で再圧縮した。4図のscene/core全chunkは35,357B、共通入口21,241B、合計56,598Bで記事固有予算75KiB以下。共通部100KiBの予算も満たす。関連しないコードを含むchunk全体の上限で、純粋なmodule差分や圧縮HTTP転送量ではない。

対照記事と異なる全JSの合計は221,954Bだった。このうち13chunk・186,597BはP0 Transformerにも存在するMermaid等の依存で、URL・展開後/圧縮サイズが一致した。これを新図解の追加容量に数えない。旧P0証拠は由来の分類だけに用い、今回の容量は現在の応答から採取した。対照記事の重い図解chunkは0。

監査エラー0。既知のローカルfavicon 404、context終了に伴うfetch abort 158件、noJSのscript preload csp 1件は別計上し、「通信失敗が全くない」と言い換えない。監査後4205を終了し接続拒否を確認した。証拠はTEMP `codex-transformer-audit-20260924/summary.json`・`audit-chromium.json`・PNG15枚、再現スクリプトは同ディレクトリの `audit-transformer.mjs`。再測定時は証拠を別ディレクトリへ保存し、`AUDIT_EXPECTED_BUILD` で対象BUILD_IDを固定する。

### 最終内容レビューと全体回帰

独立担当 `p0_final_review` が、最終BUILD_ID `7UN43XOwSLG3ORNm8HGPq` の4図・15 PNG、本文全11 H3・33論点、本文AST保存の検査を確認し、approved / lowと判定した。必須修正なし。T1の共有/非共有、T2の位置差、T3のhead h・RMSNorm・Post-Norm・計数が式と一致した。原寸再確認で懸念が解消した凡例に製品変更は加えていない。この判定は内容と画像の独立レビューであり、ブラウザー全体・性能・公開の合否は別記録とする。

同じ静的候補でChromium全178件のうち173成功・音声fixture専用5 skip（4.4分）。新図だけでなく既存の数式・Mermaid・検索・音声shell・図解の回帰を含む。ログはTEMPの `p1-transformer-chromium-final.log`。WebKitの主要6 specは81/81成功（5.0分）。ログはTEMPの p1-transformer-webkit-final.log。物理iPhone、実スクリーンリーダー、本人による学習評価は未実施。

### PR・Pages・公開受入の完了

[PR #53](https://github.com/pero3dev/ai-agent-library/pull/53) は2026-09-24 13:01:11 JSTにsquashマージされた。PR headは `04589a8e3bdfb95a18536fc396f4e9cf5f847e5c`、公開SHAは `828aa492adbbc1382a68edb40f6c3c14eb3d12e0`。検査済みのtitle/body/trailerと実際のマージメッセージが一致し、マージ後のファイルもPR候補と一致した。通常の11チェックは成功、PRのdeployはmain専用条件によりskipだった。

[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/35953852626) と [Pagesジョブ](https://github.com/pero3dev/ai-agent-library/actions/runs/35953852626/job/107488751204) が同じSHAで成功。GitHub APIからgithub-pages deployment `6629937978` の最新statusがsuccessであることを再取得した。TEMPの `ai-agent-library-p1-public/deployment-evidence.json`・`merged-commit.json`・`pr-ci.log` に証拠を保存している。実PR CIもサイト単体166件、ブラウザー173成功・5 fixture skipだった。

[公開記事](https://pero3dev.github.io/ai-agent-library/docs/llm-internals/transformer-architecture) をWindows Edge `153.0.4234.48`で確認し、11/11ケースが成功した（13:08:51〜13:09:53 JST）。4図の1440×1000明暗・1280×720・390×844、追加3図の実時間再生/停止、4図の読書復帰と手動操作の独立性、noJSの4静止図・11 H3・12式・目次1つ、図なし対照の重い図解コード0を確認した。実配信JS/CSS/preload 35件はHTTP 200・期待MIME・非空、予期しないブラウザーエラーなし。4画像を保存し、公開入出力図を原寸で再確認した。

初回は10成功・1失敗だった。noJSの本文・式・全静止図は既に成功していたが、JavaScript無効時のscript preload CSP拒否1件を通信障害として扱っていた。検査スクリプトだけを修正し、noJSかつscriptかつcspに限って想定内として別計上し、同じ公開版で全11件を再実行した。通常JS/CSSの失敗判定を緩めていない。初回証拠 `public-2026-09-24T04-06-44-637Z`、成功証拠 `public-2026-09-24T04-08-51-320Z` を両方TEMPに保持する。

入力ダイジェスト `sha256:c75057890c4c3561f329585ca3298c337cf6f69df11501d756c963f678a4d17e` に対する3ゲートを保存し、CLIで記事complete=trueを確認した。[PR #53の受入スナップショット](transformer-article-acceptance-pr53.json)は今後の共有コード変更で書き換えない。当該公開版の全体対応は1/199記事。次の注意変種単位で共有コードを変更する際は、新版としてTransformerを再検証する。物理端末・実スクリーンリーダー・本人の学習評価は未実施。
