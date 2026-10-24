/* Higher prestige tiers change scene identity instead of showing the same chapter forever. */
(function(root){'use strict';
const messages={
3:'無限は終わりではなかった。数えるための新しい言葉が生まれる。',4:'ひとつの無限を束ねれば、その先に別の境界が見える。',5:'時間の流れすら、創世炉の燃料になる。',6:'物理法則は、もう固定されたものではない。',7:'現実を構成する条件が静かに書き換わる。',8:'ひとつの宇宙から、宇宙を生む宇宙へ。',9:'階層を登るたび、観測者の尺度が変わっていく。',10:'世界の公理を、あなたの手で結び直す。',11:'矛盾さえも、創造に使える資源となった。',12:'数えられない世界に、新しい秩序が宿る。',13:'最初の光を、もう一度見る。',14:'存在の外側にも、まだ創れるものがある。',15:'終わりなき鍛造。次の創世は、ここから始まる。'};
root.ForgeBeyondVisual={update(engine){const tier=engine?.state.unlockedTier||0;if(tier<3)return;const d=engine.data.prestige[tier-1];document.body.dataset.cosmicTier=String(tier);const e=id=>document.getElementById(id);if(e('cosmos-title'))e('cosmos-title').textContent=d.name_ja+'の宇宙';if(e('cosmos-subtitle'))e('cosmos-subtitle').textContent=d.main_system;if(e('cosmos-chapter'))e('cosmos-chapter').textContent='COSMIC LAYER · '+String(tier).padStart(2,'0')+' / 15';if(e('cosmos-whisper'))e('cosmos-whisper').textContent=messages[tier]||messages[15]}}
})(typeof globalThis!=='undefined'?globalThis:this);
