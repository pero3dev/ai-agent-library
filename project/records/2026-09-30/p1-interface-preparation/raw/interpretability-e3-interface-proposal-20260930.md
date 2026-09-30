# E3 解釈可能性の図解インターフェース案

状態: 承認済み絵コンテを具体化した提案。独立レビュー・実装・公開受入は未実施。リポジトリには変更していない。E2公開受入後にE3を開始する。

本文SHA256: d7a2febb87771c6afbf440be223527c2c9a465f1e1c72f000432540ec2cda68e。採択JSONと2 sourceDigestを現物から再計算して一致。数: {"rootNodes":50,"contentH3":9,"contentBodyBlocks":21,"displayMath":1,"mermaid":0,"wrappedH3":5,"wrappedBody":16,"dynamicTopics":20,"staticTopics":21,"stages":9,"readStops":9}。原文は変更せず、1つの表示数式を一度だけ保持する。

## 観察と介入の証明範囲

InterpretabilityEvidence / interpretabilityEvidenceFrame / INTERPRETABILITY_EVIDENCE_STAGES、5段階すべてREAD。独立プローブとモデル本体の経路を分け、帰属の両論を同時に示す。同じ入力の通常/介入を並べても結果は未計測のままにする。唯一の操作はS3の「部品を止める／差し替える」で、他段階は変えない。S3の本文リストにある誘導ヘッド候補をこの段階から表示し、S4でA B … Aの経路と因果・全体への外挿の限界を保持する。

## 疎な特徴と再構成

InterpretabilitySae / interpretabilitySaeFrame / INTERPRETABILITY_SAE_STAGES、4段階すべてREAD。追加操作なし。多義性、玩具モデルの重ね合わせ仮説、SAE研究の流れ、非負で大半ゼロの記号係数を原式へ対応させる。再構成は近似として残差を必ず表示する。新しい数値例・特徴名・方向や長さの実測結果を作らない。S3に自己報告、網羅性/評価/規模、安全保証の未解決を残す。

## 実装境界と検証

記事固有8ファイルは採択済み所有表どおり。共有登録・dispatcher・MDX・AST・受入・browser・公開kitは統合担当。詳細JSONのproposedにexports、属性、設定、有効段階、固定ID、nullで保持する未測定値、必須READ意味を定義した。adoptedは元E3 objectの完全コピーで、新しい主張や本文増量を採択していない。

単体は逆シーク/中点/不正値/安定ID/未知値/設定の影響範囲、ASTは全4有効化組合せと元数式、browserは9段階・9 READ・同入力介入・近似記号・操作と各画面条件を確認する。作者以外の意味と実画像レビュー、同CI artifactの公開受入は制作段階で必須。計画上のソース照合を製品成功へ読み替えない。
