# フォルダー選択取消のUI回帰候補

## 目的と範囲

IOS-25で残るfileImporterの取消を公開UIで確認する追加1件を用意する。ユーザーの自律TODO実装と実機未完了記録の許可を継承し、source・記録の6パスだけを扱う。作成元はPR #269同期commit `2457b070afcf4793fab1a58905e1fadb59eacd30`（tree `bfc6374a9b697ba2724faab5cb68e868bdad9999`）で、App/PBX・Native helper・既存runtime CIは変更しない。

本文は[UI source](../../../ios/AILibraryUITests/PublishedReaderUITests.swift)へ追記し、既存14件のhelper・assertion・selector・gestureをbyte単位で保持する。source数はPublished13＋Native2＝15で、専用performance1は別。これは実登録・実行15件の証拠ではない。

## 回帰候補と検証

Transformerのしおり・自己注意位置を保存して再起動し、通常検索・学習タグと件数を設定する。公開のファイル更新操作から新しく現れた一意のnavigation contextと配下の取消だけを使い、フォルダー選択やimportは行わない。取消後のquery/tag/要約/件数、picker消失、content errorがないこと、More/Aboutの再操作を確認し、最後に再起動して通常のしおり・読書位置へ直接復帰する。公開UIの状態確認であり、保存ファイルのraw bytesやcatalog SHA一致を示さない。

source SHA-256は`c770fdc365b3a7ea973b9b09c45553d3d5b5880caa64b0e3b6af6bb538e110db`。独立sourceレビューは必須修正なしで、小さな探索用Draftの候補として承認された。証跡path/SHAは同名JSONに保存する。既存14件の完全保持、scope差分、文書・JSON・形式の静的確認と、Swift型検査・実登録・実UIは分けて扱う。

## 未確認と公開条件

system pickerのAX、非空の一意な新bar名、日本語の取消、app query内の可視性/hittabilityは未観測。未知・重複・欠落時は診断付きで失敗し、global Cancelや座標fallbackを使わない。取消がAppのfailure経路へ届くかも未確認で、blocking content errorが出たらassertionを消したりalertを自動dismissしたりせず、内容を保持して診断する。

このsourceのSDK型検査・compile・実登録・runtime・実機は0回。前版の型検査や実行を新sourceへ読み替えない。公開先mainの依存Draftとし、前提263〜269のmain統合後に通常syncで固有6パスへ限定し、正確な最終headの機能UI15件と必要チェック・独立レビューが揃うまでmergeしない。system pickerの実観測とscope全体の受入は初回Hosted以降に残す。
