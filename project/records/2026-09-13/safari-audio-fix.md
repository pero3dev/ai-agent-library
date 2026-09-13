# Safari の音声読み込み失敗の調査・修正

記録日: 2026-09-13。状態: 修正・ローカル検証を実施し、公開確認へ進行中。

## 作業契約

- 目的: iPhone 12 の Safari で「音声を読み込めませんでした」となる原因を切り分け、再生互換性を修正する。
- 依頼・許可根拠: ユーザーの「原因を調査して解決に向けて自律的に作業を進めてください」。既存機能の不具合対応として、調査、修正、ローカル検証、独立レビュー、修正 PR・CI・通常のマージと既存 Pages への反映確認まで進める。新しい有料サービスや音声の再制作は含めない。
- 入口: `AGENTS.md`、`CONTRIBUTING.md` のサイト変更・提出前検証、`harness/git-rules.md`、`project/README.md`。ROADMAP の記事タスクとは別の既存サイト不具合で、[音声学習計画](../../plans/engineering/audio-learning.md)と[運用開始記録](audio-learning-launch.md)を参照する。
- 元 HEAD: `1d8b6e22798ab3ee8435f368887760aeea68a0ed`。作業 branch: `fix/safari-audio-playback`。
- 所有範囲: `website/` の音声再生処理・関連試験・検証設定、必要な CI 検証、音声配信検査、本記録と `project/README.md`。他者の作業や生成物の正本外編集は行わない。
- 必要な検証: `npm ci`、`npm run check`、サイト単体試験、公開相当の静的ビルドとブラウザー試験、実配信のヘッダー・Range・MP3 の確認、最終差分の独立レビュー。
- 終了条件: 原因候補の根拠と修正前後の確認結果を保存し、レビュー・CI を通した修正の公開反映を確認する。WebKit の自動試験と iPhone 実機での確認を区別し、未確認の実機動作や公開状態を成功扱いにしない。

## 調査

- 報告された文言は HTML audio の `error` イベントで設定される。再生許可が拒否された場合の表示は別で、クリックから `load()` と `play()` は同期して呼ばれる。
- 公開中の 6 本すべてで `bytes=0-1` は 206・正しい Content-Range・2 bytes を返す。一方、最終配信先は拡張子のない GitHub Release asset URL で、Content-Type は `application/octet-stream`、Content-Disposition は attachment だった。
- 既存ブラウザー試験は Chromium と PCM WAV の応答差し替えであり、公開 MP3 の形式判定や Safari/WebKit の互換性を確認していなかった。

## 修正の根拠と限界

WebKit の AVFoundation 実装は、明示された MIME を `AVURLAssetOutOfBandMIMETypeKey` として渡す一方、拡張子から推定した MIME はこの指定から除外する。このため、直接 `audio.src` を設定していた処理を `<source type="audio/mpeg">` に変更し、配信先の汎用 MIME に頼らず MP3 の形式を伝える。[WebKit の実装](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/avfoundation/objc/MediaPlayerPrivateAVFoundationObjC.mm#L853)を 2026-09-13 に確認した。

source の読み込みエラーは親 audio にバブリングしないため、source へ直接 listener を付け、再試行・回の切り替え・破棄時に解除する。エラー後の古い `play()` Promise が新しい状態を上書きしないようにし、通信・デコード・形式エラーの表示も分ける。[HTML のメディア読み込み仕様](https://html.spec.whatwg.org/multipage/media.html#concept-media-load-algorithm)を参照。

Windows の Chromium 153 と Playwright WebKit 26.6 では、実公開 MP3、およびそのファイルをローカルで 302・拡張子なし・octet-stream・attachment・Range 配信した条件で、修正前の src と修正後の typed source の両方が再生できた。これは Windows の再生基盤での観測であり、iPhone の現象の再現ではない。音声形式の明示は根拠のある互換性修正だが、ユーザー環境の原因確定・解消は実機での再試行が必要である。

## 検証記録

- ルートと website の `npm ci`: 成功。ルートでは現在の Node 24.14.0 が依存 ini の推奨 engine 範囲を下回る警告が出た。CI は既存の Node 22 指定を利用する。
- サイト単体試験: 68 件成功、skip なし。プレイヤーの 32 件に source 形式・非バブリングエラー・再試行・位置保持・古い要求の無効化を含む。
- 実公開音声の取得と Windows の再生比較: 成功。調査用 MP3 と比較結果は Git 管理外の `.git/safari-audio-investigation/` に保存し、音声をリポジトリに追加しない。
- `npm run check`: 並行実行で既存 PowerShell 5 のエンコーディング試験がタイムアウトし、2 回失敗した。同ファイルの単独実行は 3 件成功。その後 `node --test --test-concurrency=1 tests/unit/*.test.mjs` で全体を順次実行し、451 件成功、環境による skip 4 件、失敗なし。timeout や本番コードの検査条件は変更していない。
- 全体検査の残りの Markdown lint・記事規約・リンク・TODO 棚卸し・ハーネス検査は個別に実行して成功。Actionlint 1.7.12 の Windows 配布物も公式 checksum と照合して実行し、成功した。
- 隔離音声 fixture と公開先と同じ `/ai-agent-library` の静的クリーンビルド: ともに成功。223/223 ルート、230 HTML のスキップ先、16 セクションへの導線を確認。
- 最終の音声ブラウザー試験: Windows Chromium・WebKit でそれぞれ 8 件成功。MP3 の再生、302 後の別オリジン・拡張子なし・octet-stream 配信、チャプター移動、復元、連続再生、転送先の 503 からの再試行を確認した。
- WebKit のネイティブ音声通信は Playwright の `page.route()` を通らないため、試験カタログの URL だけをブラウザーへ返す JavaScript 内で置き換え、2 つの実 HTTP サーバーへ接続する。公開カタログや生成物は書き換えず、media API もモックしない。従来の通信差し替えが効かないことによる試験失敗と、音声デコードの成否を分離した。
- 最終差分の独立レビュー: プレイヤー・単体試験・CI・ブラウザー試験・合成 MP3 の来歴・運用文書を確認し承認。試験方式の変更後も再レビュー済み。
- 公開ビルドの全体ブラウザー回帰・macOS CI・公開反映: 実行中。最終結果は公開確認時に記録する。
