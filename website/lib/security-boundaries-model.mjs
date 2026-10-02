import {clampPhase,stageForPhase} from './reading-clock.mjs'
const rows=values=>Object.freeze(values.map(([label,title,detail])=>Object.freeze({label,title,detail})))
export const SECURITY_BOUNDARIES_STAGES=Object.freeze({
 'threat-boundary-cycle':rows([
 ['三つの前提','入力の指示化・モデルの誤り・権限の被害上限を前提にする。','モデルの拒否だけでなく、実行側でできることを制限します。'],
 ['境界の往復','利用者と外部資料、model、tool、外部世界の境界を追う。','ツール結果もmodelへ戻る入力です。内部利用者でも資料の作者は別です。'],
 ['結果も入力','toolの結果を再び読むとき、出所と権限を混ぜない。','toolの認証と結果の内容が信頼できるかは別に扱います。'],
 ['八つの脅威','入力・権限・供給・記憶・資源・秘密の八脅威を分ける。','OWASPの版と分類は原文の確認時点・TODOへ戻ります。'],
 ['経路と被害','脅威名を、入力経路・使える権限・発生する被害へ結ぶ。','内向き・外向きの境界を確認する。図は攻撃や検知を実行しません。'],
 ['強制する場所','modelの依頼と、コード・認証・隔離の境界を分ける。','自然言語の禁止を実行権限の制限へ変換しません。']
 ]),
 'threat-trifecta-workflow':rows([
 ['三条件の重なり','私有データ・信頼できない内容・外部通信が重なる経路を読む。','三条件が揃うと漏えい経路が成立し得る。実攻撃の成否を測りません。'],
 ['一条件を外す','データ・入力・送信のどれを強制的に閉じるかを選ぶ。','一条件の除去はこの特定経路を閉じる説明です。全脅威への安全保証ではありません。'],
 ['権限の上限','拒否の成否が変わっても、渡した権限の上限を変えない。','読み取り専用や送信先制限を実行側で強制する必要があります。'],
 ['棚卸しから地図','tool・権限・データ・書き込み主体を棚卸しし、境界を図示する。','外部データの作者と、内部の利用者・service accountを区別します。'],
 ['優先順位','影響・可逆性・件数と起こりやすさから、対処する経路を選ぶ。','模式図はリスクスコアの実計測や発生確率の推定をしません。'],
 ['機能を絞る','強制できる制御が足りない高リスク機能は、権限と機能を絞る。','検知は追加の層です。モデルの説得に被害上限を預けません。']
 ]),
 'injection-input-defense':rows([
 ['データと指示','SQLの構造分離と、自然言語を読むmodelの区切りを分ける。','区切り・ラベル・強いsystem指示は、実行権限を強制する境界ではありません。'],
 ['直接の入口','利用者の入力から、設計した意図と異なる指示が入る。','図は攻撃文を送信しません。実被害は利用可能な権限にも依存します。'],
 ['間接の入口','Web・mail・文書・画像・他Agentの出力から、指示が届く。','利用者を信頼しても、読み込んだ内容の作者は別に確認します。'],
 ['四つの目標','回答の乗っ取り・漏えい・権限の悪用・偵察を分ける。','秘密はpromptへ埋めず、実行側のcredential管理へ置きます。'],
 ['五層の役割','設計・実行・入力・model・出力を、強制と推測で読み分ける。','出力層でも許可宛先は強制、内容の検査は誤り得る検知です。'],
 ['実行の直前','許可tool・引数・宛先・承認・隔離を、実行側で照合する。','検知の合格だけで権限を増やさない。図は実toolを呼びません。']
 ]),
 'injection-repeated-risk':rows([
 ['一回の検知','一回99%という模式条件でも、残る1%を無視しない。','記事の議論を読む架空の算術です。実modelや検知器の測定値ではありません。'],
 ['繰返しの量','独立・同一確率を仮定して、試行数と見逃しの関係を読む。','期待見逃し件数と、一件以上の確率は異なります。100回で必ず突破とは言いません。'],
 ['権限を先に絞る','入力に混ざった指示が、重大な操作を自動で起こせるかを点検する。','検知率とは別に、データ・操作・宛先を強制的に絞ります。'],
 ['適応と未確認','現実の攻撃は適応・相関があり、算術条件をそのまま移せない。','模式確率から、実システムの発生率や安全率を主張しません。'],
 ['残す証拠','検知・拒否・tool遮断を区別して記録し、回帰試験へ戻す。','ログは秘密と保持範囲も点検します。図は実攻撃のログを生成しません。']
 ]),
 'permission-gates-scope':rows([
 ['権限が上限','toolへ渡す権限が、誤りや悪用で起こせる被害の上限になる。','service accountが全権なら、modelへ限定と伝えても強制できません。'],
 ['四つの原則','toolの最小化・read/write分離・user権限・tenant範囲を揃える。','図の条件は設計の説明です。実認証・policyを実行しません。'],
 ['代理の混同','本人の許可とtenant・resourceの範囲を、toolとbackendで照合する。','広いservice accountの権限を、そのまま利用者へ代理させません。'],
 ['操作の二軸','可逆性と、件数・金額・外部影響の大きさで承認を配置する。','操作を小さく分けたときも総影響を確認する。図は承認を取得しません。'],
 ['内容に触れた後','信頼できない資料を読んだ直後の危険操作は、ゲートを強める。','入力の作者と承認者を区別する。検知の合格を承認へ置き換えません。'],
 ['疲労を避ける','全操作への形だけの承認を避け、境界と具体的な影響を示す。','高リスク操作は対象・件数・金額・送信先を確認できる粒度にします。']
 ]),
 'permission-sandbox-mcp':rows([
 ['隔離の場所','コード・画面操作を、productionや開発者の環境から隔離する。','containerという名前だけで隔離や無害性を保証しません。'],
 ['四つの制約','環境・通信・資源・専用accountを、別の制約として揃える。','filesystemの制限だけでは送信経路が残り、egressだけでは認証や資源が残ります。'],
 ['画面と資格情報','実ユーザーのbrowserやcredentialを、隔離環境へ持ち込まない。','図はsandboxやbrowserを実際に作りません。実構成の検査が必要です。'],
 ['MCPの出所','serverの出所・固定版・更新差分を確認し、自動採用を避ける。','toolの追加や更新で権限・通信先が変わるため、継続的に照合します。'],
 ['toolと結果','許可toolとtokenの範囲を絞り、返った内容は未信頼入力として読む。','認証されたserverの結果も、危険な実行の承認にはなりません。'],
 ['状況で絞る','読取taskはwrite toolを渡さず、異常時は停止・承認必須へ縮める。','同じpromptでお願いするより、tool一覧とbackend policyの制限を先に置きます。']
 ])
})
export function securityBoundariesFrame(diagram,phase){const stages=SECURITY_BOUNDARIES_STAGES[diagram];if(!stages)throw TypeError('Unknown security boundaries diagram');const p=clampPhase(phase,stages.length),stage=stageForPhase(p,stages.length);return {...stages[stage],stage,phase:p}}
const check=v=>{if(v.some(x=>typeof x!=='boolean'))throw TypeError('Explicit conditions required')}
export function trifectaPath({privateData,untrustedContent,externalSend}){const v=[privateData,untrustedContent,externalSend];check(v);return {specificPathOpen:v.every(Boolean),allThreatsSafe:false,attacked:false}}
export function scopedToolReview({callerAllowed,tenantMatched,resourceAllowed,operationAllowed}){const v=[callerAllowed,tenantMatched,resourceAllowed,operationAllowed];check(v);return {reviewCandidate:v.every(Boolean),executed:false}}
export function approvalPlacement({irreversible,largeImpact,untrustedRecent}){const v=[irreversible,largeImpact,untrustedRecent];check(v);return {needsReview:v.some(Boolean),approved:false}}
export function iidDetectionRisk(trials){if(!Number.isInteger(trials)||trials<0||trials>100)throw TypeError('Bounded toy trials required');return {expectedMisses:trials*.01,atLeastOneMiss:1-.99**trials,iidAssumed:true,empirical:false}}
export function defenseMechanism(layer){const kinds={design:'enforced-boundary',execution:'enforced-boundary',input:'fallible-detection',model:'fallible-detection',output:'mixed'};if(!Object.hasOwn(kinds,layer))throw TypeError('Known layer required');return {kind:kinds[layer],completeProtection:false}}
export function sandboxReview({isolatedEnvironment,restrictedEgress,boundedResources,dedicatedAccount}){const v=[isolatedEnvironment,restrictedEgress,boundedResources,dedicatedAccount];check(v);return {reviewCandidate:v.every(Boolean),verifiedIsolation:false}}
export function mcpReview({sourceChecked,versionPinned,toolsAllowed,tokenScoped}){const v=[sourceChecked,versionPinned,toolsAllowed,tokenScoped];check(v);return {reviewCandidate:v.every(Boolean),resultTrusted:false,connected:false}}
export function taskToolSet(mode){if(!['read','write','incident'].includes(mode))throw TypeError('Known task mode required');return {tools:mode==='read'?['read']:mode==='write'?['read','scoped-write']:[],needsApproval:mode!=='read',rightsGranted:false}}
