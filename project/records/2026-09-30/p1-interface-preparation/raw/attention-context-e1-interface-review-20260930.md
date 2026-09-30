# E1 インターフェース計画の独立レビュー

**approved / low、must 0・should 0**。原文と採択済み E1 の意味を保った具体化です。判定は実装前の契約だけで、製品実装・実画面・公開受入ではありません。

- checkedAt / reviewed_at: 2026-09-29T19:17:41Z
- reviewer_run_id: 01a0ced7-e41c-70c1-904e-2ae30ff2fa4b:/root/inference_doc_review
- 参照コミット: 5940334a6fd3aab8178cfeb8746a58c8b937d390
- 対象 MD SHA256: 998f0261c2ce57aaa326a431b822d05426f1a96448afd2cda2b146beedb01b4f
- 対象 JSON SHA256: b9b35c1da9bec520550ee5e658e74eb48109f4d673bb1e3f0858ab36654ccd43
- 原記事: docs/10-llm-foundations/attention-and-context.md。依頼文の略記ではなく、提案と採択計画で一致するこの正本を確認しました。

## 指摘と判定

| ファイル | 行 | 指摘 | 判定 |
| --- | --- | --- | --- |
| attention-context-e1-interface-proposal-20260930.md | 1–263 | 問題なし。must 0・should 0 | 計画として approved |
| attention-context-e1-interface-proposal-20260930.json | 1–2748、特に reading 1310、interfaces 1548、independentChecks 2666 | 問題なし。must 0・should 0 | 計画として approved |

## 独立照合

原記事全文と採択計画の E1、提案 MD/JSON を読み合わせました。作者 selfCheck を検証の代用にせず、固定コミットの git show と独自 unified/remark parser で再計算しました。adopted.article は正本 E1 object に deepEqual、source.inputs 20 件の raw/LF SHA はすべて一致しました。

| 項目 | 結果 |
| --- | --- |
| 原記事 SHA256 | 433d75095383235eeace9c4b34048bad43a3f4b0ba6e65c2e7e7d25eebdb1c55 |
| 全 AST SHA256 | ea4d5da00220847b1c69d5deaee1a6fac11cc20dfbfb19b3d1d67d6523370ce8 |
| 原文構造 | root 39、対象 H3 8/body 15。table 1/list 10/link 23/strong 18。display/inline math、code、Mermaid すべて 0 |
| 包装 | 5 H3/body 12。causal [9,19)、cache [19,26) の連続・非重複範囲 |
| 原文網羅 | 30 単位、dynamic 18/static 12。独自抽出の topic 本文が一致し、全 dynamic の body→READ stage が一致 |
| 到達 | 2 図・11 stage。causal READ 0–4、cache READ 0/2/3/4/5、manual-only 1 |
| AST 復元 | H3 を先頭 step に一度だけ含めた独自 grouped-step 仮包装を全 4 組合せで解除し、position を含む原 AST ノードに完全復元 |
| sourceDigest causal | sha256:3d148c85ba70c31149692bbbb25b7ce25ec0d9a9457b43f85b646287e4ff625e |
| sourceDigest cache | sha256:cbdf6f68c773444b57ccffc29430974e2705c11460558a8b39b4ea0fabc6c7ed |

全 AST hash は position 除外・キー整列・CRLF/CR→LF の条件です。8 section の個別 hash、headings/sourceHeadings、blockTypes、count、root index、bodyOffset、includeHeading も独立照合しました。仮包装検算は製品の未実装 AST 変換をテストした記録ではありません。

## 図の意味と固定値

- 因果範囲と混合: 4/6 行の下三角 mask を query/key の大小から独自作成し、許可セル 10/21 と全 query 0–5 の allowed/masked に一致。S1 の source は t0–t3、未来位置なし。模式的な太さと実重み/正答を区別し、固定の語→句→文の層階層も主張しません。問題なし。
- prefill/decode: prefill は入力 0–5 を処理し KV 0–5、選ばれた次候補 6 は未保存。次の decode が 6 を処理して KV 0–6 に追加し、新候補 7 は未保存です。Q・学習重みと K/V、TTFT と生成速度を分離し、時間・価格・bytes は null。問題なし。
- prefix: 独立比較で front-change は prefix 0/再計算 0–5、suffix-change は prefix 4/再計算 4–5、append は prefix 6/無効化なし/新規未計算 6 と一致。同一モデル・位置・計算条件の構造的な再利用候補で、サービス hit/TTL/最小長/料金を発明しません。問題なし。
- READ 持越し: cache の未操作 READ2 は前方一致の 2 入力、固定/可変、prefix 4 と境界、保持 4/再計算 2 を同時に実表示する契約です。manual1 の通過や selector 操作を必須にしません。append は新規未計算と既存位置の無効化を区別し、追記位置の説明を保持します。問題なし。
- 長文品質: 同じ情報を先頭/中間/末尾へ移す比較を保ち、未操作 READ4 にも 3 位置の要約を残します。原文が扱う位置効果を、対象モデル/タスクの評価観点に限定し、一般的な U 曲線・中間必敗・実測品質順位を創作しません。必要 A/B を固定して追加文書だけを加減し、検索/統合は別々の未測定枠です。品質差を注意の希釈だけへ帰属しません。問題なし。
- 情報選択と prefix: READ5 で別の判断軸を同時表示し、入力を変えると一致範囲も変わり得ることを保ちます。選択で品質や cache が改善すると保証しません。問題なし。
- 操作と値: 5 controls/16 option values の有効段階は stageAssertions と一致。対象外 effective 値 null、履歴非依存、安定 ID の契約です。原文の「それ」と役割名だけを使い、追加例文・数式・実測値はありません。問題なし。

## 一次資料の補助確認

レビュー自身の Web 確認として [Attention Is All You Need §3.1–3.2](https://arxiv.org/html/1706.03762) の未来参照マスクと重み付き混合、[PagedAttention §2.1–2.2](https://arxiv.org/html/2309.06180) の KV 依存、prompt と 1 token 入力処理の順序、[Lost in the Middle abstract](https://arxiv.org/abs/2307.03172v3) の対象タスクと位置差を読みました。取得後 UTC 確認は 2026-09-29T19:15:47Z。これは本レビューの補助確認で、作者の networkPerformed=false や元記事アクセス日 2026-09-10 を書き換えるものではありません。最新 API/課金・実モデル性能の検証は行っていません。

## 承認の範囲

この hash の計画契約だけを承認します。source が変われば再照合が必要です。製品 unit/AST、実ブラウザー/画像/操作、release kit、CI/Pages/公開受入は別工程です。D2 公開受入と親担当の開始指示という前提を維持します。P1 全 15 記事の公開受入後停止・P2 未開始の境界と整合します。製品・記事・Git・既存証拠は変更していません。
