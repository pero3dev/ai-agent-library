# 通常Agentループ音声1本の実MP3 bytes確認

## 対象と結果

2026-10-28。固定main `f15f634ab7068549b3d5d42270a0d8223f3cc0e3` と、Audio候補 `65a86520387a074f08b86f52478b3fed4b68bef1` の通常1本だけを照合しました。新しいheadや将来のmain全体の受入とは分けます。

通常宣言、catalog、選定記事、原文全文のLF正規化SHAが一致しています。[公式Release](https://github.com/pero3dev/ai-agent-library/releases/tag/audio-agent-loop-3c6f324e5d0d4a60-7ab8a0e6323a20e7)のrelease IDは `387829972`、唯一のMP3 assetは `560813683` です。取得時点の13,007,768B全bodyについて、宣言・catalog・公式asset digestとSHA-256が一致しました。

| 項目 | 記録値・確認範囲 |
| --- | --- |
| MP3のSHA-256 | `47803c3cb76f5e737a3d2f11a8878886590d4159363f52c453bd44396214942e` |
| 原文の正規化SHA-256 | `3c6f324e5d0d4a60c48cf9be030279731c2e3ea2951f1e51c1c3a570eec7f101` |
| 台本の宣言SHA-256 | `7ab8a0e6323a20e72cada9f6559d5e219786616a2f2e308da5f2af646b60c9fb`。実台本との再照合は未実施 |
| 取得 | 1 body取得チェーン。GitHubから公式CDNへのredirectを含むHTTP GETは2回、retryなし |
| 保存 | MP3本体を保存せず、streamから長さとhashを計算。署名付きCDN URL・query・認証情報の保存なし |
| 時間 | catalogの1625.888413秒はmetadata値。独立したデコード・時間計測は未実施 |

## 台本と制作証拠の境界

台本SHAは、producerがJSONをparseした後の `SHA256(JSON.stringify(script))` です。raw台本ファイルのhashとは異なります。対応する実台本、READY、review、authorshipとengine版は未回収です。ReleaseのassetはMP3だけで、音声から台本を再構成・推測して欠けた証拠を埋めていません。

[音声identity契約の記録](../2026-10-26/ios-audio-offline-identity.md)にある先行provenance調査を参照し、その全Git履歴や制作端末の探索は繰り返していません。固定した[producer](../../../scripts/audio/publication.mjs)のcanonical台本hashの定義と、今回のMP3実bytesの確認を分けます。

## 将来の配信と残件

Releaseの `immutable` は `false` です。今回の取得時点の一致は、将来の同URLのbytesが変わらない保証ではありません。AVPlayerが受信する全bodyのSHAを毎回検証する機能も追加していません。

今回解消したのは、通常1本の実MP3と宣言の同一性だけです。実台本・制作証拠、音声や台本の配布権利、追加8本、音声保存、Store公開、実機・VoiceOverとIOS-04・16全体の受入は残します。規約の法的適用やOwnerの公開方針も採択していません。次は制作元の原jobを回収し、原物を保持したままcanonical台本hashとsource・review・READY・audioの対応を確認します。

[JSON記録](ios-agent-loop-audio-byte-audit.json)に、固定Sourceと公式assetの対応、既存の取得時刻、長さ・SHA、private証跡の識別子とhashを保存しました。この文書化ではHTTP取得・実MP3の再hash・SDK・試験・生成を繰り返していません。アプリ、カタログ、既存の観測記録とTODOの完了欄は変更していません。
