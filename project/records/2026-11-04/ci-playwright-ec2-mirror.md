# Linuxブラウザー依存物のEC2ミラー対応候補

2026-11-04日本時間の準備記録。観測元はUTC2026-11-03のmain検査であり、新しい候補headのHosted実行・通常main受入は未完了である。

## 目的と作業範囲

通常PR #328をmain `cdf2b6e5259f42ff547d8ff804dc62992fd8542a`へ反映した後、Web側buildの依存準備がミラー形式の安全検査で停止した。既存のAzure形式を保ち、実観測したEC2形式152バイトを完全一致の候補として一つ追加する。所有はLinux準備script、対応unit、実施記録2、索引2で、コードと記録を別コミットにする。TODO優先実装と通常のPR・main反映を自律的に進める依頼に基づく。元の作業コピーや別の型移行PRの変更は取り込まない。

## 観測と根拠

Common run41656376928のbuild job125987667064は、APT取得・ミラー書換え・sudo前に、Unknown mirror-listのconfiguration拒否で終了した。旧許可はAzure先頭の144バイト、実観測はus-east-2のEC2先頭を含む152バイトだった。共通のarchive/security2行93バイトと優先度は一致する。小成果物616バイトの全SHA・CRCを照合し、snapshotの152バイトとlogのSHAを結んだ。snapshotは診断資料で、インストール時の所有者・inode・実体確認を代替しない。

[CanonicalのAPT設定例](https://github.com/canonical/cloud-init/blob/main/doc/examples/cloud-config-apt.txt)はEC2の地域別ミラー形式を説明する。[GitHub runnerのAPT設定](https://github.com/actions/runner-images/blob/main/images/ubuntu/scripts/build/configure-apt.sh)もmirror-listと取得制御を使用する。これらと実観測bytesから当該profileだけを候補にした。実runnerのクラウド事業者や変更原因を断定せず、他地域や任意ホストの一般許可にはしない。

## 実装と検証の範囲

parseMirrorの完全一致候補だけを増やす。APT source URI、署名鍵、ファイル所有権・link・実体の検査、metadata60秒・download180秒と出力上限、sudoのargv、1回だけのfallback、install前の元bytes復元を維持する。

既存78件を保つ対象unitに11件を追加し、Node24.22.1のprivate fakeIOで89件全成功・失敗0・skip0を確認した。新形式の受理、取得失敗から元の152バイトへの復元、region・scheme・host・priority・区切り・末尾・余分行・credential等の近傍拒否を含む。実sudo・APT・ネットワークを実行した結果ではない。

## 後続と残件

Code2の独立レビュー、実mainへの最終Source結合、共通・形式検査、新headのHosted buildと必要CI、通常保護でのmain反映を別に確認する。旧cdf2の失敗やPR328の成功を新候補の成功へ転用しない。iOS本体と保存形式、App0.2.29（31）、TODO32行14完了と元の完了条件を保つ。実機・VoiceOver・最低OS・署名更新は未完了として残す。

## 私有Source6の固定範囲

Code2の独立レビューはP1/P2各0で封印済み（MF `f404f66a2aa4fccda283defeadb0c22466b331486ba89baaba03f3047b2d7b56`）。実親cdf2／tree44dへ結び、code2と記録・索引4本を2意図のcommitに分ける。全6path、新規record2本で2897となる。独立fixtureへ最終tracked入力を全て投影してから共通検査を1回行う。この本文とJSONのnullは作成時点の履歴として保持し、後送の共通・形式・Source結合の結果は封印packetで別に確認する。新headのHosted／実APT／main成功を意味しない。
