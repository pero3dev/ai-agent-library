# ライブラリMCPの未見言い換え検索評価

2026-11-04。Issue [#349](https://github.com/pero3dev/ai-agent-library/issues/349)の実施記録です。

## 作業契約

- 目的: 未見の言い換え30件を比較前のcommitで固定し、既存方式と候補方式の検索精度・容量・時間を比較して採否を判断する。
- 元HEAD: `e617bcac093681aebdf935fe60ef586bb56f0e9b`。専用worktreeで作業し、他者の差分を取り込まない。
- 所有: `examples/python/library-mcp-server/`、`plugins/ai-agent-library/mcp/`、`examples/tests/`、本記録。採用時に必要な索引生成変更は担当者と調整する。
- 規約: リポジトリの`AGENTS.md`、`CONTRIBUTING.md`のサンプル節、`harness/writing-rules.md`のサンプル規約、`harness/git-rules.md`を参照した。ROADMAPでは初版・拡張完了後のサンプル保守として扱う。
- 許可: 本セッションの「#343〜#349すべてCloseまで自律的に進める」という依頼。root担当がPR・マージ・公開・Closeを統合する。外部API・埋め込み・パッケージ公開は行わない。
- 終了条件: 未見セットの先行commit、Top1・Top5・MRR@5と採否、容量・時間・応答上限の記録、採用時の両コピー同期と単体・新旧stdio回帰、rootの全体検査。

## 比較前に固定する設計

[`evaluation-unseen.json`](../../../examples/python/library-mcp-server/evaluation-unseen.json)を新しい未見30件とする。20件を検索比較担当、10件を結果を見ない独立のroot担当が作成した。同じCodexによる別担当の視点であり、実利用者や人間による独立出題とは数えない。質問と期待slugは比較後に変えない。

既存[`evaluation.json`](../../../examples/python/library-mcp-server/evaluation.json)のdevelopment20件だけで候補を選ぶ。既知になった旧holdout10件は診断用に残し、ラベルを変更しない。候補は見出し重み4（現行1）と、見出し単位の本文BM25を現行得点へ加える方式とする。developmentのTop5、MRR@5、Top1の辞書順で候補を選び、同率なら現行を優先する。

新しい未見セットは、選定した候補と現行を最後の同じ実行で一度だけ比較する。同じ辞書順で改善し、Top5が低下せず、索引4 MiB・応答12,000文字を守る場合だけ採用する。未見の結果を見て候補・重み・ラベルを調整しない。本文候補の一時索引は公開契約を変更せずローカルで測る。採用しない場合はランタイムと公開索引を変えない。

## 結果

未見セットをcommitで固定してから記入する。
