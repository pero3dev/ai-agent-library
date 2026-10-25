# 遅延する図の寸法予約と見出し位置の安定化

## 作業契約

- 目的: PR #240統合後のmain CIで失敗した見出し移動を調べ、図の読み込みで本文位置が変わる原因を修正し、通常の必須CIで確認する。
- 許可根拠: iOSのTODOとmain統合を自律的に進める依頼の検証前提の修正。限定管理者例外はPR #240で終了済みで、この修正は通常のPR・11必須チェックで統合する。
- 基準: main `9c2b0466ea82886985b921fa9e0fffe4ae9e9231`。現working treeのwebsiteは同じ依存修正を使い、iOS作業とは所有を分ける。
- 所有: web担当はMermaid資産生成・寸法helper・StaticMermaidと対応する単体・ブラウザー回帰。親は記録・検証とGitHub統合。生成物を追跡せず、iOSや他者の変更を戻さない。
- 方針: cache hitでも生成SVGの寸法mapを更新し、両テーマのプレビュー・原寸表示へSSRで寸法を与える。図が届く前から高さを確保して実座標のずれを防ぎ、目次の現在位置条件を維持する。
- 検証・終了条件: 図の応答を保留する回帰で旧出力のずれを確定し、修正後は到着位置と目次選択を両テーマで保持する。寸法の妥当性・cache経路・clean buildと最終CIを確認する。
- 適用: [共通契約](../../../AGENTS.md)、[サイト検証](../../../CONTRIBUTING.md)、[Git規約](../../../harness/git-rules.md)。

## 調査結果

mainの[CI実行](https://github.com/pero3dev/ai-agent-library/actions/runs/40155939255)は、ブラウザー674成功・5skip・1失敗だった。失敗はreading-layoutの見出しリンクと現在位置で、チェックリストを期待した場所が「詳細: 判断フロー」になった。最終PRの検査とmain実行の結果を区別して記録する。

既存の焦点試験6回は成功したが、判断フローのSVG応答を保留する追加回帰で両テーマとも失敗を再現した。チェックリストのdocument座標が2789.625から3930.609375へ約1141px下がり、図の高さと一致した。lazy画像4本に寸法属性がないため、図の読み込み後の高さ確定が本文を押し下げる。74図×2テーマの既存SVGには有効な幅・高さがあり、これを生成時に利用する。

寸法manifestをcache hit時も再生成し、通常・原寸表示の両テーマへSSRのwidth・heightを付与した。旧出力で失敗した遅延2件を含むreading-layout5件は成功した。website単体97件（追加6件）、実ブラウザーでのSVG新規生成1図×2テーマとcache再利用も成功した。公開相当clean buildは230/230経路・232 HTML、SSR画像296本は148 SVGの寸法と一致した。独立レビューでも追加6件を再実行して成功し、修正必須事項はなかった。

途中のPATH不足とSTATIC_EXPORT未指定による検証準備失敗は、最終の公開相当build・ブラウザー成功とは分けてローカル証跡に保持する。

[PR #248](https://github.com/pero3dev/ai-agent-library/pull/248)の11必須検査が成功し、例外を使わずmain `c4eb4927daf62e5decbf2e4d618474775b4ec331`へsquashした。実tree・正規メッセージを照合し、PR CIと[main CI](https://github.com/pero3dev/ai-agent-library/actions/runs/40159510477)はいずれもブラウザー677成功・5skip・失敗0、Firefox14成功だった。Pages deployも成功し、[対象の公開ページ](https://pero3dev.github.io/ai-agent-library/docs/architecture/workflow-vs-agent)のMermaid画像4本にwidth・heightが付いていることをHTTPで確認した。公開全経路の再確認とは区別し、[JSON](website-mermaid-layout-stability.json)へ実施範囲を保存する。
