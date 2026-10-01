import { clampPhase,stageForPhase } from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const PROMPT_TOOL_OUTPUT_STAGES=Object.freeze({
 'prompt-structure-boundaries':rows([
  ['繰り返し参照','Agentの判断基準は、多様な状況で繰り返し読まれる。','単発の出力指示に詰め込まず、役割・原則・境界を保守できる形へ整理します。'],
  ['六つの役割','各セクションが担う判断を分ける。','役割、ツール方針、制約、進め方、出力、例の六つを整理します。ツールの詳細は各定義に置きます。'],
  ['条件へ変える','曖昧語を、操作ごとの判断基準へ置き換える。','原文の削除・送信・支払いは承認へ、照会・下書きは別の経路です。図は実際の承認や権限制御を実行しません。'],
  ['止める条件','同じ失敗の繰返しと情報不足を、停止・相談へ戻す。','原文の同じエラー3回は説明用の指示例です。質問が必要な情報不足を、推測で埋めません。'],
  ['評価して変更','プロンプト変更をレビューし、評価で確認する。','版管理と変更レビューを通し、体感だけで改善を確定しません。モデル更新時は強い指示の効き方も確認します。'],
  ['境界を維持','文章の指示と、実行側で強制する制御を合わせる。','セクションの衝突と古い指示を整理します。プロンプトの表現だけで安全や成功を保証しません。']
 ]),
 'prompt-cause-revision':rows([
  ['症状から調べる','指示の追加前に、別の原因候補を調べる。','ツール誤用は定義、過去の決定との矛盾は履歴、資料に基づかない回答は検索と文脈を照合します。候補は確定診断ではありません。'],
  ['セクションで直す','障害のたびに継ぎ足すより、古い指示と衝突を整理する。','簡潔と詳細の衝突を残しません。原文のセクション単位で書き直す方針へ戻します。'],
  ['強調を絞る','強い語の乱用を避け、必要な少数の制約を明確にする。','強調が増えるほど重要な制約が埋もれます。モデルごとの効き方は未確認を補完せず、評価します。'],
  ['差分を測る','変更前後を評価し、モデル更新でも条件を確認する。','ツール・記憶・検索の原因切分けと、プロンプトの変更を混ぜません。確認できた結果を版と結び付けます。']
 ]),
 'tool-definition-contract':rows([
  ['定義も指示','名前・説明・入力は、いつどう使うかの判断材料になる。','スキーマ宣言だけではありません。名称、説明、引数の各役割を分けて設計します。'],
  ['名前の語彙','動詞と対象を合わせ、語彙とグループを揃える。','get・search・listの使い分けを決めます。同義の操作を別名で増やさず、関連ツールをまとめます。'],
  ['使う条件','何をするか・いつ使うか・できないこと・形式を示す。','原文の経費検索は照会専用です。新規申請・修正・削除へ広げず、月をまたぐ照会は月単位へ分けます。'],
  ['入力の境界','enum・必須任意・説明と形式で、要求を具体化する。','有限の状態を自由文字列へ戻さず、任意値を必須にして未知を捏造しません。決定論的な複雑さは内部へ寄せます。'],
  ['結果を戻す','必要な結果と直せるエラーを、次の判断へ返す。','内部APIの全応答や生のスタックを返しません。結果上限と絞込・続きの手段を定義します。']
 ]),
 'tool-result-maintenance':rows([
  ['直せるエラー','違反した形式と修正方法を、観測として返す。','原文のmonthはYYYY-MM形式です。実APIのエラーを発生させる図ではなく、修正できる応答の設計を比較します。'],
  ['大きさと続き','件数上限と、次に絞り込む手段を合わせる。','打切りを全件取得と扱いません。判断に必要な情報と、残りを取る経路を示します。'],
  ['必要なセット','タスクに必要なツールを選び、役割の重複を調べる。','全ツール常時投入を避け、追加前に既存との重複を確認します。説明できるかをモデルでテストするのは別の実測です。'],
  ['粒度を保守','モデルが判断する境界で切り、内部の定型処理をまとめる。','APIを一対一で写すだけにしません。説明テスト・評価・既存サンプルを通じて保守します。']
 ]),
 'structured-method-schema':rows([
  ['後続で分ける','コード・人・両方で、出力の構造を決める。','コードには構造、人には自由文、両方なら構造内の自由文を検討します。すべてをJSONへ押し込みません。'],
  ['三つの方式','指示・ツール流用・ネイティブ機能の制御を比較する。','ネイティブの対応環境を先に確認します。スキーマの対応範囲や終了状態は、採用するAPIの公式仕様へ照合します。'],
  ['小さい構造','使うフィールドだけに絞り、独立した関心事を分ける。','巨大な一発スキーマへ詰め込まず、必要な型と形式を定義します。形式保証は内容の正しさの保証ではありません。'],
  ['逃げ道を持つ','enumに、その他・判定不能の経路を残す。','該当しない入力を近いラベルへ無理に押し込まず、その割合を監視します。未知を肯定的な分類へ変えません。'],
  ['形式と根拠','理由のフィールドと、数値・日付の型を具体化する。','原文の理由を先に置く設計とnumber・ISO形式を示します。内部思考や判定品質の向上を一律に保証しません。']
 ]),
 'structured-validation-loop':rows([
  ['形式を検証','まず出力の完了状態とスキーマを確認する。','拒否・生成上限・未対応を成功扱いにしません。JSONとして読めることだけでは後続処理へ進めません。'],
  ['業務を検証','値域・合計・参照先を、業務ルールで確認する。','形式が合っても業務条件が違えば失敗です。図は実際のデータや外部参照を検証していません。'],
  ['エラーを戻す','何が違反したかを添え、上限内で再生成する。','原文のMAX_RETRIES=2は初回を含め最大3回です。エラー内容を次の観測へ返し、同じ出力を無限に待ちません。'],
  ['上限は失敗','上限に達した違反は、明示的な失敗として返す。','品質の低い成功へ置き換えません。必要な確認先と運用へ戻し、再生成率も測ります。'],
  ['通った結果だけ','スキーマと業務検証を通った結果を、後続へ渡す。','処理に使う構造と人が読む自由文を分け、未確認の正しさを保証しません。検証・未知分類・再生成を監視します。']
 ])
})
export function promptToolOutputFrame(id,phase){
 if(!Object.hasOwn(PROMPT_TOOL_OUTPUT_STAGES,id))throw new RangeError('Unknown prompt tool output diagram')
 const stages=PROMPT_TOOL_OUTPUT_STAGES[id],bounded=clampPhase(phase,stages.length),stage=stageForPhase(bounded,stages.length)
 return {...stages[stage],stage,phase:bounded}
}
export function promptStop({sameErrors,informationMissing}){
 if(!Number.isInteger(sameErrors)||sameErrors<0||typeof informationMissing!=='boolean')throw new TypeError('Explicit error count and information status required')
 return {stopAndReport:sameErrors>=3,askForInformation:informationMissing,actionExecuted:false}
}
export function structuredNext({schemaValid,businessValid,attempt}){
 if(typeof schemaValid!=='boolean'||typeof businessValid!=='boolean'||!Number.isInteger(attempt)||attempt<0||attempt>2)throw new TypeError('Original example has attempts 0 to 2 and explicit validation')
 return {next:schemaValid&&businessValid?'use':attempt<2?'retry':'fail',guaranteesAllContent:false}
}
