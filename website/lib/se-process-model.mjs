import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const SE_PROCESS_STAGES=Object.freeze({
 'se-common-principles':rows([
  ['使う対象','開発・保守の対象システムへ、Agentを道具として使う。','本シリーズはAgent製品を作る話ではありません。既存章の選定・設定・権限を土台に、工程と商流へ適用します。'],
  ['責任と確定','候補を広げる作業と、成果物を確認・確定する作業を分ける。','確認担当を置き、人が取捨選択・整合性・顧客合意を判断します。法的責任は契約・適用法へ別途照合します。'],
  ['根拠と経路','観測した現行挙動・合意した要求・生成された仮説を分ける。','現行にも不具合はあり得ます。機微情報の契約経路を先に決め、効果は工程ごとに測ってから主張します。']
 ]),
 'se-v-model-map':rows([
  ['成果物と検証','要件・設計の成果物と、対応するテストを結ぶ。','原文のV字は対応を示す模式図です。工程の配置だけで手戻り費用や検出率を証明しません。'],
  ['工程の役割','各工程の向く作業と、人が握る判断を並べる。','要件・設計・実装・テスト・保守の元の表を保ち、候補と確定を区別します。'],
  ['誤りの影響','変更範囲・リスク・検証手段へ、誤りの影響を照合する。','工程名だけで危険度を数値化しません。顧客業務の補完・方式不整合・自己参照・本番境界等を確認します。'],
  ['短い反復','反復開発でも同じ活動と、発散から確定への切替がある。','速い回転のレビュー負荷と、工程間の成果物の重さを確認します。Agentの担当範囲は反復だけで変わりません。'],
  ['自分の工程','担当工程から、小さな候補出しの仕事を選ぶ。','上流・テスト・レガシー／保守・企業制約／顧客合意へ進めます。成果物の確認責任と情報経路を先に保ちます。']
 ]),
 'se-upstream-review':rows([
  ['上流の分担','観点・下書き・整合性の支援と、人が確定する作業を分ける。','要件定義の方法論は関連記事へ。方式・非機能・設計責任を委任しない役割分担案を保ちます。'],
  ['要件の候補','異常系・非機能・移行・運用の観点と、矛盾・曖昧さを出す。','業務を知らない補完を確定しません。必要な観点を人と顧客が選び、レビュー時間を含めて効果を測ります。'],
  ['設計の草案','資産・要求・テンプレートから草案を作り、方式を決め直す。','既存コード・類似設計・記載項目を入力にします。断定の根拠と既存方式の整合、確認・修正の工数を比較します。'],
  ['指摘の採否','横断整合と観点レビューの指摘を、人が採否・承認へつなぐ。','要件と設計、基本と詳細、コードとの不一致を探索。的外れ・過剰な指摘をそのまま変更根拠にしません。']
 ]),
 'se-document-delivery':rows([
  ['図の下書き','説明から図を生成し、設計意図と関係線を人が確認する。','Mermaidの構成・シーケンス・状態遷移を差分管理します。構文が正しいだけで設計内容が正しいとは限りません。'],
  ['形式の段階','中身をテキストで作り、合意した提出形式へ変換する。','全面Markdown化を要求せず、新規部分など可能な範囲で正本と派生を整理します。個別変換ツールの手順は補完しません。'],
  ['読取と照合','既存Excelの抽出と、提出形式への転記を正本へ照合する。','画像・CSV・テキストを介す方法を保ち、結合セルや細かい表の重要箇所は人が確認します。形式変更で正本が自動移行したとはしません。'],
  ['許可した経路','不要な顧客情報を抽象化し、許可した契約経路へ渡す。','マスキングだけで未許可の経路を許可しません。抽象化した情報でも観点・矛盾・項目の発散から試せます。']
 ]),
 'se-test-design-generation':rows([
  ['テストの分担','観点・ケース・コード・データ・記録に対する役割を分ける。','Agent自体の評価と、回帰検査の運用は別記事が正本です。妥当性と提出物の確認担当を置きます。'],
  ['観点の候補','境界値・同値分割・状態・組合せの候補を、業務リスクへ照合する。','正常・異常・非機能の過不足を人が確定します。列挙した候補だけで網羅性を保証しません。'],
  ['仕様から期待値','前提・手順・期待結果を作り、期待値を仕様に照合する。','期待値が決まらなければ上流へ仕様の曖昧さを戻します。ケースが存在するだけでは適合を証明しません。'],
  ['コードとデータ','仕様の期待値を保ち、コードと匿名ダミーデータへ実装する。','本番データを無許可で渡さず、実装の出力を期待値に転記しません。確認・修正・実行まで含めて工数を測ります。']
 ]),
 'se-test-oracle-evidence':rows([
  ['同じ誤解','実装とテストが同じ誤解を共有すると、緑でも要求を外れる。','同じAgentが同じ理解で生成する自己参照を可視化します。別の生成に分けるだけでも正しさの保証にはなりません。'],
  ['独立した根拠','仕様から人が期待値を確定し、別の観点を足して確認する。','テスト生成へ仕様を渡し、実装出力の追認を避けます。重要機能はレビュー観点を変えてクロスチェックします。'],
  ['実行した記録','ログ・画像を集約し、実施した事実と合否を人が確認する。','未実行のもっともらしい説明を証拠へ昇格しません。整形は支援できても、提出物の最終確認は人が担います。'],
  ['判断の範囲','根拠・実行・検証範囲を揃え、測った効果を評価する。','要求への適合と欠陥の判断を支える証拠です。合格だけで欠陥ゼロを保証せず、法的責任は別途確認します。']
 ])
})
export function seProcessFrame(id,phase){
 if(!Object.hasOwn(SE_PROCESS_STAGES,id))throw new RangeError('Unknown SE process diagram')
 const stages=SE_PROCESS_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
 return {...stages[stage],stage,phase:bounded}
}
export const SE_PROCESS_ROLES=Object.freeze({
 requirements:{title:'要件定義',draft:['抜け漏れ・質問・用語'],human:['要件確定・顧客合意'],risk:'業務の誤解を補完'},
 design:{title:'基本・詳細設計',draft:['草案・図・整合性'],human:['方式・非機能・責任'],risk:'既存方式との不整合'},
 implementation:{title:'実装',draft:['コード・定型・再構成'],human:['設計意図・レビュー'],risk:'動くが設計を外れる'},
 testing:{title:'テスト',draft:['観点・ケース・データ'],human:['期待値・妥当性・合否'],risk:'同じ誤解で自己検証'},
 maintenance:{title:'保守・運用',draft:['障害・影響・経緯'],human:['本番判断・恒久対策'],risk:'本番境界と現行の誤認'}
})
export function seEvidenceGate({green,oracle,executed,scopeReviewed}){
 if([green,executed,scopeReviewed].some(x=>typeof x!=='boolean')||!['implementation','specification'].includes(oracle))throw new TypeError('Identify test evidence explicitly')
 return {supportsReviewedScope:green&&oracle==='specification'&&executed&&scopeReviewed,noDefectsGuaranteed:false,canFabricateEvidence:false}
}
export function seInformationRoute({approved,abstracted}){
 if(typeof approved!=='boolean'||typeof abstracted!=='boolean')throw new TypeError('Identify routing conditions explicitly')
 return {canSend:approved,abstracted,approvalReplacedByMasking:false}
}
