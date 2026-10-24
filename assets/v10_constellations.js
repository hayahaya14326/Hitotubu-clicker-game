/* INFINITY FORGE V10 — 20 persistent but optional star-chart commissions.
   Data is stored inside the normal v1 save. No independent storage. */
(function(root){'use strict';
 const Engine=root.ForgeEngine, Huge=root.Huge;
 if(!Engine||!Huge)throw Error('Constellation dependencies missing');
 const paths=[
  {key:'energy',title:'創造の航路',desc:'歴代最高エネルギーを更新する',kind:'energy',goals:[['最初の観測','1e4'],['百万の光','1e6'],['再誕の扉','1e9'],['次元の兆し','1e24'],['数字の境界','1e308']]},
  {key:'tap',title:'操縦の航路',desc:'手動タップの回数を重ねる',kind:'taps',goals:[['最初の習熟',25],['コア操縦士',100],['精密操縦',500],['長い航海',2000],['熟練観測者',10000]]},
  {key:'machine',title:'機械の航路',desc:'同じ周回の設備合計数を育てる',kind:'owned',goals:[['小さな工場',10],['生産基地',25],['工業都市',50],['恒星群工場',125],['無限生産網',500]]},
  {key:'tier',title:'超越の航路',desc:'新しい転生階層にたどり着く',kind:'tier',goals:[['再誕の記録',1],['次元の記録',2],['無限の記録',3],['概念の記録',6],['最上階層の記録',15]]}
 ];
 const rows=paths.flatMap(path=>path.goals.map(([name,target],i)=>({id:`${path.key}-${i}`,name,target,kind:path.kind,branch:path.key,level:i+1})));
 const ids=new Set(rows.map(r=>r.id));
 function clean(arr){return Array.isArray(arr)?[...new Set(arr.filter(x=>typeof x==='string'&&ids.has(x)))].slice(0,20):[]}
 const Core=Object.getPrototypeOf(Engine);
 const oldRestore=Core.restore;
 Core.restore=function(input){const restored=oldRestore.call(this,input);restored.constellations=clean(restored.constellations);return restored};
 function valueFor(eng,kind){if(kind==='energy')return Huge.from(eng.state.bestE||0);if(kind==='taps')return Math.max(0,Number(eng.state.taps)||0);if(kind==='owned')return Object.values(eng.state.facilities).reduce((v,n)=>v+Math.max(0,Number(n)||0),0);return Math.max(0,Number(eng.state.unlockedTier)||0)}
 function reached(eng,row){return row.kind==='energy'?valueFor(eng,'energy').gte(Huge.from(row.target)):valueFor(eng,row.kind)>=Number(row.target)}
 const prev=Engine.prototype.baseMultiplier;
 Engine.prototype.baseMultiplier=function(){return prev.call(this).mul(Math.pow(1.04,clean(this.state.constellations).length))};
 Engine.prototype.claimConstellation=function(id){const row=rows.find(x=>x.id===id);if(!row)return false;this.state.constellations=clean(this.state.constellations);if(this.state.constellations.includes(id)||!reached(this,row))return false;
  const prior=rows.filter(x=>x.branch===row.branch&&x.level<row.level);
  if(prior.some(x=>!this.state.constellations.includes(x.id)))return false;
  this.state.constellations.push(id);if(typeof this.logAction==='function')this.logAction('星図計画：'+row.name+' を完了');return true;
 };
 root.ForgeConstellations={paths,rows,clean,valueFor,reached,bonus:(eng)=>Math.pow(1.04,clean(eng.state.constellations).length)};
})(typeof globalThis!=='undefined'?globalThis:this);
