# 前面画面のバーで本文の可視範囲を判定する

## 作業契約

- 目的: IOS-25の専用記事で、背景navigation barを遮蔽領域へ混ぜるUIテストの誤判定を修正する。
- 基準: 本文の配置回復PR #266 head `9c7415576bab478e93e6151cc1bac2385d041c6a`へ積層し、統合時は最新mainへ通常同期する。
- 所有: NativeReaderUITestsの幾何helper、本記録と索引。他者の試験・製品コードを戻さない。
- 許可根拠: ユーザーによるTODOの自律実装・段階的commit/PR/main統合の依頼。実機追加操作は求めず未完了で残す。
- 終了条件: 最終内容の独立レビュー、正確なheadの通常CI・単体・UI・Release、および専用記事を含む後続候補での実UIを確認する。[AGENTS](../../../AGENTS.md)・[Git規約](../../../harness/git-rules.md)に従う。

## 観測した誤判定

PR #265の全記事run40198387801では、CASE-LINK-01の見出しが画面に表示されていた。見出しのYは139〜165.3、前面barの下端は125だったが、AXに残った背景barの下端156.1も旧helperがviewportへ反映し、見出しの先頭を不可視と判定した。画面表示と幾何計算の不一致であり、本文の目次未到達とは分ける。専用記事は検索からも同じ節へ入るため、この最終画面だけで目次callbackの実行成功まで証明しない。

候補は、有限で画面内にあるbarと、その配下のenabled・hittableなbuttonを証人にして前面barを一意に選ぶ。全体包含と最終targetのhittable条件は保持する。前面判定が不明または複数の場合はunknownとし、直接の最終判定では明示的に試験を失敗させる。「見えていない」への変換で陰性assertが成功することを防ぐ。

一方、正常なシート遷移中の待機ではunknownを未到達として扱い、positiveなpollの初回で失敗させない。後続の検索UI候補にあるpositive predicateの1か所は、このpoll用helperを使う。既存case・selector・assert・15秒の待機とgestureを変えず、製品側の本文回復はPR #266と区別する。

## 検証と残件

候補から抽出した実Swift幾何codeの20条件はMacで実行成功した。Xcode16.2・SDK18.2では、候補Nativeと後続の検索UIを含む私有probeを組み合わせた限定型検査が成功した。probeはNative2＋Published12の機能14件で、main260の機能10件・remote265の12件と分ける。性能テストは別であり、このPRへ後続検索2件を混ぜない。

sourceと単一callsiteの独立レビューを確認した。 共有workspaceの後続候補を含むsuperset共通検査765件は750成功・15skip・失敗0で、最終treeそのものの検査ではない。未収録のClock/CSV36件とSDK署名7件を含むため、exact共通検査はHostedで取得する。初回の私有検証コードのimport不足と、修正後の正式な成功を私有証跡で区別する。実際のbar配下controlのhittability、専用記事・表・検索でのUI、VoiceOver・最大文字・実機は未確認で、Hostedの成功待ちとする。IOS-25全体は完了にしない。[JSON](ios-foreground-viewport-regression.json)に証拠と段階別の範囲を保存する。
