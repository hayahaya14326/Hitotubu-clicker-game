/* INFINITY FORGE original adaptive music system.
   3 bundled original loops; no media network requests. Respect autoplay restrictions. */
(function(root){'use strict';
const tracks=[{name:'FIRST LIGHT',src:'assets/music/01_first_light.mp3'},{name:'STELLAR AWAKENING',src:'assets/music/02_stellar_awakening.mp3'},{name:'BEYOND INFINITY',src:'assets/music/03_beyond_infinity.mp3'}];
let enabled=false,volume=.32,current=-1,audio=null,fadeTimer=null,engine=()=>null,phaseTimestamp=0,lastStatus='';
function phase(){let e=engine();if(!e)return 0;return e.constellationStage?.()>=3?2:e.constellationStage?.()>=1?1:0}
function getSettings(){let s=engine()?.state.settings||{};s.bgmOn=s.bgmOn===true;s.bgmVolume=Number.isFinite(s.bgmVolume)?Math.max(0,Math.min(1,s.bgmVolume)):.32;return s}
function status(){let b=document.getElementById('bgm-toggle'),v=document.getElementById('bgm-volume');if(b){b.innerHTML='<span aria-hidden="true">♫</span><span class="bgm-state">BGM '+(enabled?'ON':'OFF')+'</span>';b.setAttribute('aria-pressed',String(enabled));b.title=enabled?`再生中：${tracks[current>=0?current:phase()].name}（クリックで停止）`:'BGMを再生する'}if(v)v.value=Math.round(volume*100)}
function replace(index){if(!enabled||index===current)return;let next=new Audio(tracks[index].src);next.loop=true;next.preload='auto';next.volume=0;next.setAttribute('aria-hidden','true');let previous=audio,old=previous?.volume||0;audio=next;current=index;phaseTimestamp=Date.now();if(fadeTimer)clearInterval(fadeTimer);
 next.play().catch(err=>{console.warn('BGMの再生を開始できませんでした:',err.message);enabled=false;audio=null;next.pause();status()});let steps=0;fadeTimer=setInterval(()=>{steps++;let x=Math.min(1,steps/20);if(next===audio)next.volume=Math.min(1,volume*x);if(previous){previous.volume=Math.max(0,old*(1-x));if(x>=1){previous.pause();previous.src=''}}if(x>=1){clearInterval(fadeTimer);fadeTimer=null}},65);status()}
function enable(on){on=!!on;let s=getSettings();s.bgmOn=on;enabled=on;
 if(!on){if(fadeTimer)clearInterval(fadeTimer);fadeTimer=null;if(audio){audio.pause();audio.src='';audio=null}current=-1;status();return}
 replace(phase());status()}
function setVolume(x){volume=Math.min(1,Math.max(0,Number(x)||0));getSettings().bgmVolume=volume;if(audio)audio.volume=volume;status()}
function sync(){if(!enabled)return;if(Date.now()-phaseTimestamp<3000)return;const wanted=phase();if(wanted!==current)replace(wanted)}
function init(fn){engine=fn;let s=getSettings();volume=s.bgmVolume;enabled=false;status();if(s.bgmOn){ // Autoplay normally requires a gesture; resume at the first interaction.
  let first=ev=>{if(ev.target?.closest?.('#bgm-toggle,#bgm-setting')){document.removeEventListener('pointerdown',first,true);document.removeEventListener('keydown',first,true);return}if(getSettings().bgmOn&&!enabled)enable(true);document.removeEventListener('pointerdown',first,true);document.removeEventListener('keydown',first,true)};
  document.addEventListener('pointerdown',first,true);document.addEventListener('keydown',first,true);
 }
 setInterval(sync,1900)}
function milestone(){// a small feedback chime is handled by existing WebAudio SFX layer
 sync()}
function showHint(){status();}
document.addEventListener('click',e=>{if(e.target.closest('#bgm-toggle')){e.preventDefault();e.stopImmediatePropagation();enable(!enabled);root.ForgeGameAPI?.save();return}},true);
document.addEventListener('input',e=>{if(e.target.id==='bgm-volume'||e.target.id==='bgm-volume-settings'){setVolume(Number(e.target.value)/100);root.ForgeGameAPI?.save()}},true);
document.addEventListener('change',e=>{if(e.target.id==='bgm-setting'){enable(e.target.checked);root.ForgeGameAPI?.save()}},true);
document.addEventListener('visibilitychange',()=>{if(!audio)return;if(document.hidden)audio.pause();else if(enabled)audio.play().catch(()=>{})});
root.ForgeScore={init,enable,setVolume,phase,sync,milestone,showHint,tracks,isEnabled:()=>enabled,getVolume:()=>volume};
})(window);
