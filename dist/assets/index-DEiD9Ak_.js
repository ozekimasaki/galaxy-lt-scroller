(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`@kicker EPISODE V2
# Galaxy LT Scroller

ライトニングトークを、ただのスライド送りから、会場の空気ごと巻き込む演出へ。

Enterキーだけで発表者の声、間、笑い、拍手に合わせて宇宙の奥へ進行します。

---

@kicker MISSION
## 5分の集中力を守る

均一なスライドが続くイベントでも、最初の数秒で視線を集め、最後まで記憶に残るLTを作ります。

特別なアプリは不要。ブラウザだけで起動できる軽量なプレゼンテーションシステムです。

---

@kicker HOLOGRAM MEDIA
## 画像も同じ軌道へ

![3Dクロール上にテキストと画像が並ぶ構成図](/assets/holo-flow.svg)

@caption 図解、写真、キービジュアルをSF風の青い透過エフェクトで表示。

---

@kicker CONTROL UX
## Enterで段階進行

初期状態では、次のセクションが画面下部で待機します。

Enterで読みやすい速度のスクロールを開始。スクロール中にもう一度Enterを押すと、現在の内容が急加速して消え、次の展開が滑らかに現れます。

---

@kicker LIVE READY
## 話す速度を主役に

![発表者の話速とEnter操作に合わせて進むコンソール図](/assets/talk-speed-console.svg)

@caption 自動再生に追われず、発表者のタイミングで会場を制御する。
`,t=document.querySelector(`#crawl-root`),n=document.querySelector(`#state-label`),r=document.querySelector(`#section-label`),i=document.querySelector(`#prompt-text`),a=document.querySelector(`#primary-action`),o=document.querySelector(`#auto-action`),s=document.querySelector(`#reset-action`),c={below:`translate3d(-50%, 86vh, 64px) rotateX(58deg) scale(1.05)`,idle:`translate3d(-50%, 56vh, 0) rotateX(58deg) scale(1)`,far:`translate3d(-50%, -154vh, -560px) rotateX(62deg) scale(0.16)`},l={crawlDistanceVh:210,entryDistanceVh:30,visibleExitRatio:.56,autoPauseMs:420},u=x(e),d=0,f=`idle`,p=null,m=null,h=null,g=null,_=null,v=null,y=!1,b=!1;function x(e){return e.split(/^---\s*$/m).map(e=>S(e.trim())).filter(e=>e.title||e.paragraphs.length||e.image)}function S(e){let t=e.split(/\r?\n/),n={kicker:``,title:``,level:2,paragraphs:[],image:null,caption:``,duration:null},r=[],i=()=>{r.length&&(n.paragraphs.push(r.join(` `).trim()),r=[])};for(let e of t){let t=e.trim();if(!t){i();continue}let a=t.match(/^@([a-z]+)\s+(.+)$/i);if(a){i(),C(n,a[1].toLowerCase(),a[2].trim());continue}let o=t.match(/^(#{1,2})\s+(.+)$/);if(o){i(),n.level=o[1].length,n.title=o[2].trim();continue}let s=t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);if(s){i(),n.image={alt:s[1].trim(),src:s[2].trim()};continue}r.push(t)}return i(),n}function C(e,t,n){if(t===`kicker`){e.kicker=n;return}if(t===`caption`){e.caption=n;return}if(t===`duration`){let t=Number.parseInt(n,10);e.duration=Number.isFinite(t)&&t>0?t:null}}function w(e,t){let n=document.createElement(`article`);if(n.className=`crawl-section`,n.setAttribute(`aria-label`,e.title||`Section ${t+1}`),e.kicker){let t=document.createElement(`span`);t.className=`kicker`,t.textContent=e.kicker,n.append(t)}if(e.title){let t=document.createElement(e.level===1?`h1`:`h2`);t.textContent=e.title,n.append(t)}if(e.image){let t=document.createElement(`figure`);t.className=`media-frame`;let r=document.createElement(`img`);r.src=e.image.src,r.alt=e.image.alt,t.append(r),n.append(t)}if(e.paragraphs.forEach((e,r)=>{let i=document.createElement(`p`);i.textContent=e,r===0&&t===0&&(i.className=`lead`),n.append(i)}),e.caption){let t=document.createElement(`p`);t.className=`caption`,t.textContent=e.caption,n.append(t)}return n}function T(e,n=c.idle){let r=w(u[e],e);return r.style.transform=n,r.style.opacity=`1`,r.style.filter=`none`,t.append(r),r}function E(e){return Math.round(j(e)*(l.entryDistanceVh/l.crawlDistanceVh))}function D(e,t,n=0){return e.animate([{transform:c.below,opacity:1,filter:`blur(0px)`},{transform:c.idle,opacity:1,filter:`blur(0px)`}],{delay:n,duration:E(u[t]),easing:`linear`,fill:`both`})}function O(){let e=u.length;if(r.textContent=`${Math.min(d+1,e)} / ${e}`,f===`complete`){n.textContent=`Complete`,i.textContent=`最初に戻る`,a.textContent=`Replay`,o.textContent=y?`Auto On`:`Auto Off`;return}if(o.textContent=y?`Auto On`:`Auto Off`,f===`entering`){n.textContent=y?`Auto cue`:`Cueing`,i.textContent=y?`自動再生中`:`次を表示中`,a.textContent=`Advance`;return}if(f===`scrolling`){n.textContent=y?`Auto scrolling`:`Scrolling`,i.textContent=y?`自動再生中`:`次へ`,a.textContent=`Next`;return}n.textContent=`Standby`,i.textContent=y?`自動再生待機`:d===0?`開始`:`次へ`,a.textContent=d===0?`Start`:`Advance`}function k(e=!1){if(R(),z(),B(),t.innerHTML=``,m=null,h=null,!u.length){A();return}if(d>=u.length){p=null,f=`complete`,O();return}if(p=T(d),e){f=`entering`,O(),h=D(p,d),h.onfinish=M,V(u[d]);return}f=`idle`,O(),H()}function A(){let e=document.createElement(`article`);e.className=`crawl-section`,e.style.transform=c.idle,e.innerHTML=`<h1>No slides</h1><p>src/slides.md に原稿を追加してください。</p>`,t.replaceChildren(e),f=`complete`,n.textContent=`No slides`,r.textContent=`0 / 0`,i.textContent=`原稿なし`,a.textContent=`Reload`}function j(e){if(e.duration)return e.duration;let t=[e.title,...e.paragraphs,e.caption].join(``).length;return Math.min(21e3,Math.max(12e3,t*78))}function M(){f===`entering`&&(z(),h=null,f=`idle`,O(),H())}function N(){f===`scrolling`&&(B(),m?.cancel(),m=null,p?.remove(),d+=1,k(!0))}function P(){if(R(),z(),B(),!p||d>=u.length){k();return}f=`scrolling`,O(),m=p.animate([{transform:c.idle,opacity:1,filter:`blur(0px)`},{transform:c.far,opacity:.03,filter:`blur(1.4px)`}],{duration:j(u[d]),easing:`linear`,fill:`forwards`}),m.onfinish=N,v=window.setTimeout(N,Math.round(j(u[d])*l.visibleExitRatio))}function F(){!m||f!==`scrolling`||(B(),m.cancel(),m=null,p?.remove(),d+=1,k(!0))}function I(){if(f===`complete`){L();return}if(f===`entering`){h?.finish(),M(),P();return}if(f===`scrolling`){F();return}f===`idle`&&P()}function L(){R(),z(),B(),m?.cancel(),h?.cancel(),d=0,f=`idle`,k()}function R(){g&&=(window.clearTimeout(g),null)}function z(){_&&=(window.clearTimeout(_),null)}function B(){v&&=(window.clearTimeout(v),null)}function V(e){z(),_=window.setTimeout(M,E(e)+80)}function H(){R(),!(!y||f!==`idle`)&&(g=window.setTimeout(()=>{g=null,y&&f===`idle`&&P()},l.autoPauseMs))}function U(){if(y=!y,O(),y){H();return}R()}function W(){b=!b,document.body.classList.toggle(`hud-hidden`,b)}document.addEventListener(`keydown`,e=>{let t=e.target;if(!(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement||t?.isContentEditable)){if(e.key===`Enter`){e.preventDefault(),I();return}if(e.key.toLowerCase()===`a`){e.preventDefault(),U();return}e.key.toLowerCase()===`h`&&(e.preventDefault(),W())}}),a.addEventListener(`click`,I),o.addEventListener(`click`,U),s.addEventListener(`click`,L),K(),k();function G(e,t){return Math.random()*(t-e)+e}function K(){let e=[{el:document.querySelector(`.stars-a`),count:70,colorBias:[0,1]},{el:document.querySelector(`.stars-b`),count:130,colorBias:[0,2]},{el:document.querySelector(`.stars-c`),count:160,colorBias:[0]}],t=[`rgba(255, 255, 255, 0.95)`,`rgba(120, 217, 255, 0.85)`,`rgba(255, 224, 130, 0.85)`,`rgba(255, 255, 255, 0.75)`,`rgba(200, 230, 255, 0.8)`],n=[{className:`star-near`,sizeMin:1.5,sizeMax:3.2,opacityMin:.75,opacityMax:1,durationMin:22,durationMax:38,driftXMin:-200,driftXMax:200,driftYMin:80,driftYMax:220,glowMax:5},{className:`star-mid`,sizeMin:1,sizeMax:2.2,opacityMin:.45,opacityMax:.85,durationMin:38,durationMax:58,driftXMin:-140,driftXMax:140,driftYMin:40,driftYMax:160,glowMax:3},{className:`star-far`,sizeMin:.6,sizeMax:1.6,opacityMin:.25,opacityMax:.55,durationMin:55,durationMax:90,driftXMin:-80,driftXMax:80,driftYMin:20,driftYMax:100,glowMax:2}];e.forEach(e=>{let{el:r,count:i,colorBias:a}=e;if(r)for(let e=0;e<i;e++){let e=n[Math.floor(Math.random()*n.length)],i=document.createElement(`span`);i.className=`star ${e.className}`;let o=G(e.sizeMin,e.sizeMax),s=G(-10,110),c=G(-10,110),l=G(e.opacityMin,e.opacityMax),u=G(e.durationMin,e.durationMax),d=G(e.driftXMin,e.driftXMax),f=G(e.driftYMin,e.driftYMax),p=G(0,u),m=G(2.5,6.5),h=G(0,m),g=G(0,e.glowMax),_=a.length===1?a[0]:a[Math.floor(Math.random()*a.length)],v=t[Math.random()<.75?_:Math.floor(Math.random()*t.length)];i.style.cssText=`
        left: ${s}vw;
        top: ${c}vh;
        width: ${o}px;
        height: ${o}px;
        color: ${v};
        --star-opacity: ${l};
        --star-drift-duration: ${u}s;
        --star-drift-x: ${d}px;
        --star-drift-y: ${f}px;
        --star-drift-delay: -${p}s;
        --star-twinkle-duration: ${m}s;
        --star-twinkle-delay: -${h}s;
        --star-glow: ${g}px;
      `,r.appendChild(i)}})}