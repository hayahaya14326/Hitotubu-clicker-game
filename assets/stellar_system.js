/* INFINITY FORGE V12 – optional-depth stellar, planetary, network & parallel universe economy.
   Designed to load after forge_workshop.js and before app.js. No external services. */
(function(root){'use strict';
const Base=root.ForgeEngine,H=root.Huge,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const STAR_KINDS={ember:{name:'琥珀星',desc:'安定した星屑生成。最初の恒星におすすめ',dust:1.0,energy:.16,color:'#e5b36e'},azure:{name:'蒼光星',desc:'星屑よりも研究知識の生成が得意',dust:.65,energy:.23,color:'#96bded'},crimson:{name:'紅蓮星',desc:'多くの星屑を生むが生産倍率は控えめ',dust:1.65,energy:.10,color:'#e78671'}};
const PLANETS={mineral:{name:'鉱物惑星',desc:'星屑の採集を加速',dust:1.3,insight:.08,energy:.03,color:'#b69e82'},ocean:{name:'海洋惑星',desc:'文明知識の生産に優れる',dust:.35,insight:.42,energy:.04,color:'#77bac1'},garden:{name:'緑の惑星',desc:'全体生産倍率の底上げ',dust:.55,insight:.20,energy:.12,color:'#a2c7a2'},frozen:{name:'氷晶惑星',desc:'恒星出力を増幅する',dust:.45,insight:.17,energy:.075,color:'#a8c3d6'}};
const ROUTES={industry:{name:'工業航路',desc:'星系間のエネルギー搬送を強化',energy:.18,insight:.10},learning:{name:'学術航路',desc:'文明知識の収集効率を強化',energy:.05,insight:.40},supply:{name:'補給航路',desc:'恒星の星屑生成量を強化',energy:.09,insight:.18}};
const UNIVERSES={bloom:{name:'豊穣宇宙',desc:'エネルギー生産特化',energy:.35,dust:.05,insight:.05},archive:{name:'知識宇宙',desc:'文明知識の生産特化',energy:.12,dust:.05,insight:.5},rhythm:{name:'循環宇宙',desc:'星屑と設備自動化を強化',energy:.16,dust:.48,insight:.08}};
const DEFAULT=()=>({stars:[],planets:[],routes:[],universes:[],dust:0,insight:0,totalDust:0,totalInsight:0,autoStar:false,autoPlanet:false,autoRoute:false,autoUniverse:false,autoClock:0,discoveries:[],lastEvent:null});
const finite=(x,limit=1e15)=>clamp(Number.isFinite(Number(x))?Number(x):0,0,limit);
function sanitize(raw){const s={...DEFAULT(),...(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{})};
 s.stars=(Array.isArray(s.stars)?s.stars:[]).filter(x=>x&&STAR_KINDS[x.kind]).slice(0,12).map(x=>({kind:x.kind,level:clamp(Math.floor(finite(x.level,25)||1),1,25)}));
 s.planets=(Array.isArray(s.planets)?s.planets:[]).filter(x=>x&&PLANETS[x.kind]).slice(0,24).map(x=>({kind:x.kind,level:clamp(Math.floor(finite(x.level,20)||1),1,20)}));
 s.routes=(Array.isArray(s.routes)?s.routes:[]).filter(x=>x&&ROUTES[x]).slice(0,10);
 s.universes=(Array.isArray(s.universes)?s.universes:[]).filter(x=>x&&UNIVERSES[x]).slice(0,8);
 for(const k of ['dust','insight','totalDust','totalInsight','autoClock'])s[k]=finite(s[k]);for(const k of ['autoStar','autoPlanet','autoRoute','autoUniverse'])s[k]=s[k]===true;
 s.discoveries=Array.isArray(s.discoveries)?[...new Set(s.discoveries.filter(x=>typeof x==='string'))].slice(0,30):[];
 return s}
class ForgeStellar extends Base{
 constructor(data,saved){super(data,saved);this.state.cosmos=sanitize(this.state.cosmos);this._stellarLastStage='';}
 get cosmos(){return this.state.cosmos}
 cosmosAvailable(){return this.workshop.earnedStars>0||this.workshop.stars>0||this.cosmos.stars.length>0||this.state.unlockedTier>=1}
 constellationStage(){const c=this.cosmos;if(c.universes.length||this.state.unlockedTier>=6)return 4;if(c.routes.length||this.state.unlockedTier>=3)return 3;if(c.planets.length)return 2;if(c.stars.length)return 1;return 0}
 recordCosmos(text){const c=this.cosmos;c.lastEvent=String(text).slice(0,90);if(!c.discoveries.includes(text))c.discoveries.push(text);}
 starCost(){return {cores:1,crystals:2,energy:H.from('2e4').mul(H.from(4).pow(this.cosmos.stars.length))}}
 forgeStar(kind){const c=this.cosmos,w=this.workshop,cost=this.starCost();if(!STAR_KINDS[kind]||w.stage<4||c.stars.length>=12||w.stars<cost.cores||w.crystals<cost.crystals||!this.amount('E').gte(cost.energy))return false;
 if(!this.pay('E',cost.energy))return false;w.stars--;w.crystals-=cost.crystals;c.stars.push({kind,level:1});if(c.stars.length===1)this.recordCosmos('最初の恒星が誕生した');return true}
 upgradeStar(index){const c=this.cosmos,s=c.stars[index];if(!s||s.level>=25)return false;const cost=this.starUpgradeCost(index);if(c.dust<cost)return false;c.dust-=cost;s.level++;return true}
 starUpgradeCost(index){let star=this.cosmos.stars[index];return star?Math.ceil(14*Math.pow(star.level,1.8)):Infinity}
 planetCost(){const n=this.cosmos.planets.length;return {dust:Math.ceil(24*Math.pow(1.42,n)),crystals:n<3?1:2,energy:H.from('1e5').mul(H.from(2.2).pow(n))}}
 forgePlanet(kind){const c=this.cosmos,w=this.workshop,cost=this.planetCost();if(!PLANETS[kind]||!c.stars.length||c.planets.length>=Math.min(24,c.stars.length*4)||c.dust<cost.dust||w.crystals<cost.crystals||!this.amount('E').gte(cost.energy))return false;
 if(!this.pay('E',cost.energy))return false;c.dust-=cost.dust;w.crystals-=cost.crystals;c.planets.push({kind,level:1});if(c.planets.length===1)this.recordCosmos('惑星が初めて形成された');return true}
 upgradePlanet(i){const p=this.cosmos.planets[i];if(!p||p.level>=20)return false;const cost=this.planetUpgradeCost(i);if(this.cosmos.insight<cost)return false;this.cosmos.insight-=cost;p.level++;return true}
 planetUpgradeCost(i){const p=this.cosmos.planets[i];return p?Math.ceil(12*Math.pow(p.level,1.6)):Infinity}
 routeCost(){let n=this.cosmos.routes.length;return {insight:Math.ceil(80*Math.pow(1.5,n)),dust:Math.ceil(105*Math.pow(1.3,n))}}
 establishRoute(kind){let c=this.cosmos,cost=this.routeCost();if(!ROUTES[kind]||c.planets.length<3||c.routes.length>=10||c.insight<cost.insight||c.dust<cost.dust)return false;c.insight-=cost.insight;c.dust-=cost.dust;c.routes.push(kind);if(c.routes.length===1)this.recordCosmos('星系に初めて交易航路が開通した');return true}
 universeCost(){const n=this.cosmos.universes.length;return H.from(Math.max(1,Math.ceil(3*Math.pow(2.4,n))))}
 createUniverse(kind){const c=this.cosmos,cost=this.universeCost();if(!UNIVERSES[kind]||this.state.unlockedTier<3||c.routes.length<2||c.universes.length>=8||!this.amount('I').gte(cost))return false;
 if(!this.pay('I',cost))return false;c.universes.push(kind);if(c.universes.length===1)this.recordCosmos('並行宇宙への扉が開かれた');return true}
 stellarRates(){const c=this.cosmos;let dust=0,insight=0;for(const s of c.stars){const k=STAR_KINDS[s.kind];dust+=(.35+.07*s.level)*k.dust;insight+=s.kind==='azure'?.07*s.level:.012*s.level}
 for(const p of c.planets){const k=PLANETS[p.kind];dust+=k.dust*(.07+.03*p.level);insight+=k.insight*(.4+.12*p.level)}
 let rb=1;for(let k of c.routes){insight*=1+ROUTES[k].insight*.065;rb*=k==='supply'?1.14:1.025}
 for(let k of c.universes){dust*=1+UNIVERSES[k].dust;insight*=1+UNIVERSES[k].insight}
 return {dust:dust*rb,insight}}
 stellarMultiplier(){const c=this.cosmos;let multiplier=1;for(const s of c.stars)multiplier*=1+STAR_KINDS[s.kind].energy*(.7+s.level*.1);for(const p of c.planets)multiplier*=1+PLANETS[p.kind].energy*(.5+p.level*.12);for(const k of c.routes)multiplier*=1+ROUTES[k].energy;for(const k of c.universes)multiplier*=1+UNIVERSES[k].energy;return clamp(multiplier,1,1e14)}
 production(){const c=this.cosmos;let direct=0;for(const star of c.stars)direct+=(200+45*star.level)*(star.kind==='azure'?1.2:star.kind==='crimson'?.85:1);for(const planet of c.planets)direct+=65*planet.level;return super.production().mul(this.stellarMultiplier()).add(H.from(direct).mul(this.baseMultiplier()))}
 setCosmosAuto(id,flag){const min={autoStar:2,autoPlanet:3,autoRoute:6,autoUniverse:9};if(!(id in min)||this.state.unlockedTier<min[id])return false;this.cosmos[id]=!!flag;return true}
 _autoCosmos(){let c=this.cosmos;
 if(c.autoStar&&this.state.unlockedTier>=2&&c.stars.length<12){this.forgeStar(['ember','azure','crimson'][c.stars.length%3])}
 if(c.autoPlanet&&this.state.unlockedTier>=3&&c.planets.length<24)this.forgePlanet(['mineral','ocean','garden','frozen'][c.planets.length%4]);
 if(c.autoRoute&&this.state.unlockedTier>=6&&c.routes.length<10)this.establishRoute(['industry','learning','supply'][c.routes.length%3]);
 if(c.autoUniverse&&this.state.unlockedTier>=9&&c.universes.length<8)this.createUniverse(['bloom','archive','rhythm'][c.universes.length%3]);}
 tick(dt,opts={}){super.tick(dt,opts);if(!Number.isFinite(dt)||dt<=0)return;const c=this.cosmos;const elapsed=clamp(dt,0,86400);const r=this.stellarRates();c.dust=finite(c.dust+r.dust*elapsed);c.insight=finite(c.insight+r.insight*elapsed);c.totalDust=finite(c.totalDust+r.dust*elapsed);c.totalInsight=finite(c.totalInsight+r.insight*elapsed);this.state.knowledge=finite((this.state.knowledge||0)+r.insight*elapsed*.35);
 if(opts.auto!==false){c.autoClock+=elapsed;const n=Math.min(12,Math.floor(c.autoClock/8));c.autoClock%=8;for(let i=0;i<n;i++)this._autoCosmos()}}
 /* Cosmic infrastructure is a permanent discovery system. Prestige resets workshop material stock but not built stars / worlds. */
}
root.ForgeEngine=ForgeStellar;root.ForgeStellarData={stars:STAR_KINDS,planets:PLANETS,routes:ROUTES,universes:UNIVERSES};
if(typeof module!=='undefined'&&module.exports)module.exports=ForgeStellar;
})(typeof globalThis!=='undefined'?globalThis:this);
