# 推論図解の確率とロジットの表示修正

状態: PR #58をマージし、CI・Pages・公開機械検査と独立画像レビューまで受入完了。

## 作業契約

- 目的: 推論の最終比較段階で、棒の高さが確率、下段の値がロジットであることを明示する。
- 所有: `website/components/diagrams/inference-sampling-walkthrough.jsx`、`website/tests/browser/inference.spec.mjs`、推論の受入記録、本記録。別PC向けの計画・検証キットは別の作業単位として保持する。
- 元HEAD: `140481edc3968d853f5b8c2b56d4ec5c9c29b027`、ブランチ: `fix/inference-score-labels`。
- 許可: ユーザーによる動的図解の実装・公開反映・自律続行。P1の15記事を公開受入して停止する。
- 終了条件: 図の意味と実画面の独立再レビュー、共通検査・サイト単体・静的export・対象ブラウザー検査、PR・CI・Pages・公開版の同一性と実表示確認。

## 公開レビューと修正

[PR #57](https://github.com/pero3dev/ai-agent-library/pull/57)はマージされ、main CI `35998331013` とPagesは成功した。CI artifactと公開6記事HTMLの同一性を含む機械検査は58/58成功したが、独立した公開画像レビューはchanges_requested / medium、必須修正1件だった。数値計算の誤りではなく、棒と下段数値の意味を見分けにくい表示が対象。

スコア比較には「棒: T=1の確率」「値: ロジット」、乱数比較には「値: 確率」を追加した。既存のモデル・数値・棒の高さ・本文は変更しない。ブラウザーの既存意味検査に、両モードのラベルを検証する条件を追加した。

元公開レビューは新図50枚と旧5記事11枚を目視した。原文のSHA-256は `6cb0ebf8d2cba469a87cf173fc4c76d485f4ace26dd0ba500bed9d9f338fc556`、同名JSONは `131532f22b5028d6e7d3a2ca18ab4236affc49dc72df7a4e55082611991f33d7`。機械成功と画像レビューの要修正を分けて保持し、修正版の公開確認へ流用しない。

## 検証と公開

共通 `npm run check` は455試験中454成功・1 skip、終了コード0（527.0秒）。サイト単体は287/287成功、終了コード0（173.6秒）。依存はPR #57で準備した同じlockfileのものを使用した。

`STATIC_EXPORT=1`、`NEXT_PUBLIC_BASE_PATH=/ai-agent-library`の静的exportは成功し、BUILD_IDは `xV5yczoh-4jyfq36pkSM8`、223/223 routes、230 HTML、16章を確認した。このローカルbuildではOGのsite URLは既定localhostであり、公開のCI artifactとの同一性証拠には使用しない。最初に環境変数を付けず成功した通常buildも、公開相当の検証結果へ加算しない。

同じexportに対し、変更箇所の意味検査1件と全23段階の収まり7画面条件を実行し、Chromium（Edge）8/8成功（119.3秒）、WebKit 8/8成功（144.9秒）。いずれも失敗・skip・flaky 0。元PR #57の広い検査を全件再実行したという意味ではなく、ラベル変更の影響範囲に対する再検査である。生のログとJSONは当該制作単位の証拠として保持する。

現在の推論入力digestは `sha256:8247db515cffe45880d01f770f798798a923b9dca53f6cbfab25d2182bff2b6e`。この版のreview/localゲートを記録し、公開ゲートは実際のCI・Pages・公開表示確認まで未受入とする。

独立した修正版レビューは2026-09-24T13:00:02.694Zにapproved / low、必須修正0。1440明暗、1280×720、390明暗でdraw/logitの10状態を実操作し、20 PNGを全件目視した。棒と数値の意味を明確に区別でき、実字形の重なりなし。レビュー原文のSHA-256は `3ed3effe060cd06840c8cbf1f019871960261a0453e36f2a29ae74b196e91ef4`、同JSONは `7126051b2d27846de13df14c7459a9c8042c7613cff34ba29689cdedbc4940d1`。専用ローカルサーバーの停止も確認した。

公開検査は元の6ソースを別の証拠フォルダーへコピーし、既存sampling caseへラベル2条件だけを追加した。推論checker SHA-256は `25533c15df80ed989d920dd87a918f6ba6425489ca3da9f74fd3012b7771c280`。残り5ソースのバイト一致と旧43ケース・数値fixtureの保持を同じ独立レビューで確認済み。これは検査コードの承認であり、新しい公開58ケースの成功ではない。

## 修正版の公開受入

[PR #58](https://github.com/pero3dev/ai-agent-library/pull/58)のhead `007dae479991098e589483ceb7b3ab0ad7646e6a` に対する必須11チェックは成功し、2026-09-24T13:12:23Zに `67b1309fcea8267749be6e52881f3d6a4049ae2b` としてマージした。PR側のdeployはmain限定条件によるskipで、公開成功とは数えない。merge treeは `9133becd45f7e5f1bdac08fc6e8768cdb138bab9`、squash本文の形式と予約内容への一致を確認した。

同じmergeの[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/36004074138)と[Pages](https://github.com/pero3dev/ai-agent-library/actions/runs/36004074138/job/107651395952)が成功。attempt 1、artifact `10809149180`、deployment `6638779591`、status `18784465250`。取得前後の実APIを照合し、CI artifactの6記事HTMLと公開応答のhashが全て一致した。BUILD_IDは `iRnRpU4WRuIJMMLwqJ3Cb`。期待値に公開HTMLやローカルbuildを使っていない。

公開Chromium（Edge）の検査は2026-09-24T13:26:38.551Zから13:32:04.283Zに58/58成功、失敗0、64 assets・157 PNG。原本を変更せず圧縮した[生結果](inference-label-public-evidence/browser-result.json.gz)、[相対索引と要約](inference-label-public-evidence/summary.json)、[CI識別情報とHTML hash](inference-label-public-evidence/artifact-evidence.json)を保存した。展開後の原本SHA-256は `d6f4346386cb0cac64bd01918732a711345591c835af50c939bf164a13b88f42`。生結果の独立レビューpending欄は当時の状態のまま保持する。

[独立公開レビュー](inference-label-public-review.md)と[詳細JSON](inference-label-public-review.json)は2026-09-24T13:46:54.818Zにapproved / low、must 0。修正ラベル10状態を別途実操作し20 PNGを確認、rootの推論52枚と旧5記事11枚も確認した。計83枚の画像確認であり、157枚の全件確認や58ケースの独立再実行という意味ではない。文字領域の交差候補は実画像で字形が分離していることを確認し、一般的な許容閾値は追加していない。

レビュー原本MDのSHA-256は `bd4de0e73d11ceefb9c6330fb7ed4af6fcef894c766e37d9a83ed71d6da0e904`、JSONは `a0d609dd9b5e663212f4f820b10af34173652e12fa9152ce60a3b6eb7b92563e`。リポジトリへの移管では改行をLFに正規化した。旧絶対パスは履歴であり、新PCの実行条件ではない。公開WebKit・物理iPhone/Safari・実スクリーンリーダー・物理印刷は今回の公開レビューの対象外。

今回の6記事すべてに現在の入力版の公開ゲートを記録し、`*-article-acceptance-pr58.json` の固定スナップショット6本を保存した。読み取り専用の受入検査でも6/6 complete。P1は6/15、全記事では6/199の受入完了であり、P0の部分対応2記事を加算しない。次はC1学習パイプラインへ進む。
