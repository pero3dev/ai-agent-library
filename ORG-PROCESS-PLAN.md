# ORG-PROCESS-PLAN — 組織・プロセス・人材 追加計画

> **ステータス: 設計案(2026-07-07 作成、ユーザーの選定に基づく。着手指示待ち)。**
> AI を組織に定着させる側の実務 — 開発プロセスの再設計・チームトポロジー・資産の組織共有・利用ポリシー・スキルシフト — の追加計画です。進捗の正本は着手後 [ROADMAP.md](ROADMAP.md) に置きます。

## 1. 位置づけとギャップ分析

既存ライブラリの組織系トピックは「個別の点」として存在します — [skill-map](docs/00-overview/skill-map.md)(個人の育成軸)、[coding-agent-team-adoption](docs/08-coding-agents/coding-agent-team-adoption.md)(コーディングエージェントのチーム導入)、[poc-to-production](docs/09-business/poc-to-production.md) の体制節、[compliance-and-governance](docs/06-security/compliance-and-governance.md) の社内ガバナンス節。ギャップは**組織全体の設計**(プロセス・チーム構造・資産共有・ポリシー・変化管理)を面で扱う層です。

| 既存 | 役割(正本のまま) | 本計画が足すもの |
| --- | --- | --- |
| skill-map(00) | 個人のスキル軸 | チーム・組織の構造(誰がどこに座るか) |
| coding-agent-team-adoption(08) | ツール導入の実務 | ツールに限らない「開発プロセス自体」の再設計 |
| prompt-management(03) | 1 チームの資産管理 | 組織横断の共有・再利用・品質基準 |
| compliance-and-governance(06) | 規制対応・体制の要求 | 社内ポリシーを「作って浸透させる」実務 |

### 配置

**新セクションは作らず、09-business に 5 本を追加**します(09 の憲章「案件推進の方法論」を「案件と組織の推進」に半歩広げる形。README の一文を更新)。代替案(新セクション 15-organization)は §8 に残します。

## 2. 追加トピック一覧(5 本、すべて 09-business)

| # | ファイル | 仮タイトル | level | 鮮度 |
| --- | --- | --- | --- | --- |
| 1 | `ai-native-development-process.md` | AI 前提の開発プロセス再設計 | intermediate | 中 |
| 2 | `ai-team-topologies.md` | AI 時代のチームトポロジー | intermediate | 安定 |
| 3 | `ai-asset-sharing.md` | プロンプト・エージェント資産の組織共有 | intermediate | 安定 |
| 4 | `ai-usage-policy.md` | AI 利用ポリシー策定の実務 | intermediate | 中 |
| 5 | `skill-shift-and-change-management.md` | スキルシフトと変化管理 | intermediate | 安定 |

## 3. 各ページの設計

### ai-native-development-process.md — AI 前提の開発プロセス再設計

- **目的**: 「既存プロセスに AI を足す」から「AI 前提でプロセスを引き直す」への移行を設計できる
- **主要トピック**: 重心の移動(書く → 仕様化する・検証する。レビューがボトルネックになる構造)/ 仕様・意図の文書化が資産になる(ルールファイル・設計文書の位置づけ上昇)/ レビュー体制の再設計(AI 生成物のレビュー観点・レビュー容量の計画)/ 品質ゲートの再配置(生成量が増えるほどテスト・CI が律速)/ 見積り・計画の変化 / 段階的な移行(一気に変えない)
- **分担**: コーディングエージェント固有 = 08 章(正本)。本記事はプロセス一般論。SE 計画(採用時)の工程別各論と相互リンク

### ai-team-topologies.md — AI 時代のチームトポロジー

- **目的**: AI 活用を組織のどこに置くか(集中・分散・プラットフォーム)を、規模と成熟度に応じて設計できる
- **主要トピック**: 役割の定義(AI エンジニア / プラットフォーム / 評価・運用 — skill-map の役割像を組織図に落とす)/ 配置の類型(中央 CoE 型・各チーム分散型・プラットフォーム + 利用チーム型)と移行順序 / プラットフォームチームの責務(ゲートウェイ・評価基盤・ガードレール・テンプレート — LLMOPS 計画と接続)/ 兼任と専任の判断 / 外部パートナーとの分担
- **分担**: 個人の育成 = skill-map(正本)

### ai-asset-sharing.md — プロンプト・エージェント資産の組織共有

- **目的**: チームごとに再発明されるプロンプト・エージェント・スキル・評価セットを、組織の共有資産として流通させる仕組みを設計できる
- **主要トピック**: 共有すべき資産の類型(プロンプト・エージェント定義・スキル・ツール・評価セット・ガードレール設定)/ 共有の仕組み(社内レジストリ・テンプレート・発見性)/ 品質基準と受け入れ(評価済みマーク・オーナー・鮮度 — data-governance と同じオーナーシップ原則)/ 再利用とフォークの管理(勝手改変の増殖を防ぐ)/ 供給側のインセンティブ / セキュリティ(共有資産のサプライチェーン面 — TRUST 計画と接続)
- **分担**: 1 チーム内の管理 = prompt-management(正本)。本記事は組織横断

### ai-usage-policy.md — AI 利用ポリシー策定の実務

- **目的**: 「使ってよいか分からないから使わない/こっそり使う」状態を解消する利用ポリシーを、策定から浸透まで運用できる
- **主要トピック**: ポリシーの構成要素(用途分類(可・条件付き・不可)/ データの入力基準 / 承認済みツール一覧 / 成果物の扱い / インシデント時の報告)/ 策定プロセス(関係部門・現場の巻き込み)/ 浸透の設計(研修・チェックリスト・相談窓口 — 「禁止一覧」で終わらせない)/ 例外申請と改定サイクル / シャドー AI(無許可利用)への現実的な向き合い
- **分担**: 規制側の要求 = compliance-and-governance(正本)。本記事は社内ルール作りの実務

### skill-shift-and-change-management.md — スキルシフトと変化管理

- **目的**: AI 導入が引き起こす役割・スキルの変化に、組織として計画的に向き合える
- **主要トピック**: 変わるスキルの構造(検証・仕様化・判断への重心移動 — skill-map の時間微分)/ 学習支援の設計(実践題材・時間の確保・伴走)/ 不安への向き合い(透明性・再配置の方針・「効率化の果実」の分配)/ 評価制度との整合(AI 利用を前提にした成果評価)/ 変化のペース設計(強制と放任の間)
- **分担**: 個人の学習パス = skill-map / learning-roadmap(正本)

## 4. スコープ外(検討のうえ除外)

- **人事制度・労務の詳細**(雇用契約・法的側面): 論点の提示まで
- **経営戦略論・DX 一般論**: AI Agent 導入に固有の範囲まで
- **特定の研修プログラム・資格の紹介**: 学習支援の設計原則まで

## 5. フェーズ分割(ROADMAP 追記案)

フェーズ記号は **AO・AP** を使います(AM・AN は [UX-PRODUCT-PLAN.md](UX-PRODUCT-PLAN.md) が使用)。

| フェーズ | 内容 | 成果物 | 備考 |
| --- | --- | --- | --- |
| AO-1 | 開発プロセス再設計 + チームトポロジー | `ai-native-development-process.md`, `ai-team-topologies.md` | 調査不要 |
| AO-2 | 資産の組織共有 | `ai-asset-sharing.md` | 調査不要 |
| AO-R | Phase AO レビュー(skill-map / coding-agent-team-adoption / prompt-management からの逆リンク・09 README の憲章一文更新・published 化) | — | — |
| AP-1 | 利用ポリシー + スキルシフト | `ai-usage-policy.md`, `skill-shift-and-change-management.md` | 調査不要 |
| AP-R | Phase AP レビュー + 統合(compliance との分担確認・published 化・同期一式) | — | — |

完了時の規模: **92 → 97 本**(09: 4 → 9)。

## 6. 執筆前調査

**なし**(全 5 本とも方法論であり原則安定。執筆時の部分確認のみ)。

## 7. 同期・派生作業

- **GLOSSARY 候補**: CoE(Center of Excellence)、シャドー AI(shadow AI)、プラットフォームチーム
- **逆リンク**: skill-map → ai-team-topologies / skill-shift、coding-agent-team-adoption → ai-native-development-process、prompt-management → ai-asset-sharing、compliance-and-governance → ai-usage-policy、poc-to-production → ai-team-topologies(体制節から)
- **09 README**: 冒頭の説明を「案件と組織の推進」に更新(AO-R)
- **learning-roadmap / website**: 構造変更なし。読者タイプ G(プロフェッショナル)のルートに組織層の一文を足すかは AP-R で判断

## 8. 未確定事項(着手時に確認)

1. **配置**: 推奨は 09-business への追加(憲章を半歩拡張)。代替: 新セクション 15-organization(5 本では過剰と判断)
2. **5 本の粒度**: 縮小案は 3 本(#5 を #2 に統合、#3 を prompt-management 増補に)。網羅性を優先するなら 5 本を推奨

## 9. TODO

> **TODO(要確認):** ai-usage-policy は compliance-and-governance(規制側)との重複が出やすい。執筆時に「規制要求 = compliance / 社内ルール作りの実務 = 本記事」の分担をレビュー観点に含める(最終確認: 2026-07)
