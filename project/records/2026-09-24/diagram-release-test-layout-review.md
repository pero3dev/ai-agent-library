# 公開検証キットの試験配置変更・独立限定レビュー

判定: **approved / low**。must 0、should 0。レビュー担当: /root/training_integration_map。実レビュー時刻: 2026-09-24T13:46:00.104Z。

対象は scripts/diagram-release/ の10ファイルと tests/unit/diagram-release-portable.test.mjs。候補manifest SHA256は bbbb935cd4a81212fc5c703624625659e2d708e6ffa0e378dcafaf10b35a6da8。前身channel版manifestは e9cf22cf7edd16443a6cd4d38c6aec9fac92bd09f4ad442f04270ef352ddac03。公開受入やLinux合格の判定ではない。

## 独立確認

- 保存された前身snapshotのmanifestと全掲載ファイルhashを照合。公開runner、collector、extractor、検査3module、path helperの7ファイルは前身からバイト不変。公開58ケース・固定fixture・CI同一性の条件を削っていない。
- 移動したtestを旧helper importへ戻すと全文が前身と一致。18 test bodiesと既存skip条件を保持。新ファイルは既存root npm test / Ubuntu docs CIのglobへ入る。Windows CIの明示リストには自動追加されない。
- 移動先を独立実行し18/18成功、失敗0・skip0。Windows / v24.16.0、10337.384 ms。PowerShellとtarを使うオフライン検査も含む。実ブラウザーやネットワークは使わない。
- check-preparationを別途実行し成功。固定repo試験hash、LF、5保護区間、58ケース定義の保持、54 sampling oracle設定を確認。32 callback名の列挙と公開実行を区別した。
- 新しいmanifest解決の実コード部分を抽出して実行。許可2件、親逸脱・別test・正規化別名・Windows区切り・絶対パス・空path・未対応locationなど9件拒否、祖先junction1件拒否。固定repository testだけがkit外参照として通る。
- TEMPの空白を含む別repo配置へ必須metadataと同じtestをコピーし、異なるcwdから明示--repoで準備検査成功。repo所有testへTEMP内だけで1行加えるとmanifest hash不一致で拒否された。
- checkStructureに必須ファイルと対象10＋1の明示inventory（28ファイル）を渡して成功。scripts内testの禁止に抵触する旧パスは存在しない。配置契約の例外や緩和は追加していない。
- rootが所有する前提表のtar / PowerShell 7+追記と、project移管記録の現配置・CI参加の追記を読み取り確認。旧パス/hashは履歴として残されている。

## 境界

製品編集、Git、ネットワーク、公開・browser実行はしていない。Linux、別PC実機、root全試験、全stage inventoryによる構造検査、次PRのCIは未実施。本承認は候補11ファイルの配置変更に限定する。最終レビューJSONに全候補SHA256と生検証ログのSHA256を保存した。
