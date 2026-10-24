/* V9 — reversible production choices. Defaults remain 1 E/s for first extractor. */
(function(root){'use strict';
 const Engine=root.ForgeEngine;
 if(!Engine)throw Error('ForgeEngine is required');
 const originalProduction=Engine.prototype.production;
 const originalTap=Engine.prototype.tapPower;
 const modes={balanced:{production:1,tap:1},idle:{production:1.25,tap:.75},manual:{production:.8,tap:1.5}};
 function focusFor(eng){const key=eng.state?.settings?.focusMode||'balanced';return modes[key]||modes.balanced}
 Engine.prototype.production=function(){return originalProduction.call(this).mul(focusFor(this).production)};
 Engine.prototype.tapPower=function(){return originalTap.call(this).mul(focusFor(this).tap)};
 root.ForgeFocusModes=modes;
})(typeof globalThis!=='undefined'?globalThis:this);
