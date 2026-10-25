# 章・タグ・学習ルート・用語集のネイティブ接続

## 作業契約

- 目的: IOS-14の検証済み学習案内をStoreとSwiftUIへ接続し、章順・タグ・ルート・用語集から本文へ進めるようにする。
- 許可根拠: 完成版TODOの優先順で自律実装し、作業単位別commit・PR・main統合を行う依頼。新しい実機確認は未完了として記録する。
- 基準・所有: [Swift consumerのPR #256](https://github.com/pero3dev/ai-agent-library/pull/256)。Core担当はModels・LibraryStore・LibraryCoreTests、UI担当は一覧・学習View・reader接続・UI/helper試験・Xcode登録、親は手順・計画・記録・Gitを担当。他者の変更を戻さない。
- 検証・終了条件: 旧索引不在時とfixtureを保ち、不正学習情報でも本文を保持する。型付き参照・取消し・表示/保存位置を検査し、Mac実行・SDK compile・Hosted UI・実機を区別する。
- 適用: [共通契約](../../../AGENTS.md)、[学習形式契約](../../../ios/renderer/learning-index-schema.md)、[完成版TODO](../../plans/engineering/ios-app-completion.md)。

## Storeと一覧

本文snapshot・学習案内・学習エラーを背景で検証し、単一のPublished bundleとして公開する。不在の旧3/4記事は従来の表示を保ち、不正な補助JSONは学習エラーだけを表示して、正常な本文・保存記録を利用できるようにする。再試行とimportにも同じ適用を使い、古い読み込みの完了が新しいsnapshotへ混ざらないgeneration guardを置く。

索引がある一覧は章README順を用い、章のarticle IDsと表示scopeの共通部分だけを選ぶ。カテゴリ値から章を推測しない。章・難易度・しおり・本文検索・タグをANDで組み合わせ、0件から条件を解除できる。タグは検索sheetから選び、条件を保存しない。旧索引不在時のカテゴリpickerとfixtureの対象範囲は維持する。

importのレビューで、保存先の切替後にTask cancellationを理由としてStoreの公開を捨て、pointerだけが新版になるP2を発見した。開始前の取消しは書き込まず、commitが済んだ成功結果はStoreへ適用するよう修正した。読み取りloadの取消し・世代guardは維持し、同期subscriberが呼び出しchild Taskを1回だけcancelする回帰で、親Task・保存先・snapshot・索引・学習記録の整合を検査した。

## 学習ガイドとリンク

全記事候補の「学習ガイド」に章・A〜Hルート・用語集を設ける。ルートの条件文と全手順、用語の定義・英語・全関連リンクをnative Textで表示する。用語検索は名前・英語・要約のAND正規化検索。chapterリンクは他条件を解除して対象章へ、articleリンクは見出し付きReaderRouteへ、externalは明示tap時だけHTTPSへ進む。

記事内の正規URL`https://pero3dev.github.io/ai-agent-library/glossary`は、対応する検証済み索引がある場合だけnative用語集へ接続する。fragmentなしは一覧、既知fragmentは定義へ進み、未知fragment・別host・query・索引なしは従来のbrowser fallbackを保つ。本文の数式リンクも既存のopenURL経路を共用する。sheet内の本文/章リンクは閉じた後に遷移し、元記事のしおり・位置とfixture保存の分離を維持する。

本文の形式・manifest・音声範囲は変えず、HTML・WebViewや新しいlink kindを導入しない。親PR #254で実装・独立レビューしたreader scroll修正も維持する。版は0.2.9（11）。既定カタログは3記事のままで、学習案内付き全記事は明示生成の候補で確認する。

## 実施した検証と残件

Macのactual Store回帰12件と、実3/4/199記事のload・順序・タグ・本文・保存/Package非更新を確認した。従来のCoreSmokeとPackageAuditの明示source-listも3/4記事で成功した。新しいnavigation helperのFoundation XCTest4件が成功し、canonical URL・fallback・typed target・検索・章表示を検査した。

独立レビューはCore3ソースをP2修正後に再承認し、UI7ソースと追加3UIシナリオも承認した。最終Xcode16.2・iPhoneSimulator18.2の全target build-for-testingは成功し、単体101件・UI8件をcompileした。これはXCTestや画面実行の成功ではない。共通checkは722件中707成功・15skip・失敗0で、文書・リンク・配置・形式も成功した。

UI8件は既存の本文/目次/しおり復帰、大図・長文・最大表の5件を維持し、タグの0件解除、Aルート条件文/章先頭順/記事、用語検索から関連本文と元記事の位置/しおりへの復帰の3件を追加した。通常3記事jobは旧2件だけを使う。full UIは独立した原文件数を照合し、不足をskipしない。

最終feature headのHosted単体/画面/Release検査、VoiceOver・最大文字・実機・性能とIOS-14全体の受入は未完了である。旧版からの既定199記事への切替、独立更新・音声拡張・配布もこの単位に含めない。[JSON](ios-native-learning-ui.json)へ検証面と凍結SHAを記録する。
