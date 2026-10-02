import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const SECURITY_AUTHORITY_STAGES=Object.freeze({
 'identity-delegation-scope':rows([
 ['五つの問い','認証・委任・認可・帰属・資格情報を、別の問いとして読む。','個別IDがあっても、認可と鍵の保護が自動で完成するわけではありません。'],
 ['二つの主体','自律のservice accountと、userの代理を、処理と責任で選ぶ。','特定利用者のアクセス範囲に依存する処理は、その範囲を下流でも強制します。'],
 ['個別のID','全員の権限を一つの共有accountへ集めず、個別IDとownerを持つ。','責任者の不在・広い権限・個別に失効できない問題を避けます。'],
 ['subjectとactor','誰の代理かと、実際に行動する主体を分ける。','RFC 8693の委任語彙です。actに過去の主体があっても、追加の権限を合成しません。'],
 ['tokenの境界','短寿命・最小scope・audience限定を別々に設計する。','同じ利用者でも、他サービス宛てのtokenを使い回しません。実tokenは生成しません。'],
 ['権限の交差','利用者の権限と、このAgentに許可した操作の交差を取る。','和集合ではありません。図は模式の操作集合で、実認可はbackendで検証します。'],
 ['taskと承認','taskのscope・高リスク操作の人間承認・tool引数の制約を重ねる。','scopeの追加要求だけで危険な操作が承認済みになるわけではありません。']
 ]),
 'identity-audit-credentials':rows([
 ['帰属の記録','actor・subject・task・sessionを、人間の操作と分けて記録する。','agentのownerとtraceも辿れる形にします。図は監査ログを実生成しません。'],
 ['ownerと失効','責任者・廃止・異常時を、tokenと資格情報の失効へ結ぶ。','失効は新しい作用を止める制御です。実行済みの外部作用を取り消しません。'],
 ['秘密の置場','prompt・履歴・ruleへ鍵を置かず、vaultと実行側で管理する。','モデルが一度読んだ秘密を、後からplaceholderにしても記憶から消した証拠にはなりません。'],
 ['実行時の注入','modelにはplaceholderを見せ、実行コードが送信時に実値を使う。','図の値は秘密ではない記号です。実vault・token・外部接続を実装しません。'],
 ['接続ごとの鍵','tool・接続先の狭い鍵、refresh・rotation・失効を実行側に寄せる。','一つの共通鍵で全サービスへアクセスさせません。短寿命も自動の無害性ではありません。'],
 ['宛先と上流','MCP宛てtokenのaudienceを検証し、上流APIへパススルーしない。','MCPへ届いたtokenの範囲と、上流へ接続する資格情報の契約を分けます。']
 ]),
 'identity-standards-connection':rows([
 ['確定した土台','RFC 8693の土台と、エージェント専用提案の状態を分ける。','原文の確認日を保つ。図は新しいRFC番号や専用標準の完成を推定しません。'],
 ['動く提案','WG採択・個人draft・失効を、成立した標準から読み分ける。','ID-JAG・identity-chaining・WIMSE等の状態は原文の時点へ戻ります。'],
 ['版付きの認可','MCPの認可を、版・resource・audience・上流tokenの契約で読む。','原文の2026-07-28仕様観測を保つ。新しい版への自動適合を保証しません。'],
 ['設計と製品','個別ID・委任・vaultの設計形と、製品の提供区分を分ける。','Google・Okta以外も各出典日へ戻る。GAだけで全機能や自社適合を保証しません。'],
 ['APIのOAuth','Connectors APIのtoken・登録・認可・scopeを、アプリ側契約へ結ぶ。','ChatGPT画面の接続設定とは別。refresh・再同意・保管・マスキングも検証します。'],
 ['設定を移す','Googleの旧新APIと、Okta Previewの設定移行を対象環境で確認する。','名称だけの置換や、upcomingを全環境GA・確定停止日へ変換しません。']
 ]),
 'exfiltration-routes-url':rows([
 ['攻撃と事故','攻撃者の持出しと、権限・保存の不備による混入を分ける。','攻撃がなくても、応答・ログ・別tenantへdataが混ざり得ます。'],
 ['六つの経路','応答・送信tool・URL・ログ・memory・外部serviceを棚卸しする。','送信toolを外すだけで全経路が閉じたとは言いません。'],
 ['URLも通信','画像の自動取得やリンクのクリックで、URL内の情報が外へ届く。','図のURLは模式の記号で、実取得・クリック・通信を起こしません。'],
 ['proxyの限界','proxyが同じpath/queryを取得すれば、中の情報は上流へ届く。','閲覧者IPの保護とURL内のdataの保護は別です。'],
 ['取得前の制約','管理された画像ID、宛先・URL内容・redirectを取得前に検証する。','redirectは止めるか、遷移先にも同じ制約を適用します。図は実URLを検査しません。'],
 ['保存と契約','ログ・memoryの範囲と保持、外部サービスのdata利用を照合する。','契約やopt-outは導入時の正本で確認します。旧時点のポリシーを現在と断定しません。']
 ]),
 'exfiltration-structure-authorization':rows([
 ['経路全体を点検','三重奏の一要素を外すとき、表示・ログも含む経路を確認する。','Webや送信toolの無効化だけで、作者と全通信経路をなくしたとは扱いません。'],
 ['外す条件','公開dataだけ・管理された入力・限定された出力先から選ぶ。','三要素すべてを必要とする業務は、送信先と内容を示した実行前承認へ戻します。'],
 ['社内と作者','社内保管の資料も、転記mailや第三者の記述を含み得る。','検索結果や子Agentの要約を、親への信頼済み命令にしません。'],
 ['全送信へ制御','送信toolの承認だけで、画像取得や別経路を放置しない。','役割分割後も、親の権限制約と承認を維持します。'],
 ['取得側の認可','利用者・tenantの許可を、modelに渡す前の取得側で強制する。','modelへ権限外dataを入れてから、応答で除く設計を主軸にしません。'],
 ['最後の網','出力の機微pattern検知は追加の層で、取得認可の代わりではない。','検知の合格でも、権限外dataをmodelへ渡してはいけません。']
 ]),
 'guard-layers-enforcement':rows([
 ['外側のコード','promptの禁止指示と、modelの外で通過を制御するコードを分ける。','強制される通過手順でも、内容を判定する検査器の判断は誤り得ます。'],
 ['三つの位置','入力前・応答を渡す前・toolの実行前に、guardを置く。','guardが全経路を仲介する構成が必要です。名前やフラグだけでは成立しません。'],
 ['作用の直前','許可tool・引数・上限・承認を、実行前にコードで強制する。','LLM検査が問題なしと言っても、独立した実行制約を飛ばしません。'],
 ['二つの検査','ruleで書ける制約と、文脈を読むLLMの検査を分ける。','形式・範囲・許可はrule、意味の判定は誤り得る追加検査として扱います。'],
 ['検査器も誤る','LLM検査器自体が騙されても、決定的guardを迂回させない。','図は実guard・model・toolを実行しません。実構成で迂回を試験します。']
 ]),
 'guard-quality-response':rows([
 ['正当と違反','正当なcaseと攻撃・違反caseの両方で、guardを評価する。','誤検知と見逃しは別々の分母で測ります。図は模式のcase集合です。'],
 ['二つの誤り','強度を変えると、正当な操作のblockと見逃しの両方を点検する。','図のcase数・率は架空で、実製品の品質や最適な設定を示しません。'],
 ['回帰と観測','guardの発火を、軌跡assertion・回帰・監視へ結ぶ。','modelやpromptの変更で傾向が変わる。発火率の急変は調査の入口です。'],
 ['リスクの傾斜','不可逆・大きい影響へ強い制約と承認を置き、一律の雑音を避ける。','読み取りも認可や秘密の保護は必要です。軽い監視を無制約へ変換しません。'],
 ['異常時の縮退','異常時は承認必須・tool停止へ切り替えられる構成にする。','kill switchと平時のguardをつなぐ。図はインシデントを検知しません。'],
 ['測り直す','誤検知・見逃し・承認疲れと、迂回経路を測って設定へ戻す。','guardを付けただけで品質管理や安全受入を完了とは扱いません。']
 ])
})
export function securityAuthorityFrame(diagram,phase){const stages=SECURITY_AUTHORITY_STAGES[diagram];if(!stages)throw TypeError('Unknown security authority diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const bools=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
const known=['read','write','delete','send']
export function intersectPermissions(user,agent){for(const a of [user,agent])if(!Array.isArray(a)||a.some(x=>!known.includes(x)))throw TypeError('Known permission sets required');return {effective:known.filter(x=>user.includes(x)&&agent.includes(x)),granted:false}}
export function tokenAudienceReview({correctAudience,unexpired,scopeAllowed}){const v=[correctAudience,unexpired,scopeAllowed];bools(v);return {reviewCandidate:v.every(Boolean),tokenIssued:false}}
export function credentialRoute(mode){if(!['prompt','runtime','egress'].includes(mode))throw TypeError('Known credential route required');return {modelVisible:mode==='prompt',executionInjected:mode!=='prompt',realSecret:false}}
export function revocationReview({tokenRevoked,credentialsDisabled,toolsBlocked}){const v=[tokenRevoked,credentialsDisabled,toolsBlocked];bools(v);return {futureControlCandidate:v.every(Boolean),pastEffectsCancelled:false}}
export function imageFetchReview({automaticFetch,destinationAllowed,urlContentChecked,redirectControlled}){const v=[automaticFetch,destinationAllowed,urlContentChecked,redirectControlled];bools(v);return {reviewCandidate:automaticFetch&&v.slice(1).every(Boolean),automaticPathBlocked:!automaticFetch,proxyAloneProtects:false,fetched:false}}
export function retrievalAuthorization({userAllowed,tenantMatched,resourceAllowed}){const v=[userAllowed,tenantMatched,resourceAllowed];bools(v);return {mayEnterModel:v.every(Boolean),retrieved:false}}
export function actionGuard({toolAllowed,argsValid,withinLimit,humanApproved,llmSaysSafe}){const v=[toolAllowed,argsValid,withinLimit,humanApproved,llmSaysSafe];bools(v);return {reviewCandidate:v.slice(0,4).every(Boolean),executed:false}}
export function toyGuardQuality(mode){const rows={light:{falsePositives:2,falseNegatives:12},balanced:{falsePositives:8,falseNegatives:5},strict:{falsePositives:20,falseNegatives:2}};if(!Object.hasOwn(rows,mode))throw TypeError('Known toy guard mode required');const r=rows[mode];return {...r,legitimate:100,violating:100,falsePositiveRate:r.falsePositives/100,falseNegativeRate:r.falseNegatives/100,empirical:false}}
export function incidentGuard(mode){if(!['normal','approval','stop'].includes(mode))throw TypeError('Known guard mode required');return {toolsEnabled:mode!=='stop',approvalRequired:mode!=='normal',rightsIncreased:false,changed:false}}
