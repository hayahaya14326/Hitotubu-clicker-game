/* Observatory interface utilities. Does not modify game engine or save data. */
(()=>{
  'use strict';
  const body=document.body;
  const nav=document.querySelector('.mobile-nav');
  if(!nav)return;
  const valid=['core','equipment','automation','achievements','guide','research','prestige','skills','workshop','celestial','explore','civil','laws','challenge','constellations'];
  function reconcile(){
    const view=valid.includes(body.dataset.mobileView)?body.dataset.mobileView:'core';
    const current=nav.querySelector(`[data-mobile="${view}"]`);
    if(current && current.hidden){body.dataset.mobileView='core';return reconcile()}
    for(const b of nav.querySelectorAll('[data-mobile]')){
      b.classList.toggle('active',b.dataset.mobile===view);
      if(b.dataset.mobile===view)b.setAttribute('aria-current','page');
      else b.removeAttribute('aria-current');
    }
    const more=nav.querySelector('[data-action="feature-menu"]');if(more){let on=!['core','equipment','automation','achievements'].includes(view);more.classList.toggle('active',on);if(on)more.setAttribute('aria-current','page');else more.removeAttribute('aria-current')}
    const label=({core:'ホーム',equipment:'生産設備',guide:'案内',automation:'自動化',achievements:'実績',research:'研究',prestige:'転生',skills:'スキル',mini:'ミニゲーム'})[view];
    document.title=`${label} | ひとつぶ`;
  }
  new MutationObserver(reconcile).observe(body,{attributes:true,attributeFilter:['data-mobile-view']});
  new MutationObserver(reconcile).observe(nav,{subtree:true,attributes:true,attributeFilter:['hidden']});
  nav.addEventListener('click',event=>{
    if(event.target.closest('[data-mobile]')){
      requestAnimationFrame(()=>{reconcile();if(window.matchMedia('(max-width: 760px)').matches){window.scrollTo({top:0,behavior:'instant'})}});
    }
  });
  reconcile();
})();
