# 読書記録の書き出し取消後の保持を検査する候補

2026-10-31。自分用初版のIOS-22・25を進める独立したUI回帰候補である。採用済みmain `88c9ac3`の既存APIを照合し、書き出し取消の検査を進める。文字サイズの回帰検査PR #320は未完了の別単位として保持する。

## 目的と所有範囲

[既存の手動書き出し](../2026-10-28/ios-reading-backup-export.md)の公開操作を通し、取消後もTransformerのしおりと非先頭の読書位置を使えることを検査する。既存の復元picker取消とは別の経路である。

変更は[ReadingRecoveryUITests.swift](../../../ios/AILibraryUITests/ReadingRecoveryUITests.swift)の1ケースと専用helper、この記録・[検査範囲JSON](ios-reading-export-cancellation.json)、共有索引2本だけとする。元の4ケース・全helperは、追加部分を除けば全文が元に戻る。App、PBX、保存形式、DEBUG seed、workflow、Native基底helperと全記事は変更しない。

Rootは、main88のReadingRecoveryとNative基底APIだけで検査を構成できることを照合し、通常採用待ちだった別作業から切り離した。PR320の未公開App・ReaderReflow・workflow・helper・unit・記録を持ち込まない。main88のCore記録と既存索引本文も保持する。

## 公開UIの検査範囲

隔離suiteの部分復旧を起点に、Transformerのしおりと「自己注意の数式」の位置を用意する。「続きを読む」で現在位置を確認し、明示復旧を確定する。続いて「その他の操作」から書き出し画面を開き、取消で一覧に戻る操作を2回行う。同じsuiteでアプリを終了・再起動し、他記事や目次を挟まず「続きを読む」からしおりと見出しが完全に見えることを確認する。

保存画面は、開く前になかったnavigation barのidentifierとlabelの組、そこにある一意な保存・取消操作、一意な既定バックアップ名の編集欄を合わせて特定する。取消が有効で操作でき、各frameが有限・空でなく画面に収まることを条件にする。復元pickerの固有identifierを流用せず、不明な画面は失敗とする。保存操作・provider選択・保存先URLは実行しない。

`保存`／`Save`とファイル名による識別は、まだ実画面で受け入れていない候補である。最初の失敗時だけ写真と1 KiB以内の固定文脈を残す。文脈は理由・試行番号と判定中に得た件数に限定し、追加の階層取得は行わない。

## 検証と残件

コードはSource3の`80f822…`を保持し、その独立静的レビューはP1・P2とも0件だった。以前の9eca構成でのUI6型検査成功とSource5レビューは履歴に残し、今回のmain88構成の成功には転用しない。

今回のmain88向けSDK検査は、空き容量の事前条件で停止し、入力コピーもcompilerも開始していない。Rootが後で測った14:05 UTCの空きは552,894,464 byteで、既存の734,003,200 byte下限未満だった。これは事前条件判定そのものの瞬間の実測値ではない。ソース・型検査の失敗とは判定せず、現在構成のSDKは未確認とする。

新しいSource5の`npm run check`は未実行である。純粋な全tuple照合、追加部分の全文逆変換と既存APIの確認までを記録する。Rootは静的レビューと対象Markdown lint後にDraft checkpointを作成でき、通常mainへの反映前に正確なheadのHosted compile・Native8・完全な共通検査と必要CIを通す。現在構成のグラフ・記録の追補レビューも後続とする。

[Native CI](../../../.github/workflows/ios-native.yml)の既存クラス選択により、NativeReader3件とReadingRecovery5件の計8件を予定する。Fullの固定26件は変えない。実provider保存・外部ファイルの内容・UI越しのraw全byte同一性・最低iOS17と現行iOSでの新ケース・VoiceOver・実機・署名更新後の保持は未完了である。[完成計画](../../plans/engineering/ios-app-completion.md)の32行・完了14行とIOS-22・25未完了は維持する。
