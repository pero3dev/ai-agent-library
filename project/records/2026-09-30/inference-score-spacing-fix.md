# 推論図のロジット値の表示間隔を修正する

状態: PR #62で修正を公開し、C2と既存7記事の公開再受入を完了。P1公開完了数は8/15。元PR #61の不合格判定は履歴として保持する。

## 作業契約

- 目的: S6「スコアだけを変更」の各列の値を分離し、微小な差を示す6桁と負号を保持する。
- base: `ca3c09eebd1b549564f874f3304d23ae25328194`、branch: `fix/inference-score-spacing`。PR #61のreview済みtreeと実merge treeは一致する。
- 所有: 推論sampling CSS、対応browser試験、推論受入ゲート、C2公開の生証拠・レビュー・制作記録とこの修正記録。本文・数値モデル・公開検証キットには変更を加える必要はない。
- 許可: ユーザーの図解実装・公開反映・自律的な通常修正。必須表示修正を行い、P1全15記事の公開受入で停止する。P2は開始しない。
- 必要な検証: 元の公開版での再現、6桁の値・負号・選択・棒の意味の保持、全比較選択の文字間隔、Edge/WebKitの明暗・低画面・狭幅・拡大、既存数値/記事保持、独立実画像、PR/main CI/Pagesと同artifactの公開全91ケースおよび当該比較の追加検査。
- 終了条件: 修正候補と公開版の独立確認で未解決mustを解消し、新C2と旧7記事をその入力版で受入してからD1へ進む。

## 公開版で確認した事象

PR #61は全11チェック成功後、2026-09-29T17:42:26Zに上記baseへマージ。main CI `36606841286`、build `109537925933`、Pages `109543224688` が成功し、BUILD_IDは `UWZD5odlVHV_TyUNH3jZ0`。Edge/WebKitの機械検査は両91/91、各72資産が成功した。main site unit360/360、全体browser318/323（既定skip5）、Linux root unit471/480（条件付きskip9）も確認した。

独立公開画像レビューではWebKitの推論sampling S6で、C列の `0.000000` とD列の `-1.000000` の実字形が2行とも接触することを確認した。列中心間隔106 SVG単位に対し、22pxの等幅9桁・8桁表示の文字枠が6.234 SVG単位重なる。公開版だけの補助採取で再現し、BUILDと8HTMLの前後一致、36配信資産の一致も確認済み。C2の5図に追加mustはない。元の成功した機械結果を画像受入へ読み替えない。

## 修正方針

既存 `data-comparison-kind="logit"` 内の `.is-score` だけを18pxにする。`1.000001` と `0.999999` の説明用差分、6桁・負号・値・棒・選択を保持する。draw比較は22pxを維持する。対応browser検査で、実際の各列の文字枠が分離することを確かめる。幅/値の最終検証と独立レビューを受けてから公開する。

## 検証と公開

[修正前の公開証拠](../2026-09-25/pretraining-public-evidence/index.json)に、PR #61の機械成功と独立画像レビューの不合格、実視認90枚を保存した。C2の[正式記事レビュー](../2026-09-25/pretraining-article-final-review.md)も別に保持する。過去の判定を修正後の成功で上書きしない。

[独立コードレビュー](inference-score-spacing-code-review.md)はapproved / low、must 0・should 0。CSS追加1行を除くと元CSSへ完全復元し、モデル・描画JSX・公開検証キットはbaseから不変。実文字BBoxと6桁の値を確認する回帰試験は有効と判定された。

推論記事のinputDigestだけが `sha256:44c59ad4bbb41ed623e89e0446c0a617f050ba0d416e87a3462eab2381e88b09` から `sha256:e7b10bba12334b71d3eb0b5b469344d2d7e0451c42f52814693d955dd165ab82` へ変わり、残る7記事はPR #61候補と一致する。コードレビューだけでは新しい推論の受入ゲートを更新しない。

root単体試験は479/480成功（失敗0・既定skip1）、site単体試験360/360成功。最初のroot checkは、公開証拠の並行移管が完了する前にリンク検査へ到達し、未保存3リンクで停止した。移管後にMarkdown・記事規約・リンク・TODO・ハーネス検査を再実行して成功した。元の失敗ログも保持する。

公開相当の静的ビルドは223ルート・230 HTML・16章を確認し、ローカルBUILD_IDは `5LJEBsyF5N8plxvpugTbv`。この候補の推論browser試験はEdge全30/30（2.5分）、WebKitのsampling・文字幅回帰1/1（14.3秒）が成功した。独立した明暗・狭幅・拡大の画像確認は別に行い、CI・公開配信のBUILD_IDとも区別する。[生証拠索引](inference-score-spacing-evidence/index.json)に、失敗した初回リンク検査を含めて保存する。

[独立ローカル画像レビュー](inference-score-spacing-review.md)は2026-09-29T18:43:36.531Zにapproved / low、must 0・should 0。通常6画面条件と拡大2条件でdraw/logitを両engine各16、計32観測し、候補64PNGのうち36枚（全32図とviewport4）を実視認した。最小余白はWebKit14.171875・Edge24.091675 SVG単位で、6桁・負号・選択と棒の意味を保持する。8入力・8HTML・BUILD・CSSは開始/終了/最終確認で一致した。狭幅の文字は約10 CSS pxで、PC中心の限定修正として扱う。

原Edgeの補助検査は全16比較成功後、66件のページ先読みfetch中断を一律失敗へ数えたためraw failedを保持した。v2再実行と別時刻診断では、全件を実在HTMLへのfetchまたは明示RSC prefetchと照合し、未知の中断・document/script/style/fontの失敗0を確認した。context終了に起因するとの初期推測は採用しない。元WebKit成功とEdge v2成功を上記32観測の根拠とし、元の失敗を上書きしない。

推論のreview/localゲートは、[C2時の全体ローカル受入](../2026-09-25/pretraining-scene-review.md)と、今回の56入力束の差分証明・推論全30回帰・独立した表示差分レビューを組み合わせて更新する。今回だけで記事全体の全画像を再視認したという意味ではない。他7記事のreview/localは入力不変のため維持する。公開ゲートとP1完了数は新しいCI/Pages・公開全91×2・独立公開確認まで更新しない。

### PR #62の公開再受入

[PR #62](https://github.com/pero3dev/ai-agent-library/pull/62)は11チェック成功（PRのdeployは既定skip）後、2026-09-29T18:59:10Zに `5940334a6fd3aab8178cfeb8746a58c8b937d390` へマージした。source headは `8382b757c8a2fa3719448e1b180271b1cdd56f99`。レビュー済みtreeと実merge treeは `efa96dd1d86c6ae3d087d1ac204146df90beea3d` で一致し、マージメッセージの件名・本文・名義を確認した。

[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/36615994124)と[Pages](https://github.com/pero3dev/ai-agent-library/actions/runs/36615994124/job/109574494236)は成功。site unit360/360、browser318成功・既定skip5。実CIのPages artifactは `11055318318`、BUILD_IDは `FnChqMe5DEINmNrKQkZeM`。collectorで実merge/run/deploymentと8HTMLの取得前後同一性を照合した。

公開EdgeとWebKitの全91ケースは両方成功（各失敗0、各配信72資産、生成画像はEdge671・WebKit668）。[公開証拠](inference-score-spacing-public-evidence/README.md)に元結果を保存する。

[独立公開レビュー](inference-score-spacing-public-pr62-review.md)は2026-09-29T19:43:48.515Zにapproved / low、must 0・should 0。追加の両16観測と新公開47画像の実視認でPUBLIC-V1の解消を確認した。図解入力8件はactual mergeのGit blobと一致し、他7件はPR #61から不変。8HTML・72配信資産の前後照合、全91×2、旧判定の範囲を明記した持越しで8記事を合成受入した。

公開補助検査の初回は正規のNext動的ルート名を誤って拒否し、browser起動前に停止した。原helperと失敗ログを保持し、パス区間の判定だけを修正してoffline11項目と新規32観測を確認した。元PR #61不合格と各rawのレビューpendingは上書きしない。

同じ入力版の8記事へpublicゲートを記帳し、各 `-pr62.json` の固定記録と[受入CLI結果](diagram-acceptance-pr62.json)で8件すべてcomplete=trueを確認した。後続D1の共有コード変更で現行ゲートが古くなる場合も、この公開済み版の固定記録を保持する。物理端末・実スクリーンリーダーの確認は含まない。
