/* INFINITY FORGE: nonnegative layered logarithmic numbers.
 * Canonical: layer 0 = value; layer 1 = log10(value);
 * layer N = N repeated logs of value. Layer changes at 1e9.
 * Higher layer arithmetic is approximate by design (dominance), not arbitrary-precision.
 */
(function(root){'use strict';
const THRESHOLD=1e9, LOG_BOUND=9;
class Huge {
  constructor(layer=0,mag=0){
    if(!Number.isInteger(layer)||layer<0||layer>1000000||!Number.isFinite(mag)||mag<0)throw Error('Invalid Huge number');
    this.layer=layer;this.mag=mag;this.normalize();
  }
  normalize(){
    while((this.layer===0&&this.mag>=THRESHOLD)||(this.layer>0&&this.mag>=THRESHOLD)){
      this.mag=Math.log10(this.mag);this.layer++;
    }
    while(this.layer>0&&this.mag<LOG_BOUND){
      this.mag=Math.pow(10,this.mag);this.layer--;
    }
    return this;
  }
  static from(x){
    if(x instanceof Huge)return x;
    if(typeof x==='number')return new Huge(0,Math.max(0,x));
    if(Array.isArray(x)&&x.length===2)return new Huge(x[0],x[1]);
    if(x&&typeof x==='object'&&Number.isInteger(x.layer))return new Huge(x.layer,x.mag);
    if(typeof x!=='string')throw Error('Invalid Huge input');
    let s=x.trim();
    let tower=/^10\^\^(\d+)$/i.exec(s);
    if(tower){let height=Number(tower[1]); if(height<1||height>1000000)throw Error('Unsupported tower height');return height===1?Huge.from(10):new Huge(height-1,10)}
    let towerLayer=/^e\^(\d+)\((\d+(?:\.\d+)?)\)$/.exec(s);
    if(towerLayer)return new Huge(Number(towerLayer[1]),Number(towerLayer[2]));
    let es=/^(e{2,})([+-]?\d+(?:\.\d+)?)$/i.exec(s);
    if(es)return new Huge(es[1].length,Number(es[2]));
    let sci=/^([+-]?\d+(?:\.\d+)?)e([+-]?\d+(?:\.\d+)?)$/i.exec(s);
    if(sci){let mant=Number(sci[1]),ex=Number(sci[2]);if(mant<=0)return Huge.zero();let log=Math.log10(mant)+ex;if(log<9)return Huge.from(10**log);return new Huge(1,log)}
    if(s[0]==='e'&&/^e\d+(?:\.\d+)?$/i.test(s))return new Huge(1,Number(s.slice(1)));
    let num=Number(s);if(!Number.isFinite(num)||num<0)throw Error('Cannot parse Huge: '+s);return new Huge(0,num);
  }
  static zero(){return new Huge(0,0)}
  static one(){return new Huge(0,1)}
  isZero(){return this.layer===0&&this.mag===0}
  cmp(value){let b=Huge.from(value);if(this.layer!==b.layer)return Math.sign(this.layer-b.layer);return Math.sign(this.mag-b.mag)}
  gte(b){return this.cmp(b)>=0} gt(b){return this.cmp(b)>0} lt(b){return this.cmp(b)<0} eq(b){return this.cmp(b)===0}
  add(value){let b=Huge.from(value);if(this.isZero())return b;if(b.isZero())return this;
    let a=this;if(a.lt(b)){a=b;b=this}
    if(a.layer===0)return Huge.from(a.mag+b.mag);
    if(a.layer!==b.layer)return a;
    if(a.layer===1){let d=a.mag-b.mag;if(d>16)return a;return new Huge(1,a.mag+Math.log10(1+Math.pow(10,-d)))}
    return a;
  }
  sub(value){let b=Huge.from(value);if(this.cmp(b)<=0)return Huge.zero();
    if(b.isZero()||this.layer>b.layer)return this;
    if(this.layer===0)return Huge.from(Math.max(0,this.mag-b.mag));
    if(this.layer===1){let d=this.mag-b.mag;if(d>16)return this;return Huge.pow10(Huge.from(this.mag+Math.log10(-Math.expm1(-d*Math.LN10))))}
    return this;
  }
  log10(){if(this.isZero())return Huge.zero();if(this.layer===0)return Huge.from(Math.max(0,Math.log10(this.mag)));return new Huge(this.layer-1,this.mag)}
  static pow10(value){let v=Huge.from(value);if(v.layer===0&&v.mag<9)return Huge.from(10**v.mag);return new Huge(v.layer+1,v.mag)}
  mul(value){let b=Huge.from(value);if(this.isZero()||b.isZero())return Huge.zero();
    if(this.layer===0&&b.layer===0)return Huge.from(this.mag*b.mag);
    if(b.layer===0&&b.mag<1)return this.layer===1?new Huge(1,this.mag+Math.log10(b.mag)):this;
    if(this.layer===0&&this.mag<1)return b.layer===1?new Huge(1,b.mag+Math.log10(this.mag)):b;
    return Huge.pow10(this.log10().add(b.log10()))}
  div(value){let b=Huge.from(value);if(b.isZero())throw Error('divide by 0');if(this.isZero())return Huge.zero();if(this.layer===0&&b.layer===0)return Huge.from(this.mag/b.mag);
    if(b.layer===0&&b.mag<1)return this.layer===1?new Huge(1,this.mag-Math.log10(b.mag)):this;
    if(this.layer===0&&this.mag<1)return Huge.zero();
    if(this.layer===1&&b.layer===1){let diff=this.mag-b.mag;return diff<0?Huge.from(diff < -300 ? 0:10**diff):Huge.pow10(Huge.from(diff));}
    if(this.lt(b))return Huge.zero();
    return Huge.pow10(this.log10().sub(b.log10()));
  }
  pow(exp){let n=Huge.from(exp);if(this.isZero())return Huge.zero();if(this.layer===0&&this.mag===1)return Huge.one();if(this.layer===0&&this.mag<1)return Huge.from(Math.pow(this.mag,n.toNumber(1e6)));return Huge.pow10(this.log10().mul(n))}
  sqrt(){return this.pow(0.5)}
  toNumber(cap=Number.MAX_VALUE){if(this.layer===0)return Math.min(this.mag,cap);if(this.layer===1&&this.mag<308)return Math.min(10**this.mag,cap);return cap}
  toJSON(){return [this.layer,this.mag]}
  format(precision=2){
    if(this.layer===0){if(this.mag<1e3)return Number(this.mag.toFixed(Math.min(precision,5))).toLocaleString('en-US');return Math.floor(this.mag).toLocaleString('en-US')}
    if(this.layer===1)return '1e'+Number(this.mag.toFixed(precision)).toString();
    if(this.layer<=4)return 'e'.repeat(this.layer)+Number(this.mag.toFixed(precision)).toString();
    return 'e^'+this.layer+'('+Number(this.mag.toFixed(precision)).toString()+')';
  }
}
root.Huge=Huge;if(typeof module!=='undefined'&&module.exports)module.exports=Huge;
})(typeof globalThis!=='undefined'?globalThis:this);
