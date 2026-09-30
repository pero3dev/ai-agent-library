# P1 残り 7 記事の実装前準備アーカイブ

2026-09-30 保存。別 PC で会話やローカル TEMP がなくても、具体的なインターフェース案と独立レビューを参照するための記録です。基準として確認した HEAD は 5940334a6fd3aab8178cfeb8746a58c8b937d390、branch は feat/alignment-reading-diagrams です。所有範囲はこのディレクトリだけで、製品・本文・公開 kit・Git の変更は行っていません。

この保存は**実装・実画像・記事全体・runtime・公開受入の承認ではありません**。採択済みの正本は [P1 残り記事の絵コンテ](../../2026-09-24/p1-remaining-storyboards.md) と [独立計画レビュー](../../2026-09-24/p1-remaining-storyboards-review.md) です。下表の approved は記載ハッシュの具体案または検査計画に対する限定レビューです。制作開始時は各記事の前提記事の公開受入、最新 main の原文・共有コード、sourceDigest を再確認し、実装後に独立内容・実画像・local/public 検査を行います。P1 全 15 記事の公開受入で停止し、P2 は開始しません。

## 具体案とレビュー

| 単位 | 具体案 | 独立レビュー | 保存時の判定 |
| --- | --- | --- | --- |
| D1 | [MD](raw/alignment-d1-interface-proposal-20260930.md) / [JSON](raw/alignment-d1-interface-proposal-20260930.json) | [MD](raw/alignment-d1-interface-review-20260930.md) / [JSON](raw/alignment-d1-interface-review-20260930.json) | approved / low / must 0 / should 0 |
| D2 | [MD](raw/reasoning-d2-interface-proposal-20260930.md) / [JSON](raw/reasoning-d2-interface-proposal-20260930.json) | [MD](raw/reasoning-d2-interface-review-20260930.md) / [JSON](raw/reasoning-d2-interface-review-20260930.json) | approved / low / must 0 / should 0 |
| E1 | [MD](views/attention-context-e1-interface-proposal-20260930.md) / [JSON](raw/attention-context-e1-interface-proposal-20260930.json) | [MD](raw/attention-context-e1-interface-review-20260930.md) / [JSON](raw/attention-context-e1-interface-review-20260930.json) | approved / low / must 0 / should 0 |
| E2 | [MD](views/icl-e2-interface-proposal-20260930.md) / [JSON](raw/icl-e2-interface-proposal-20260930.json) | [MD](raw/icl-e2-interface-review-20260930.md) / [JSON](raw/icl-e2-interface-review-20260930.json) | approved / low / must 0 / should 0 |
| E3 | [MD](raw/interpretability-e3-interface-proposal-20260930.md) / [JSON](raw/interpretability-e3-interface-proposal-20260930.json) | [MD](raw/interpretability-e3-interface-review-20260930.md) / [JSON](raw/interpretability-e3-interface-review-20260930.json) | approved / low / must 0 / should 0 |
| F1 | [MD](raw/capabilities-f1-interface-proposal-20260930.md) / [JSON](raw/capabilities-f1-interface-proposal-20260930.json) | [MD](raw/capabilities-f1-interface-review-20260930.md) / [JSON](raw/capabilities-f1-interface-review-20260930.json) | approved / low / must 0 / should 0 |
| F2 | [MD](raw/multimodal-f2-interface-proposal-20260930.md) / [JSON](raw/multimodal-f2-interface-proposal-20260930.json) | [MD](raw/multimodal-f2-interface-review-20260930.md) / [JSON](raw/multimodal-f2-interface-review-20260930.json) | approved / low / must 0 / should 1 |

D1 の補助記録は [読み取り準備の閲覧用 MD](views/alignment-d1-readonly-preparation-20260930.md) / [JSON](raw/alignment-d1-readonly-preparation-20260930.json)、[読み取り準備の原本 MD.gz](raw/alignment-d1-readonly-preparation-20260930.md.gz)、公開検査 kit 計画 [MD](raw/alignment-d1-kit-plan.md) / [JSON](raw/alignment-d1-kit-plan.json) とその独立レビュー [MD](raw/alignment-d1-kit-plan-review-20260930.md) / [JSON](raw/alignment-d1-kit-plan-review-20260930.json) です。D1 の読み取り準備は訂正候補や当時の対照候補を残す来歴であり、後続のインターフェース案で具体化された exports / hooks / controls を古い未決事項に戻しません。

現在 34 / 34 原本を保存し、8 組の独立レビューがあります。E2 の確定レビュー 2 本を追補し、対象 proposal のハッシュ一致を確認しました。全 7 記事のインターフェース案と D1 kit 計画は限定された計画レビュー approved であり、実装・runtime・公開受入の承認ではありません。 missingExpectedFiles は [index.json](index.json) の機械可読な未収録一覧です。

## 原本・閲覧用・ハッシュの区別

raw/ は原本バイトを直接保存、または gzip 展開で完全復元できる形で保存しています。D1 読み取り準備、E1 具体案、E2 具体案の MD 3 本は gzip 保存とし、views/ に閲覧用を添えました。D1 は元の記事ディレクトリ基準のリンク 2 個だけを補正。E1 はリスト前の空行 4 箇所だけを追加。E2 は 4 個のパスの `<id>` を含む表記を inline code とし、多重空行 1 箇所だけを整えました。文章・数値・訂正前後の文言・判定は変更していません。各 view は宣言した変更だけを原本へ適用した全バイトと一致します。gzip 展開後の originalSha256 は原本と一致し、storedSha256 は圧縮ファイル自身のハッシュです。閲覧用のハッシュは原本のレビュー対象ハッシュに代用しません。

[索引](index.json) は元ファイル名、分類、採用状態、リポジトリ相対の保存先、原本と保存ファイルの byte 数 / SHA256、レビュー対象のハッシュ一致、閲覧用のリンク変換・空行調整・inline code 化を持ちます。[検証記録](verification.json) はコピー一致・gzip roundtrip・相対リンク・対象ハッシュとプライバシー確認の範囲を記録します。E2 の原本 MD はリポジトリ TEMP から OS の TEMP へ byte コピー一致後に移しました。元の参照パスは来歴として保持し、index の currentOriginalLocation と gzip 保存先を現行の参照先とします。metadata に自己参照ハッシュ循環は作りません。index は verification のパスだけを保持し、verification が index のハッシュを記録します。

原本内の sourceFiles / sourceInventory / report 等の絶対パスと、その時点の pending/status は当時の証拠として変更しません。別 PC では原本ファイル名とハッシュから index の保存先を引き、元 PC の絶対パスを実行先にしないでください。新しいレビューが別途 approved でも、作者案の当時の「未レビュー」という記述を書き換えていません。共有ファイルの古いハッシュは当時の入力であり、現在版の一致を主張しません。

## F2 should 1 の採用メモ

F2 原本の「T-task manifest」という記述はそのまま保持しました。独立レビューの非 blocking 指摘は採用し、**F2 実装時は ROADMAP の AR-2 に対応する通常記事変更 manifest として明確化**します。M1–M5 と同期訂正、実適用日、タスク全成果物、最終候補の独立記事レビューに結び付けます。これは後続実装への採用メモであり、原本を改変したり記事変更済みとしたりするものではありません。

## 保存範囲と追補方法

選んだ技術提案・レビューのみを保存しました。端末ログ、会話全文、認証情報、無関係な添付物は含めていません。秘密鍵・token 形式・連絡先メール・電話・会話 export の識別子を機械走査し、文書構成、レビュー対象、指摘、リンク先も確認しました。既存の原本にはローカル入力パスと reviewer provenance ID が残ります。これは依頼どおり来歴を保持したもので、無差別な個人情報検査の保証ではありません。

未収録レビューを追加するときは、確定した MD/JSON の原本ハッシュを取得し、対象 proposal の originalSha256 とレビュー targets を照合します。元の raw を上書きせず、分類・限定承認・F2 採用メモを維持して index、README、verification を再生成します。scope 外の製品・記事・kit・ゲートをこの保存作業から変更せず、stage/commit は親担当が行います。
