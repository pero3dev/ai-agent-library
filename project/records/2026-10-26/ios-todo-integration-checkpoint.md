# iOS TODOと統合状況のチェックポイント

基準はmain 955c066c8dc0fdbedf6f0c845a461abda39ac476（tree 9d2525e28ce3d9b6659eeac57b0b6f910e7e262b）、App 0.2.15（17）。この基線で成立した完了条件と、別headで進行中の作業を分けて記録する。所有は本記録・同名JSON・[完成版TODO](../../plans/engineering/ios-app-completion.md)・[計画索引](../../README.md)の4ファイル。App・生成コード・既存実施記録を変更しない。

## mainで完了とする4項目

既存の8件にIOS-02・10・13・14を加え、**12／32件**とする。他28行の状態と全32行の完了条件は維持する。

| ID | 今回の完了判定 | 含めない事項 |
| --- | --- | --- |
| IOS-02 | 既存public標準Hosted macos-26／Xcode26.6・SDK26.5を、SDK26の最低条件に合うunsigned Archive用技術環境として採用。Release Archive・実199記事・MachO/dSYM監査の成功を利用 | 配布方式・費用・契約・署名資格・実提出、local Mac容量と実機symbol cache全量測定、最新OS27受入 |
| IOS-10 | 見出し/block・記事間fragment・検索leaf・明示HTTPSのnative導線とPR268〜270の公開UI回帰 | IOS-11のblock内精度、実回転・最大文字・VoiceOver、表cell/codeの文字座標 |
| IOS-13 | 全published199記事・全図数式を標準生成し、manifest込み626ファイル・列挙625SHA・422PNGを正本独立監査と実consumerで検証 | 全記事の実機tap・性能予算 |
| IOS-14 | 共有正本から16章・8ルート/37step・164用語・タグ/難度と前提405件/関連1411件をlocal参照へ接続し、代表導線を確認 | 全リンク個別tap・新しい機内モードUI・外部サンプルの本文化 |

根拠は[標準生成](../2026-10-25/ios-published-development-default.md)、[学習案内生成](../2026-10-25/ios-learning-index-generation.md)・[consumer](../2026-10-25/ios-learning-index-consumer.md)・[画面](../2026-10-25/ios-native-learning-ui.md)・[章リンク](../2026-10-25/ios-native-chapter-link.md)と[検索到着回帰](ios-search-hit-ui-regression.md)。基線の5記録のSHAと32項目を再照合し、[JSON](ios-todo-integration-checkpoint.json)へ保存した。旧文書の「未commit」「通常3記事」「前提PR待ち」は作成時点の履歴として残す。

技術環境の採用は既存の無料標準CIの利用範囲であり、新費用・権限拡大・local OS変更を含まない。最低SDK条件と最新OSでの受入を分け、実提出時は[Appleの要件](https://developer.apple.com/news/upcoming-requirements/?id=04282026a)と[提出案内](https://developer.apple.com/app-store/submitting/)を再確認する。配布資格やStore提出の採択を代行したとは扱わない。

## 統合済みmainとPR275の結果

[PR269](https://github.com/pero3dev/ai-agent-library/pull/269)・[PR270](https://github.com/pero3dev/ai-agent-library/pull/270)は通常の保護付きPRでmainへ統合済み。単体133件（131成功・private入力2skip）、選択UIは269が20件、270が機能15＋geometry6の21件で、Releaseと統合後のNative/full/Release/deployが成功した。

[PR275](https://github.com/pero3dev/ai-agent-library/pull/275)はhead 89e2a4e719c34ace5337327b15a6039c0da0f4ee、App 0.2.16（18）の**未マージ作業**。Native run40272190218/job121407195393は単体152件（150成功・private入力2skip）・UI2件・Release成功。Full run40272190196/job121407195456も同じ単体件数・UI22件・Releaseが成功し、同一レイアウトのrow25復帰caseは284.474秒で成功した。この秒数はcase全体の実行時間で、復帰待ち時間やSLOではない。

iOS26.5の別run40272190226/job121407195365は、初回の数式目次到着まで通過し、再起動後の「続きを読む」で記事先頭が表示されたため失敗した。結果はUI1成功・1失敗、失敗case115.883秒、3記事本文case117.666秒である。追加Appログのgeometry10件は先頭位置を測定していたが、要求の終了状態と保存データが無く、原因は未確定。iOS18.5側の成功でこの失敗を上書きせず、診断・修正とexact-head検証を別作業に残す。過去の失敗や生証跡はPR275の実施記録で保持し、ここで再解釈しない。

## 未完了と次の作業単位

IOS-11の位置復帰と改訂・回転・最大文字・VoiceOver、IOS-18の初期error/再試行/削除routeの実UI、IOS-25の初回offline/コピー結果/旧保存移行は未完了。物理端末の追加操作はユーザー指定によりスキップできるが、IOS-23等を成功へ変えない。

SDK27・Core・Icon・Copy・音声identity・Privacy・運用/Store文書は未統合の別候補で、私有sourceレビューと実結果を区別する。音声は1本のまま。公開方式・権利・費用・契約・アカウント/署名資格・公開ポリシー/問い合わせ先・TestFlight/Store提出は未採択・未実施として残す。PR240だけに許可された限定復旧は終了しており、保護回避を引き継がない。

1. 本チェックポイントを通常docs PRとして確認し、実merge SHAとmain検査を記録する。
2. PR275の診断・修正を独立単位で検証し、必要な最終headの検査とレビューが揃ってから通常統合する。
3. 実mainへIcon/SDK27/Core等を最小差分で順にbindし、IOS-18/25の不足回帰、音声/Privacy/運用案をそれぞれ検証する。

## この記録の検証範囲

今回の準備はmain955からの読取、一意insert＋4行の置換、32項目・根拠SHA・逆適用・4パスのpure tree再構築、文書/リンク/公開記録/Git形式の静的検査まで。新しい生成・SDK・Swift parse・Simulator・実機・CI・ネット・API・Git mutationは0。実行済み結果は上記の既存実績と別headの証跡に限る。
