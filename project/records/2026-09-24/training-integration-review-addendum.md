# C1 共通統合 独立コードレビュー追補

判定: **approved / low**。must 0、should 0。初回のchanges_requestedと再現記録はそのまま保存しています。

- レビュアー: 01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/pretraining_source_evidence
- 実レビュー時刻: 2026-09-24T14:13:30.053Z
- 対象: 初回15ファイルの最終hashを同名JSONに記録。初回13ファイルのうち変更は受入moduleと受入unitの2ファイルだけです。他11ファイルとbrowser仕様2ファイルは同一hashでした。

## C1-READ-01の解消

C1 configに明示したrequireReadingStageにより、登録blockGroupsからREAD集合を求め、動的論点の到達段階との交差を必須にしました。旧6記事の手動補助割当は変更していません。

初回と同じ隔離再現をやり直し、runtime [1]だけの割当がassignmentCurrent=falseへ変わることを確認しました。追加unitは[1]の拒否に加え、[1,2]と[0]を受け入れること、正しいfixtureゲート下のcompleteも検査しています。

- 受入module SHA256: `03910e17e5fe049e2162610ffe734cfb28e53b2850cd2a573118a136e267bb7b`
- 受入unit SHA256: `fc43cafb3bbc7b9979dd26b9eb77de7d41d8681c66feb01537cf6c876edcb11b`

## 独立検証

修正後の受入unitを全32件再実行し、32/32成功・失敗0・skip0・exit0、146723.7163msでした。初回のAST/MDX85件は対象コードが変わっておらず、その結果を維持します。現在の異なる試験の内訳は85+32=117件ですが、修正後に117件を一括再実行した意味ではありません。初回116件と再実行32件を足して148件と数えません。

training.spec.mjsはPlaywright --listで20件を確認しました。元記事・固定期待値・READ/全段階・selector比較全表示・外部権限経路・keyboard/print/noJSと7viewportをコードレビューしました。loading追加2件は旧18件を保持しています。実ブラウザー実行と実画像の可読性判定は後続です。

## 受入範囲

元AST保持、2図10stage/9READ、34topics21dynamic13static、47inputs、4有効化組合せ、MDX制約、旧6記事の共有入力失効とPR56固定5/PR58固定6の履歴扱いを承認します。記事ゲートや図全体の公開受入をこのコードレビューだけで承認してはいません。

- This is independent code and source-integration review only; it does not approve completed scene semantics, visual quality, browser behavior or public deployment.
- Browser specification/loading additions were read and training20 test discovery succeeded; no browser run was performed by this reviewer.
- No build, Git mutation, product edit or generated-file edit performed.
- Root must finish full validation, independent scene/visual review, final candidate input digests, old-six regression and all-seven release acceptance.
