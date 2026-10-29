# 読書位置としおりの明示復旧UI回帰

2026-10-29。状態は私有候補の公開準備であり、新ケースの実UI成功ではない。ユーザーの継続した自律実装・通常PR／保護されたmainへの統合依頼に基づき、自分用初版の読書記録を確認する小単位を準備する。実機確認を未完了として進めてよいという許可を引き継ぎ、新契約・課金・配布・端末操作は行わない。[自分用の方針](../2026-10-28/ios-personal-use-scope.md)と[完成版の計画](../../plans/engineering/ios-app-completion.md)の範囲を保つ。

## 基準と所有範囲

元のSource1はmain `cc2f0aec9e6d741a431dd1fc02250439b8dd0c27` のファイルを基準に作成・独立レビューした。今回の索引と公開準備の著者baseは `11ea9663147600824c5d286eb685fe0b2f1e6181`、tree `9e76cb7ac08b36002808f0f56e6e2dff8a73c495` の2,810パスである。対象の旧UIファイルと8つの読取contextがこのbaseでも同一であることをGitのblob／SHA-256で照合した。11eaはPR #299の候補であり、mainへ統合済みとは扱わない。

所有する公開候補は `ios/AILibraryUITests/ReadingRecoveryUITests.swift`、この記録のMarkdown／JSON、`project/README.md`、完成版計画の計5ファイル。著者base11eaでの当時の準備では、既存3ファイルの更新と新規記録2ファイルで、候補を適用すると2,812パスとなる見込みだった。Rootが後で実際の採用済みmainと結び付ける当時の条件は、下記の現main結び付けで確認した。App0.2.23（25）、fixture、Store、保存形式、provider、workflow、アクセシビリティID、既存のselector・predicate・waitは変更しない。前後の索引本文は履歴として全て保持する。

## 現在mainへの結び付け

PR #299のiOS17環境準備は別の小単位として続け、本UI回帰は採用済みmain `cc2f0aec9e6d741a431dd1fc02250439b8dd0c27`（tree `e1647536dbf7e040e2f3b36cd4f7b0647e86272a`、2,805パス）へ独立して結び付ける。著者base11eaとの差は未統合のiOS17試行のSource3・記録2と索引2の計7パスだけで、App・UIテスト・記事・生成スクリプトの全tupleは一致する。iOS17試行の実行結果や必要なSourceをこのPRへ取り込まない。

索引は追加した1段落だけをmainの既存本文へ載せ直し、main側の既存段落を全byte保持した。Source1は承認済みec385から変えず、記録2と合わせた更新3・新規2により2,807パスとなる。著者base11eaでの共通1174件は当時の証跡として残し、iOS17用Node17件のない実main側で共通検査を取り直した。1157件中1142成功・15skip・失敗0、約39.028秒でnpm run checkがexit 0となった。Source1は不変で、その後に記録・索引だけを限定静的検査した。Rootの結び付けと記録更新は、新ケースの実UI受入を示さない。

## 追加する境界

既存の明示復旧UIケースはしおりの保持を検証し、通常のreaderの再開とCoreのlive position保持にも別の検査がある。この候補は、それらを実行済みの新ケースへ読み替えず、部分復旧中に読んだ位置を明示確認後の再起動で保持する組み合わせを補う。製品不具合が既に確認されたという主張ではない。

新ケースは `testConfirmedRecoveryPreservesCurrentPositionAndBookmarkAfterRelaunch` の1件。既存の部分復旧用suiteでTransformerを開き、現在のしおりを公開UIで付け、目次から非先頭の「自己注意の数式」へ移動する。一覧へ戻って既存の絞り込み解除を使い、「続きを読む」から目次を再操作せず同じ見出しの完全表示を確認して、一覧へ戻る。

次に既存の正確な復旧sheetと、その中の確認ボタンを使う。sheetが閉じて復旧noticeが消えた後は、別のreader・検索・目次を挟まず、アプリを終了してnotRunningを確認し、同じ分離suiteで再起動する。直ちに「続きを読む」から本文・非先頭見出しの完全表示・現在のしおりを確認する。復旧後に別操作で読書位置を書き直し、回帰を隠す手順は入れない。

復旧前の再開は公開UIによる準備状態の観測に限る。`readerID`によるidentity変更は内側のNativeReaderに適用され、外側ArticleReaderViewの`requestedHeading`が明示的にnilへ戻る証明ではない。この前半を、キャッシュ非依存のwriter完了やraw defaults保存の厳密な証明とはしない。部分復旧中は通常のdefaults保存も止めている。後半の終了・再起動後の判定が、外側・内側の一時状態を消した上で位置としおりの保持を確認する主な境界となる。実SwiftUI lifecycleとこの操作の成否は未実行である。

## 確認済みの区分

| 区分 | 確認した内容 | 広げない範囲 |
| --- | --- | --- |
| Sourceの静的照合 | 新1ケースの2,171 byteを逆除去すると、旧3件・全helperへ全byte一致。待機や判定の弱化・sleep・位置seed・環境hookなし | 実アプリの操作成功 |
| 狭いSDK18.2型検査 | 既存のSwift5／XCTestレシピを再利用し、base helperと候補の2ファイルをarm64 iOS17 simulator targetでtypecheck。exit 0、13.599697秒、stdout／stderr 0 | Appのcompile／link／build、Simulator起動、実iOS17／18.5のUI |
| Source1の独立レビュー | 私有候補をP1／P2なしで受入れ、前半の状態観測と後半のfresh process判定の限界を区別 | 最終5ファイルのレビュー、実CIの受入 |

型検査時の所有する一時module cache約69.3MBは削除済みである。この公開準備ではSDKやUIを再実行していない。証跡のSHA-256は[機械可読記録](ios-reading-recovery-position-ui.json)で確認できる。生ログやローカルのユーザープロファイルを含むパスを公開記録へ複製しない。

宣言上、ReadingRecoveryは3件から4件、Nativeの選択対象はNativeReader 2件と合わせて5件から6件となる。既存Native workflowがクラス全体を選ぶためで、workflowの変更は不要である。Fullは2＋15＋6の23件、別PR #299候補のiOS17 pilotは46＋1の47件で、この追加ケースを選択しない。いずれもSource上の集合であり、新ケースが1回開始・1回成功した実件数ではない。

## 後続と未完了

Root報告の2026-10-29 11:17:26Z時点では、ユーザーがGitHubのメール確認を行い、PR #299の本文更新と同一Draftの再openに成功した。これを本候補の実CIやmain統合へ転用しない。本候補はprivate準備だけで、新PR・API変更・Git変更を行っていない。

Rootは著者base11eaの全2,810 blobを照合した隔離コピーへ候補5を重ね、共通1174件中1159成功・15skip・失敗0、約40.145秒を確認した。lockfile不変で準備済み依存を再利用し、外部IP通信を禁止してlocalhostの試験だけを許可した。Source1は共通検査後も同一で、記録2だけの追記を限定静的検査する。これは実UIの成功ではない。その後は上記の現在main cc2に対する結び付けと共通検査を採用し、索引・配置・Git形式、最終5ファイルの独立レビュー、正確な新headでのHosted実行を行う。新ケースの1開始／1成功とNative UI 6件をraw結果と独立照合し、必要CIとReady後の必須11検査が揃ってから通常のmain統合へ進める。この候補にはそれらの結果はない。

TODOは32行／完了13行を全byte保持する。IOS-22／25、全復旧範囲、厳密な本文内位置・実機・VoiceOver・上書き後のデータ保持は未完了のまま残す。古い版や別ケースの成功を今回の受入に移さない。
