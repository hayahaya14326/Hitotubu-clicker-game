/* INFINITY FORGE playable economy alpha. No server / network dependencies. */
(function(root){'use strict';
const H=root.Huge, LIMIT=1000000;
const sumHuge=(a,b)=>a.add(b);
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
function defaults(){return {version:1,unlockedTier:0,balances:{E:[0,0],R:[0,0],D:[0,0]},earned:{E:[0,0],R:[0,0],D:[0,0]},cycleEarned:{R:[0,0],D:[0,0]},peakE:[0,0],bestE:[0,0],facilities:{},research:{},skills:[],taps:0,prestiges:{R:0,D:0},milestone:{},automation:{buy:false,rebirth:false},seconds:0,miniCharges:3,miniElapsed:0,miniBoost:0,miniMultiplier:1,history:[],lastSave:Date.now(),achievements:[],settings:{effects:true,autosave:true}}}
const ACHIEVEMENTS = [
 ['first-tap','最初の一押し',s=>s.taps>=1],
 ['ten-taps','10回の点火',s=>s.taps>=10],
 ['hundred-taps','百の操作',s=>s.taps>=100],
 ['thousand-taps','千の操作',s=>s.taps>=1000],
 ['first-facility','機械が動き出した',s=>Object.values(s.facilities).some(x=>x>0)],
 ['ten-facilities','10台の工房',s=>Object.values(s.facilities).reduce((n,x)=>n+x,0)>=10],
 ['fifty-facilities','50台の工房',s=>Object.values(s.facilities).reduce((n,x)=>n+x,0)>=50],
 ['hundred-facilities','工業時代',s=>Object.values(s.facilities).reduce((n,x)=>n+x,0)>=100],
 ['e100','百のエネルギー',s=>H.from(s.bestE).gte(100)],
 ['e1k','千のエネルギー',s=>H.from(s.bestE).gte(1000)],
 ['e10k','研究の夜明け',s=>H.from(s.bestE).gte(1e4)],
 ['e100k','星々の兆し',s=>H.from(s.bestE).gte(1e5)],
 ['e1m','百万の光',s=>H.from(s.bestE).gte(1e6)],
 ['e1b','十億の光',s=>H.from(s.bestE).gte(1e9)],
 ['e1e15','宇宙の拡大',s=>H.from(s.bestE).gte('1e15')],
 ['research-1','研究の第一歩',s=>Object.values(s.research).some(x=>x>0)],
 ['research-5','研究者の記録',s=>Object.values(s.research).reduce((n,x)=>n+x,0)>=5],
 ['rebirth-1','再誕の証',s=>(s.prestiges.R||0)>=1],
 ['rebirth-5','五度の再誕',s=>(s.prestiges.R||0)>=5],
 ['rebirth-20','繰り返す創世',s=>(s.prestiges.R||0)>=20],
 ['skill-1','新しい才能',s=>s.skills.length>=1],
 ['skill-10','組み上げた戦略',s=>s.skills.length>=10],
 ['dimension-1','次元の扉',s=>(s.prestiges.D||0)>=1],
 ['mini-1','自動化の第一歩',s=>(s.workshop?.stage||0)>=2||(s.miniWins||0)>=1]
];
class ForgeEngine {
 constructor(data,state){if(!data?.facilities||!H)throw Error('Assets not loaded');this.data=data;this.state=ForgeEngine.restore(state||defaults());this.facilities=data.facilities.filter(x=>x.tier<=2);this.skillMap=new Map(data.skills.map(x=>[x.id,x]));this.researchMap=new Map(data.research.map(x=>[x.id,x]));this.facilityMap=new Map(this.facilities.map(x=>[x.id,x]));}
 static restore(s){let z=defaults();if(!s||typeof s!=='object')return z;let r={...z,...s};for(let k of ['E','R','D']){r.balances[k]=H.from(s.balances?.[k]||0).toJSON();r.earned[k]=H.from(s.earned?.[k]||0).toJSON()}for(let k of ['R','D'])r.cycleEarned[k]=H.from(s.cycleEarned?.[k]||0).toJSON();r.peakE=H.from(s.peakE||0).toJSON();r.bestE=H.from(s.bestE||0).toJSON();r.facilities=Object.fromEntries(Object.entries(s.facilities||{}).filter(([,v])=>Number.isInteger(v)&&v>=0&&v<=LIMIT));r.research=Object.fromEntries(Object.entries(s.research||{}).filter(([,v])=>Number.isInteger(v)&&v>=0&&v<=20));r.skills=Array.isArray(s.skills)?s.skills.filter(v=>typeof v==='string'):[];r.achievements=Array.isArray(s.achievements)?[...new Set(s.achievements.filter(v=>typeof v==='string'&&ACHIEVEMENTS.some(a=>a[0]===v)))].slice(0,100):[];r.automation={...z.automation,...(s.automation||{})};r.settings={...z.settings,...(s.settings||{})};r.prestiges={...z.prestiges,...(s.prestiges||{})};r.miniCharges=clamp(Number(s.miniCharges??3),0,3);r.miniElapsed=clamp(Number(s.miniElapsed||0),0,600);r.miniBoost=clamp(Number(s.miniBoost||0),0,180);r.miniMultiplier=clamp(Number(s.miniMultiplier||1),1,2);r.seconds=clamp(Number(s.seconds||0),0,1e12);r.taps=clamp(Number(s.taps||0),0,1e12);r.history=Array.isArray(s.history)?s.history.slice(-60):[];return r}
 amount(symbol){return H.from(this.state.balances[symbol]||0)}
 set(symbol,n){this.state.balances[symbol]=H.from(n).toJSON()}
 credit(symbol,n){let add=H.from(n);this.set(symbol,this.amount(symbol).add(add));if(this.state.earned[symbol])this.state.earned[symbol]=H.from(this.state.earned[symbol]).add(add).toJSON();if(symbol==='R'||symbol==='D')this.state.cycleEarned[symbol]=H.from(this.state.cycleEarned[symbol]).add(add).toJSON();if(symbol==='E'){let a=this.amount('E');if(a.gt(H.from(this.state.peakE)))this.state.peakE=a.toJSON();if(a.gt(H.from(this.state.bestE)))this.state.bestE=a.toJSON()}}
 pay(symbol,cost){let c=H.from(cost);if(!this.amount(symbol).gte(c))return false;this.set(symbol,this.amount(symbol).sub(c));return true}
 owned(id){return this.state.facilities[id]||0}
 level(id){return this.state.research[id]||0}
 reached(tier){return this.state.unlockedTier>=tier}
 skill(id){return this.state.skills.includes(id)}
 effect(type){let val=type.endsWith('_add')?0:1;for(let id of this.state.skills){let s=this.skillMap.get(id);if(!s||s.tier>this.state.unlockedTier||s.effect.type!==type)continue;let n=Number(s.effect.value);val=type.endsWith('_add')?val+n:val*(type==='q_softcap_bonus'?1+n:n)}return val}
 researchEffect(name){let n=1;for(let [id,lv] of Object.entries(this.state.research)){let row=this.researchMap.get(id);if(row&&row.effect===name)n*=Math.pow(row.per_level,lv)}return n}
 researchAdd(name){let n=0;for(let [id,lv] of Object.entries(this.state.research)){let row=this.researchMap.get(id);if(row&&row.effect===name)n+=Number(row.per_level)*lv}return n}
 baseMultiplier(){let r=this.state.prestiges.R||0;let d=this.state.prestiges.D||0;let earnedR=Math.min(1e12,H.from(this.state.earned.R).toNumber(1e12));let earnedD=Math.min(1e12,H.from(this.state.earned.D).toNumber(1e12));return H.from((1+Math.pow(earnedR,0.35)*0.45)*(1+Math.pow(earnedD,0.55)*2)*this.effect('global_mul')*this.effect('lower_production_mul')*this.researchEffect('generator_mul')*this.researchEffect('generator_synergy_mul')*this.effect('generator_mul')*(1+0.1*this.owned('R01'))*(1+0.2*this.owned('D01'))*(1+0.01*Math.max(0,this.state.achievements.length-8))*(this.state.miniBoost>0?this.state.miniMultiplier:1)).mul(H.pow10(Math.min(17.7,0.7*Math.sqrt(earnedR))))}
 exponent(){let q=1+this.effect('q_add');return 1+Math.min(0.4,(q-1)*this.effect('q_softcap_bonus'))}
 milestoneBonus(n){let multiplier=1;for(let [target,m] of [[10,2],[25,2],[50,2],[100,3],[250,3],[1000,5]])if(n>=target)multiplier*=m;return multiplier*this.effect('milestone_mul')}
 rawProduction(){let total=H.zero();for(let f of this.facilities){if(f.tier!==0)continue;let n=this.owned(f.id);if(!n)continue;let p=H.from(f.base_output).mul(n*this.milestoneBonus(n));total=total.add(p)}return total}
 production(){let total=this.rawProduction();if(total.isZero())return H.zero();let result=total.mul(this.baseMultiplier());return result.pow(this.exponent())}
 tapPower(){let baseline=H.from(Math.max(1,1+Math.floor(this.state.taps/1000))).mul(this.baseMultiplier()).mul(this.researchEffect('tap_mul')).pow(this.exponent());return baseline.add(this.production().mul(0.25))}
 tap(){this.credit('E',this.tapPower());this.state.taps++;this.checkAchievements()}
 isUnlocked(f){if(f.tier>this.state.unlockedTier)return false;if(f.tier>0)return true;if(f.unlock==='初期')return true;let m=/累積E(\d+(?:\.\d+)?(?:e\d+)?)/.exec(f.unlock);if(m)return H.from(this.state.bestE).gte(H.from(m[1]));if(f.unlock==='T2解放')return this.reached(2);m=/D生涯(\d+)/.exec(f.unlock);if(m)return H.from(this.state.earned.D).gte(Number(m[1]));if(f.unlock==='T3解放')return this.reached(3);m=/I生涯(\d+)/.exec(f.unlock);if(m)return false;return false}
 facilityCost(f,n=this.owned(f.id)){let discount=this.effect('cost_mul');return H.from(f.base_cost).mul(H.from(f.cost_growth).pow(n)).mul(discount)}
 packageCost(f,count){if(!Number.isInteger(count)||count<1)return H.zero();let growth=f.cost_growth;let first=this.facilityCost(f);let series=H.from(growth).pow(count).sub(1).div(growth-1);return first.mul(series)}
 canAfford(f){return this.isUnlocked(f)&&this.owned(f.id)<LIMIT&&this.amount(f.currency).gte(this.facilityCost(f))}
 buyFacility(id,requested=1){let f=this.facilityMap.get(id);if(!f||!this.isUnlocked(f))return 0;let limit=LIMIT-this.owned(id);if(limit<=0)return 0;let count=0;
   if(requested==='max') {let low=0,high=limit;while(low<high){let mid=Math.ceil((low+high)/2);if(this.amount(f.currency).gte(this.packageCost(f,mid)))low=mid;else high=mid-1}count=low}
   else count=Math.min(limit,Math.max(1,Math.floor(requested)));
   if(!count||!this.pay(f.currency,this.packageCost(f,count)))return 0;this.state.facilities[id]=(this.owned(id)+count);this.checkAchievements();return count}
 researchCost(row){return H.from(row.starting_cost).mul(H.from(row.cost_ratio).pow(this.level(row.id)))}
 buyResearch(id){let r=this.researchMap.get(id);if(!r||r.tier>this.state.unlockedTier||this.level(id)>=r.max_level)return false;if(!this.pay(r.currency,this.researchCost(r)))return false;this.state.research[id]=this.level(id)+1;this.checkAchievements();return true}
 canBuySkill(s){return s.tier<=this.state.unlockedTier&&!this.skill(s.id)&&s.prerequisites.every(id=>this.skill(id))&&this.amount(s.currency).gte(H.from(s.cost))}
 buySkill(id){let s=this.skillMap.get(id);if(!s||!this.canBuySkill(s))return false;if(!this.pay(s.currency,H.from(s.cost)))return false;this.state.skills.push(id);this.checkAchievements();return true}
 previewPrestige(tier){let d=this.data.prestige[tier-1];if(!d||tier<1||tier>2)return {ready:false,reward:H.zero()};let peak=H.from(this.state.peakE);let prev=tier===1?H.from(this.state.peakE):H.from(this.state.cycleEarned.R);
    let ready=prev.gte(H.from(d.threshold_previous_earned))&&peak.gte(H.from(d.threshold_energy_peak));
    let reward=prev.div(H.from(d.threshold_previous_earned)).pow(d.reward_power).mul(this.researchEffect('prestige_gain_mul')*this.effect('prestige_gain_mul'));
    return {ready,reward:ready?H.from(Math.max(1,Math.floor(reward.toNumber(1e15)))):H.zero(),peak,prev}}
 prestige(tier){let p=this.previewPrestige(tier);if(!p.ready)return false;let currency=tier===1?'R':'D';this.credit(currency,p.reward);this.state.prestiges[currency]=(this.state.prestiges[currency]||0)+1;this.state.unlockedTier=Math.max(this.state.unlockedTier,tier);
    this.set('E',H.zero());this.state.peakE=H.zero().toJSON();this.state.facilities=Object.fromEntries(Object.entries(this.state.facilities).filter(([id])=>{let f=this.facilityMap.get(id);return f&&f.tier>=tier}));
    this.state.research=Object.fromEntries(Object.entries(this.state.research).filter(([id])=>{let r=this.researchMap.get(id);return r&&r.tier>=tier}));
    this.state.skills=this.state.skills.filter(id=>{let s=this.skillMap.get(id);return s&&s.tier>=tier});
    if(tier===2){this.set('R',H.zero());this.state.cycleEarned.R=H.zero().toJSON()}
    this.checkAchievements();return true}
 setAuto(name,bool){if(name==='buy'&&!this.skill('S01-03-02'))return false;if(name==='rebirth'&&!this.skill('S01-03-05'))return false;this.state.automation[name]=!!bool;return true}
 autoBuy(){if(!this.state.automation.buy||!this.skill('S01-03-02'))return 0;let bought=0;for(let step=0;step<30;step++){let choice=null;let best=-Infinity;for(let f of this.facilities){if(f.tier!==0||!this.canAfford(f))continue;let output=H.from(f.base_output).mul(this.milestoneBonus(this.owned(f.id)+1));let roi=output.log10().toNumber(1e12)-this.facilityCost(f).log10().toNumber(1e12);if(roi>best){best=roi;choice=f}}if(!choice||!this.buyFacility(choice.id,1))break;bought++}return bought}
 tick(dt,{auto=true}={}){dt=clamp(dt,0,86400);if(!dt)return;let boostBefore=this.state.miniBoost;let boostTime=Math.min(boostBefore,dt);let normal=dt-boostTime;let rate=this.production();if(boostTime){this.credit('E',rate.mul(boostTime));this.state.miniBoost=Math.max(0,boostBefore-boostTime)}if(normal){this.credit('E',this.production().mul(normal))}
    if(this.skill('S01-03-01'))this.credit('E',this.tapPower().mul(dt));
    this.state.seconds+=dt;this.state.miniElapsed+=dt;
    while(this.state.miniElapsed>=600&&this.state.miniCharges<3){this.state.miniElapsed-=600;this.state.miniCharges++}
    if(this.state.miniCharges>=3)this.state.miniElapsed=0;
    if(auto){this.autoBuy();if(this.state.automation.rebirth&&this.skill('S01-03-05')){let p=this.previewPrestige(1);if(p.ready&&p.reward.gte(5))this.prestige(1)}}this.checkAchievements();
  }
 offline(seconds){let cap=(8+Math.min(16,Math.max(0,this.researchAdd('offline_cap_add'))))*3600;let applied=clamp(seconds,0,cap);this.tick(applied*0.6,{auto:false});return applied}
 playMini(accuracy){if(this.state.miniCharges<1)return false;this.state.miniCharges-=1;let a=clamp(accuracy,0,1);let rate=this.production().add(this.tapPower());this.credit('E',rate.mul(60+60*a));this.state.miniBoost=180;this.state.miniMultiplier=1.15+0.15*a;this.state.miniWins=(this.state.miniWins||0)+1;this.checkAchievements();return true}
 checkAchievements(){
   let known=new Set(this.state.achievements),earned=[];
   for(let [id,name,condition] of ACHIEVEMENTS){if(!known.has(id)&&condition(this.state)){known.add(id);earned.push(id)}}
   if(earned.length)this.state.achievements.push(...earned);
   return earned;
 }
 achievements(){return ACHIEVEMENTS.filter(a=>this.state.achievements.includes(a[0])).map(a=>({id:a[0],name:a[1]}))}
 snapshot(){this.state.lastSave=Date.now();return JSON.parse(JSON.stringify(this.state))}
}
root.ForgeEngine=ForgeEngine;if(typeof module!=='undefined'&&module.exports)module.exports=ForgeEngine;
})(typeof globalThis!=='undefined'?globalThis:this);
