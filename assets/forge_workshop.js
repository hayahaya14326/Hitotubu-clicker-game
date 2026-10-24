/* INFINITY FORGE V11 — deterministic crafting, layout, staged automation.
   Loaded after expansion and before app; no third-party libraries. */
(function(root){'use strict';
 const Previous=root.ForgeEngine,H=root.Huge,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const stages=[
  {name:'手動点火',need:0,desc:'中央のコアをタップし、設備を購入する'},
  {name:'創造盤の設計',need:8,desc:'装置を盤面に配置して生産経路をつくる'},
  {name:'自動点火',need:25,desc:'コアが自動で点火する（毎秒0.6回）'},
  {name:'設備の自動調達',need:65,desc:'生産設備を自動購入する（約4秒に1回）'},
  {name:'素材の自動精製',need:150,desc:'素材を精製し、複雑な製法へ進む'},
  {name:'創造盤の自動整備',need:325,desc:'空いた盤面を自動で組み上げる'},
  {name:'自動創世循環',need:700,desc:'再誕を自動化し、次の創造へ進む'},
 ];
 const types={empty:{name:'空き',icon:'＋',cost:0,matter:0},collector:{name:'抽出器',icon:'◈',cost:18,matter:0},amplifier:{name:'増幅器',icon:'⌁',cost:100,matter:2},cooler:{name:'冷却器',icon:'❄',cost:80,matter:0},synth:{name:'精製器',icon:'◇',cost:600,matter:4}};
 const recipes=[{id:'particle',name:'粒子片',energy:30,particle:0,crystal:0,unlock:1,summary:'エネルギーを物質へ変換'},{id:'crystal',name:'凝縮結晶',energy:120,particle:3,crystal:0,unlock:2,summary:'粒子片から高密度結晶を作成'},{id:'star',name:'恒星核',energy:1800,particle:0,crystal:3,unlock:4,summary:'恒星の種となる物質を合成'}];
 const directions=i=>[i%3>0?i-1:-1,i%3<2?i+1:-1,i>2?i-3:-1,i<6?i+3:-1].filter(x=>x>=0);
 function initial(){return {operations:0,stage:0,board:['empty','empty','empty','empty','core','empty','empty','empty','empty'],selected:'collector',particles:0,crystals:0,stars:0,earnedParticles:0,earnedCrystals:0,earnedStars:0,tapCarry:0,synthCarry:0,autoBuyCarry:0,autoCraftCarry:0,autoLayoutCarry:0,autoPrestigeCarry:0,autoTapOn:true,autoBuyOn:true,autoCraftOn:true,autoLayoutOn:true,autoPrestigeOn:false,manualCrafts:0}}
 function sanitize(raw){let w={...initial(),...(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{})};w.board=Array.isArray(w.board)&&w.board.length===9?w.board.map((x,i)=>i===4?'core':(types[x]&&x!=='core'?x:'empty')):initial().board;for(let key of ['operations','particles','crystals','stars','earnedParticles','earnedCrystals','earnedStars','tapCarry','synthCarry','autoBuyCarry','autoCraftCarry','autoLayoutCarry','autoPrestigeCarry','manualCrafts'])w[key]=clamp(Number(w[key])||0,0,1e12);for(let key of ['autoTapOn','autoBuyOn','autoCraftOn','autoLayoutOn','autoPrestigeOn'])w[key]=w[key]!==false;w.stage=clamp(Math.floor(w.stage||0),0,6);if(!types[w.selected]||w.selected==='empty')w.selected='collector';return w}
 class ForgeWorkshop extends Previous{
  constructor(data,saved){super(data,saved);const existed=!!this.state.workshop;this.state.workshop=sanitize(this.state.workshop);if(!existed)this.state.workshop.operations=Math.min(1500,this.state.taps||0);this.refreshStage();}
  get workshop(){return this.state.workshop}
  refreshStage(){let w=this.workshop;let old=w.stage;for(let i=1;i<stages.length;i++)if(w.operations>=stages[i].need)w.stage=Math.max(w.stage,i);return w.stage>old}
  manualTap(){this.tap();const w=this.workshop;w.operations=clamp(w.operations+1,0,1e12);this.refreshStage()}
  boardStats(){let board=this.workshop.board,counts={collector:0,amplifier:0,cooler:0,synth:0};let raw=0;
   for(let i=0;i<9;i++){let type=board[i];if(counts[type]!==undefined)counts[type]++;if(type==='collector'){const adj=directions(i).filter(n=>board[n]==='amplifier').length;raw+=1.5*(1+0.7*adj)}}
   let heat=Math.max(0,counts.collector*20+counts.amplifier*12+counts.synth*18-counts.cooler*32),eff=heat>110?.35:heat>75?.65:1;
   return {counts,heat,eff,output:raw*eff};
  }
  workshopBonus(){let w=this.workshop;return 1+Math.min(1.5,w.earnedParticles*.002)+Math.min(1.5,w.earnedCrystals*.025)+Math.min(3,w.earnedStars*.20)}
  production(){let standard=super.production(),extra=H.from(this.boardStats().output).mul(this.baseMultiplier()).pow(this.exponent());return standard.add(extra).mul(this.workshopBonus());}
  tapPower(){return super.tapPower().mul(1+Math.min(.5,this.workshop.earnedCrystals*.01))}
  pieceCost(type){const item=types[type];if(!item||type==='empty')return null;return {E:H.from(item.cost).mul(Math.pow(1.04,this.state.unlockedTier)),particles:item.matter}}
  place(i,type){let w=this.workshop;i=Number(i);if(!Number.isInteger(i)||i<0||i>8||i===4||!types[type]||type==='core'||w.stage<1)return false;
   if(type==='synth'&&w.stage<4)return false;if(type==='amplifier'&&w.stage<2)return false;
   if(type===w.board[i])return false;if(type==='empty'){w.board[i]='empty';return true}
   let price=this.pieceCost(type);if(w.particles<price.particles||!this.amount('E').gte(price.E))return false;
   if(!this.pay('E',price.E))return false;w.particles-=price.particles;w.board[i]=type;return true;
  }
  craft(id){const recipe=recipes.find(r=>r.id===id);let w=this.workshop;if(!recipe||w.stage<recipe.unlock||w.particles<recipe.particle||w.crystals<recipe.crystal||!this.amount('E').gte(recipe.energy))return false;
   if(!this.pay('E',recipe.energy))return false;w.particles-=recipe.particle;w.crystals-=recipe.crystal;
   const field={particle:'particles',crystal:'crystals',star:'stars'}[id],earned={particle:'earnedParticles',crystal:'earnedCrystals',star:'earnedStars'}[id];w[field]++;w[earned]++;w.manualCrafts++;return true;
  }
  _autoBuyOne(){let candidates=this.facilities.filter(f=>f.tier===0&&this.canAfford(f));if(!candidates.length)return false;
   let best=null,score=-Infinity;for(const f of candidates){let out=H.from(f.base_output).mul(this.milestoneBonus(this.owned(f.id)+1)),cost=this.facilityCost(f);let s=out.log10().toNumber(1e9)-cost.log10().toNumber(1e9);if(s>score){score=s;best=f}}return best?this.buyFacility(best.id,1)>0:false;
  }
  _autoCraftOne(){let w=this.workshop;if(w.stage<4||!w.autoCraftOn)return false;
   if(w.crystals>=3&&this.amount('E').gte(1800)&&this.craft('star'))return true;
   if(w.particles>=3&&this.amount('E').gte(120)&&this.craft('crystal'))return true;
   return this.craft('particle');
  }
  _autoLayoutOne(){let w=this.workshop,board=w.board,empties=board.map((x,i)=>x==='empty'?i:-1).filter(x=>x>=0);if(!empties.length)return false;
    let heat=this.boardStats().heat,type=heat>62?'cooler':'collector';let i=empties[0];return this.place(i,type)}
  tick(dt,opts={}){super.tick(dt,opts);if(!Number.isFinite(dt)||dt<=0)return;dt=clamp(dt,0,86400);let w=this.workshop;this.refreshStage();
    if(w.stage>=2&&w.autoTapOn){let speed=w.stage>=5?3:w.stage>=4?2:w.stage>=3?1.2:.6;w.tapCarry+=speed*dt;let num=Math.floor(w.tapCarry);if(num>0){num=Math.min(250000,num);w.tapCarry-=num;this.credit('E',this.tapPower().mul(num));w.operations=clamp(w.operations+.28*num,0,1e12)}}
    this.refreshStage();
    const bs=this.boardStats();if(bs.counts.synth>0){w.synthCarry+=Math.min(86400,dt)*0.12*bs.counts.synth*bs.eff;const converted=Math.min(100000,Math.floor(w.synthCarry));if(converted>0){w.synthCarry-=converted;w.particles=clamp(w.particles+converted,0,1e12);w.earnedParticles=clamp(w.earnedParticles+converted,0,1e12)}}
    if(opts.auto===false)return;
    if(w.stage>=3&&w.autoBuyOn){w.autoBuyCarry+=dt;let period=w.stage>=5?.8:4;let runs=Math.min(15,Math.floor(w.autoBuyCarry/period));w.autoBuyCarry%=period;for(let j=0;j<runs;j++)this._autoBuyOne()}
    if(w.stage>=4&&w.autoCraftOn){w.autoCraftCarry+=dt;let runs=Math.min(8,Math.floor(w.autoCraftCarry/6));w.autoCraftCarry%=6;for(let j=0;j<runs;j++)this._autoCraftOne()}
    if(w.stage>=5&&w.autoLayoutOn){w.autoLayoutCarry+=dt;let runs=Math.min(3,Math.floor(w.autoLayoutCarry/9));w.autoLayoutCarry%=9;for(let j=0;j<runs;j++)this._autoLayoutOne()}
    if(w.stage>=6&&w.autoPrestigeOn&&this.state.unlockedTier>=1){w.autoPrestigeCarry+=dt;if(w.autoPrestigeCarry>=15){w.autoPrestigeCarry%=15;let p=this.previewPrestige(1);if(p.ready&&p.reward.gte(10))this.prestige(1)}}
  }
  playMini(){return false} // V11 replaces mini-game rewards with real workshop production.
  prestige(tier){const result=super.prestige(tier);if(result){let w=this.workshop;w.board=initial().board;w.particles=0;w.crystals=0;w.stars=0;w.autoBuyCarry=0;w.autoCraftCarry=0;w.autoLayoutCarry=0;w.synthCarry=0;}return result}
  automationList(){let w=this.workshop;return stages.map((s,i)=>({...s,index:i,unlocked:w.stage>=i,progress:Math.min(100,Math.floor(w.operations/s.need*100)||0)}))}
 }
 root.ForgeWorkshop=ForgeWorkshop;root.ForgeEngine=ForgeWorkshop;root.ForgeWorkshopData={stages,types,recipes};
})(typeof globalThis!=='undefined'?globalThis:this);
