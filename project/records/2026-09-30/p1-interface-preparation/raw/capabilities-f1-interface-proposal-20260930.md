# F1 能力と限界の図解インターフェース案

状態: 採択済み絵コンテの具体化案。独立レビュー・実装・公開受入は未実施。E3公開受入後にF1を開始する。製品・記事・Gitには変更していない。

本文SHA256 cc83e31509fc1b5a8e43793be4c06fc2682c90e76f83e7ebf784fafbd23beb4a とsourceDigestを現物で照合済み。数: {"rootNodes":38,"contentH3":8,"contentBodyBlocks":14,"wrappedH3":5,"wrappedBody":11,"displayMath":0,"mermaid":0,"dynamicTopics":23,"staticTopics":12,"stages":5,"readStops":5}。本文・表・リスト・リンクは元ASTのまま保持する。

## 提案契約

CapabilitiesAssessment / capabilitiesAssessmentFrame / CAPABILITIES_ASSESSMENT_STAGES。1図5段階すべてREAD。S1だけ原表6行のタスク選択、S4だけ4つの見積り観点の強調を操作でき、他段階へは影響しない。初期S1から流暢さ/正確さの別評価欄、独立検証、傾向は保証でないことが見える。

出力例・品質点・正答率・自動採否は追加しない。S2の3道具経路と誤りの検証点、S3の日付/モデル/試し方とベンチマーク対実ケース、S4の全4手順と10〜20件の非保証を既存本文に対応させる。値は未計測のnull、記録条件は未記録のplaceholder。

## 検証と分担

JSONのadoptedは元F1 objectの完全コピー。proposedに属性、設定、固定ID、段階別必須表示、unknown値と試験条件を分離した。記事固有4ファイルは担当、共有登録・AST・MDX・dispatcher・受入・公開kitは統合担当。全有効化組合せのAST復元、全選択・逆シーク・数値/判断の非創作、PC明暗/低画面/狭幅/拡大と本文同期を検査し、独立意味・実画像・CI/公開受入を別に行う。
