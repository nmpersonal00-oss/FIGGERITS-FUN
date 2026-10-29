(()=>{
'use strict';
const DATA=window.SUNLIT_DATA;
const ORIGINAL_LEVELS=DATA.chapters.reduce((n,c)=>n+c.lines.length,0);
const BASE_PER_CHAPTER=DATA.chapters[0].lines.length;
const EXTRA_PER_CHAPTER=window.SUNLIT_EXPANSION?.[0]?.length||0;
const perChapter=BASE_PER_CHAPTER+EXTRA_PER_CHAPTER;
const TOTAL=ORIGINAL_LEVELS+DATA.chapters.length*EXTRA_PER_CHAPTER;
if(TOTAL!==2400||!window.SUNLIT_EXPANSION.every(g=>g.length===EXTRA_PER_CHAPTER))throw Error('Puzzle collection incomplete');
// Original 2,400 puzzle identifiers and number-based clue-generation logic are retained.
const chapterOf=n=>n<ORIGINAL_LEVELS?Math.floor(n/BASE_PER_CHAPTER):Math.floor((n-ORIGINAL_LEVELS)/EXTRA_PER_CHAPTER);
const chapterLevelOf=n=>n<ORIGINAL_LEVELS?n%BASE_PER_CHAPTER+1:(n-ORIGINAL_LEVELS)%EXTRA_PER_CHAPTER+BASE_PER_CHAPTER+1;
const globalLevel=(c,local)=>local<BASE_PER_CHAPTER?c*BASE_PER_CHAPTER+local:ORIGINAL_LEVELS+c*EXTRA_PER_CHAPTER+local-BASE_PER_CHAPTER;
const KEY='sunlit-secrets-progress-v1';
const defaultState=()=>({version:1,level:0,completed:{},guesses:{},hints:{},sound:true,motion:true,tutorialSeen:false});
function load(){try{let data=JSON.parse(localStorage.getItem(KEY));if(data?.version===1)return {...defaultState(),...data}}catch(_){}return defaultState()}
let save=load();
const root=document.getElementById('app');
const allPhrases=[...DATA.chapters.flatMap(c=>c.lines),...window.SUNLIT_EXPANSION.flat()];
const plain=x=>String(x).toUpperCase().replace(/[^A-Z]/g,'');
const letters=x=>[...new Set(plain(x))];
const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gameCache=new Map();
function randFn(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function levelData(n){
 if(gameCache.has(n))return gameCache.get(n);
 const phrase=allPhrases[n].toUpperCase();const c=chapterOf(n);const rng=randFn((n+13)*198391);
 const uncovered=new Set(letters(phrase));const used=new Set();const clues=[];
 const target=10 + (n%4===3 ? 2 : 1);
 for(let j=0;j<target || (uncovered.size && j<15);j++){
  let candidate=null, high=-Infinity;
  for(const entry of DATA.clues){
   const [word]=entry;if(used.has(word))continue;
   const unique=letters(word);const coverage=unique.filter(k=>uncovered.has(k)).length;
   const thematic=(c===0&&/(DAWN|BREEZE|RAIN|GARDEN|MEADOW|FLOWER|NEST|PETAL|SUN)/.test(word)) ||(c===1&&/(FRUIT|PEACH|HONEY|ORANGE|LEMON|BASKET|BERRY|APPLE)/.test(word))||(c===2&&/(OCEAN|WAVE|SAIL|SEA|SHORE|SAND|BOAT|TIDE)/.test(word))||(c===3&&/(DREAM|CLOUD|STAR|SKY|PURPLE|TWILIGHT|MOON)/.test(word))||(c===4&&/(TREE|FOREST|LEAF|COTTAGE|FERN|FOX|MAPLE)/.test(word))||(c===5&&/(NIGHT|MOON|STAR|GLOW|FIREFLY|DREAM)/.test(word));
   const sameWord=new RegExp('\\b'+word+'\\b','i').test(phrase);
   let score=coverage*11 + (thematic?5:0) + (word.length>=4&&word.length<=9?2:0) + rng()*5 - (sameWord?6:0);
   if(j>=9)score+=(rng()*10); // more variety near the end
   if(score>high){high=score;candidate=entry;}
  }
  if(!candidate)break;
  used.add(candidate[0]);clues.push(candidate);
  letters(candidate[0]).forEach(k=>uncovered.delete(k));
 }
 // Deterministically mix clue order so the first clue is not always the coverage-maximizer.
 for(let i=clues.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[clues[i],clues[j]]=[clues[j],clues[i]];}
 const order=letters(phrase);for(const item of clues){for(const ch of letters(item[0])){if(!order.includes(ch))order.push(ch);}}
 const lookup={};order.forEach((ch,i)=>lookup[ch]=i+1);
 const seeds={};const howMany=n<8?2:n<24?2:1;
 const seedChoices=letters(phrase).filter(ch=>ch!=='A'&&ch!=='E'&&ch!=='T');
 if(seedChoices.length<howMany)seedChoices.push(...letters(phrase));
 for(let i=seedChoices.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[seedChoices[i],seedChoices[j]]=[seedChoices[j],seedChoices[i]];}for(const ch of seedChoices.slice(0,howMany))seeds[lookup[ch]]=ch;
 const puzzle={phrase,chapter:c,clues:clues.map(([word,clue])=>({word,clue})),lookup,truth:Object.fromEntries(order.map((ch,i)=>[i+1,ch])),seeds,phraseNums:letters(phrase).map(ch=>lookup[ch]),chapterLevel:chapterLevelOf(n),order};
 gameCache.set(n,puzzle);return puzzle;
}

const icons={home:'<path d="m3 10 9-7 9 7v11H3zM9 21v-8h6v8"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 1 1 5 2c-1.2 1-2 1.6-2 3M12 18h.01"/>',gear:'<path d="M10 2h4l.6 2.4 2 1.1 2.5-.8 2 3.4-1.8 1.7v2.4l1.8 1.7-2 3.4-2.5-.8-2 1.1L14 20h-4l-.6-2.4-2-1.1-2.5.8-2-3.4 1.8-1.7V9.8L2.9 8.1l2-3.4 2.5.8 2-1.1L10 2z"/><circle cx="12" cy="11" r="3"/>',hint:'<path d="M9 18h6m-5 3h4M8 15a7 7 0 1 1 8 0c-1.5 1-1 2-1 3H9c0-1-.5-2-1-3z"/>',erase:'<path d="M9 14 4 9l5-5M4 9h11a6 6 0 0 1 0 12h-4"/>',check:'<path d="m4 12 5 5L20 6"/>',backspace:'<path d="M9 4H22v16H9L2 12zM12 9l7 6m0-6-7 6"/>'};
const ico=k=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[k]}</svg>`;
let view='home',modal='',selected=null,selectedRow=0,wrong=new Set(),toastTimer=0,winPending=false,completedAnimation=false,audioCtx=null;
// The next puzzle is inaccessible until every preceding puzzle has been completed.
function firstUnbeaten(){for(let i=0;i<TOTAL;i++)if(!save.completed[i])return i;return TOTAL-1;}
function unlocked(n){return n>=0&&n<TOTAL&&n<=firstUnbeaten();}
save.level=unlocked(Number(save.level))?Number(save.level):firstUnbeaten();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save))}catch(_){}}
function mapFor(n=save.level){return {...levelData(n).seeds,...(save.guesses[n]||{})};}
function sound(f=0){if(!save.sound)return;try{audioCtx ||=new (window.AudioContext||window.webkitAudioContext)();const now=audioCtx.currentTime;[420+f,620+f].forEach((freq,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,now+i*.10);g.gain.exponentialRampToValueAtTime(.03,now+i*.10+.02);g.gain.exponentialRampToValueAtTime(.0001,now+i*.10+.17);o.connect(g);g.connect(audioCtx.destination);o.start(now+i*.10);o.stop(now+i*.10+.18)})}catch(_){}}
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
function topbar(ingame){return `<div class="mock-status" aria-hidden="true"><span class="status-time">9:06</span><span class="status-side"><svg viewBox="0 0 20 16"><path d="M0 12h3v4H0zm5-4h3v8H5zm5-4h3v12h-3zm5-4h3v16h-3z"/></svg><svg viewBox="0 0 24 18"><path d="M1 6q11-11 22 0l-3 3Q12 2 4 9zm6 5q5-5 10 0l-5 6z"/></svg><span class="battery-plate">31</span></span></div><header class="top-controls"><div>${ingame?`<button class="round-btn" aria-label="Home" data-action="home">${ico('home')}</button>`:''}</div><div class="right"><button class="round-btn" aria-label="How to play" data-action="how">${ico('help')}</button><button class="round-btn" aria-label="Settings" data-action="settings">${ico('gear')}</button></div></header>`}
function renderHome(){root.innerHTML=`<section class="screen home ${save.motion?'':'motion-off'}" aria-label="Sunlit Secrets home screen">${topbar(false)}<button class="play-btn" data-action="play" aria-label="Play level ${firstUnbeaten()+1} of ${TOTAL}"></button></section>`;}
function phraseHTML(p){let count=plain(p.phrase).length;
 return `<section class="phrase-area ${count>65?'very-dense':count>45?'dense':''}" aria-label="Hidden saying"><div class="phrase-words">${p.phrase.split(/\s+/).map(word=>`<span class="phrase-word">${[...word].map(ch=>/[A-Z]/.test(ch)?`<button class="phrase-cell letterbox" data-number="${p.lookup[ch]}" data-action="select" aria-label="Hidden saying letter ${p.lookup[ch]}"></button>`:`<span class="phrase-punctuation">${safe(ch)}</span>`).join('')}</span>`).join('')}</div></section>`;}
function clueHTML(p){return p.clues.map((entry,i)=>`<div class="clue-card" data-clue-row="${i}"><div class="clue-title">${String(i+1).padStart(2,'0')}. &nbsp;${safe(entry.clue)}</div><div class="clue-tiles">${[...entry.word].map((ch,j)=>`<button class="clue-tile letterbox" data-action="select" data-number="${p.lookup[ch]}" data-row="${i}" data-pos="${j}" aria-label="Clue ${i+1}, letter ${j+1}, number ${p.lookup[ch]}"><span class="known"></span><span class="num big">${p.lookup[ch]}</span></button>`).join('')}</div></div>`).join('')}
function renderGame(){const p=levelData(save.level),map=mapFor(),solved=Object.entries(p.truth).filter(([n,ch])=>map[n]===ch).length,unq=Object.keys(p.truth).length;
 root.innerHTML=`<section class="screen game ${save.motion?'':'motion-off'}" aria-label="Word puzzle level ${save.level+1}">${topbar(true)}
 <section class="puzzle-head"><h1>The hidden thought</h1><div class="flourish">❀</div><div class="level-subtitle"><span>Decode this saying</span><span class="level-label" aria-label="Level ${save.level+1}"><small>${solved}/${unq} letters</small></span></div></section>
 ${phraseHTML(p)}
 <section class="garden"><div class="garden-heading"><h2>Clue garden</h2><span class="instructions">Tap a box, then type a letter</span></div><div class="clue-scroll" id="clue-scroll">${clueHTML(p)}</div></section>
 <nav class="actions" aria-label="Puzzle tools"><button class="action-btn" data-action="hint">${ico('hint')} Free hint <span class="flower">✿</span></button><button class="action-btn" data-action="erase">${ico('erase')} Erase</button><button class="action-btn" data-action="check">${ico('check')} Check work <span class="flower">✿</span></button></nav>
 <section class="keyboard" role="group" aria-label="Letter keyboard">${['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map((row,i)=>`<div class="keyboard-row">${i===2?`<button class="key utility" aria-label="Previous empty box" data-action="previous">↰</button>`:''}${[...row].map(ch=>`<button class="key" data-action="letter" data-letter="${ch}" aria-label="Letter ${ch}">${ch}</button>`).join('')}${i===2?`<button class="key utility" data-action="erase" aria-label="Backspace">${ico('backspace')}</button>`:''}</div>`).join('')}</section>
 </section>`;
 if(!selected || !(selected in p.truth))chooseFirst();else paintBoard();
}
function chooseFirst(){const p=levelData(save.level),m=mapFor();let num=null;
 for(const clue of p.clues){for(const ch of clue.word){let n=p.lookup[ch];if(m[n]!==p.truth[n]){num=n;break;}}if(num)break;}
 selected=num||Number(Object.keys(p.truth)[0]);selectedRow=0;paintBoard();}
function paintBoard(){if(view!=='game')return;const p=levelData(save.level),map=mapFor();
 root.querySelectorAll('.letterbox').forEach(el=>{const n=Number(el.dataset.number),guess=map[n]||'',isClue=el.classList.contains('clue-tile');
 el.classList.toggle('is-selected',selected===n);el.classList.toggle('filled',!!guess);el.classList.toggle('is-wrong',wrong.has(n));el.classList.toggle('seed-tile',!!p.seeds[n]);el.classList.toggle('hint-tile',!!save.guesses[save.level]?.[n]&&save.guesses[save.level]?.[n]===p.truth[n]);
 if(isClue){el.querySelector('.known').textContent=guess;el.querySelector('.num').textContent=n;el.querySelector('.num').classList.toggle('big',!guess)}else el.textContent=guess;
 });
 const solved=Object.entries(p.truth).filter(([n,ch])=>map[n]===ch).length;const progress=root.querySelector('.level-label small');if(progress)progress.textContent=`${solved}/${Object.keys(p.truth).length} letters`;
}
function selectNumber(n,row){const p=levelData(save.level);if(!p.truth[n])return;selected=n;if(Number.isInteger(row))selectedRow=row;paintBoard();}
function nextNumber(direction=1){const p=levelData(save.level),m=mapFor(),row=p.clues[selectedRow],nums=row?[...row.word].map(ch=>p.lookup[ch]):Object.keys(p.truth).map(Number);
 let at=nums.indexOf(selected);for(let k=1;k<=nums.length;k++){const n=nums[(at+direction*k+nums.length*4)%nums.length];if(!p.seeds[n]&&!m[n]){selected=n;paintBoard();return;}}
 for(const clue of p.clues){for(const ch of clue.word){let n=p.lookup[ch];if(!p.seeds[n]&&!m[n]){selected=n;paintBoard();return;}}}
}
function play(){save.level=firstUnbeaten();persist();view='game';modal='';selected=null;wrong.clear();render();}
function openLevel(n){if(!unlocked(n)){toast('Finish the current level before moving ahead.');return false;}save.level=n;persist();view='game';modal='';selected=null;wrong.clear();render();return true;}
function enterLetter(letter){if(view!=='game'||modal||!/^[A-Z]$/.test(letter))return;
 const p=levelData(save.level),map=mapFor();if(!selected || p.seeds[selected]){nextNumber();if(p.seeds[selected])return;}
 const collision=Object.keys(map).find(n=>Number(n)!==selected && map[n]===letter);if(collision){toast(`${letter} is already assigned to number ${collision}.`);return;}
 (save.guesses[save.level] ||= {})[selected]=letter;wrong.delete(selected);persist();sound();paintBoard();if(checkVictory())return;nextNumber();}
function erase(){if(view!=='game'||modal)return;const p=levelData(save.level);if(!selected||p.seeds[selected]){toast('Choose an editable letter box.');return;}
 if(save.guesses[save.level])delete save.guesses[save.level][selected];wrong.delete(selected);persist();paintBoard();}
function hint(){if(view!=='game'||modal)return;const p=levelData(save.level),map=mapFor();let n=selected;
 if(!n||map[n]===p.truth[n])n=Object.keys(p.truth).map(Number).find(k=>map[k]!==p.truth[k]);if(!n){checkVictory();return;}
 const letter=p.truth[n],guesses=(save.guesses[save.level] ||= {});
 for(const key of Object.keys(guesses))if(Number(key)!==n&&guesses[key]===letter)delete guesses[key];
 guesses[n]=letter;save.hints[save.level]=(save.hints[save.level]||0)+1;selected=n;wrong.clear();persist();sound(80);paintBoard();toast(`A little sunshine: ${n} = ${letter}`);checkVictory();}
function checkWork(){if(view!=='game'||modal)return;const p=levelData(save.level),map=mapFor();wrong=new Set(Object.keys(map).filter(n=>map[n]!==p.truth[n]).map(Number));paintBoard();if(wrong.size)toast(`${wrong.size} letter ${wrong.size===1?'needs':'need'} another look.`);else if(!checkVictory())toast('Everything so far looks good!');}
function checkVictory(){const p=levelData(save.level),map=mapFor();if(!p.phraseNums.every(n=>map[n]===p.truth[n]))return false;
 const firstTime=!save.completed[save.level];save.completed[save.level]=true;persist();if(!winPending&&modal!=='win'){winPending=true;sound(200);setTimeout(()=>{winPending=false;if(view==='game'){modal='win';renderModal();celebrate();}},380)}return true;}
function renderModal(){const existing=root.querySelector('.sheet-overlay');if(existing)existing.remove();if(!modal)return;
 let html='';const solved=Object.keys(save.completed).filter(k=>save.completed[k]).length;
 if(modal==='win')html=`<div class="petals">✿ ❀ ✿</div><h2>Beautifully done!</h2><p>You uncovered the hidden thought.</p><div class="quote">“${safe(allPhrases[save.level])}”</div><p class="muted">${solved} of ${TOTAL} levels completed</p><button class="sheet-btn" data-action="win-next" ${save.level===TOTAL-1?'disabled':''}>${save.level===TOTAL-1?'Garden complete!':'Next level →'}</button><button class="sheet-btn outline" data-action="home">Home</button>`;
 if(modal==='how')html=`<div class="petals">✿</div><h2>How to play</h2><div class="how-list"><p><b>1.</b> Read a clue and solve its word.</p><p><b>2.</b> Tap a numbered box and type a letter. Every matching number fills automatically.</p><p><b>3.</b> Decode the hidden saying to complete the level. Free hints are always available.</p><p><b>4.</b> Finish each level to unlock the next. There are no ads and no timers.</p></div><button class="sheet-btn" data-action="close">Let's play ❀</button>`;
 if(modal==='settings')html=`<div class="petals">✿</div><h2>Settings</h2><div class="setting-row"><span>Gentle sounds</span><button class="toggle" data-action="sound">${save.sound?'On':'Off'}</button></div><div class="setting-row"><span>Soft animations</span><button class="toggle" data-action="motion">${save.motion?'On':'Off'}</button></div><p class="muted" style="margin-top:16px">Progress saves on this device. Back up your garden before clearing browser data.</p><div class="settings-actions"><button class="sheet-btn outline" data-action="export">Save backup</button><button class="sheet-btn outline" data-action="import">Load backup</button></div><div class="settings-actions"><button class="sheet-btn outline" data-action="levels">My levels</button><button class="sheet-btn outline" data-action="reset">Start over</button></div><input type="file" id="backup-file" hidden accept="application/json,.json">`;
 if(modal==='levels'){const frontier=firstUnbeaten();let begin=Math.max(0,Math.floor(frontier/30)*30);html=`<div class="petals">❀</div><h2>Your levels</h2><p class="level-legend">Complete each level to open the next. Levels ahead stay locked.</p><div class="level-list">${Array.from({length:Math.min(30,TOTAL-begin)},(_,k)=>{let n=begin+k,done=save.completed[n];return `<button class="level-choice ${save.level===n?'current':''}" ${unlocked(n)?'':'disabled'} data-action="go-level" data-level="${n}">${done?'✓ ':''}${n+1}${unlocked(n)?'':' 🔒'}</button>`}).join('')}</div><div class="settings-actions"><button class="sheet-btn outline" data-action="levels-prev" ${begin===0?'disabled':''}>← Earlier</button><button class="sheet-btn outline" data-action="levels-next" ${begin+30>TOTAL-1?'disabled':''}>Later →</button></div>`;}
 root.insertAdjacentHTML('beforeend',`<div class="sheet-overlay" role="presentation"><section class="sheet" role="dialog" aria-modal="true" aria-label="${safe(modal)}"><button class="sheet-close" data-action="close" aria-label="Close dialog">×</button>${html}</section></div>`);}
let levelMenuPage=null;
function modalLevels(){modal='levels';levelMenuPage=Math.floor(firstUnbeaten()/30);renderLevels();}
function renderLevels(){if(modal!=='levels')return;const frontier=firstUnbeaten(),begin=Math.min(Math.max(0,levelMenuPage),Math.ceil(TOTAL/30)-1)*30;root.querySelector('.sheet-overlay')?.remove();
 const html=`<div class="petals">❀</div><h2>Your levels</h2><p class="level-legend">Solve a level to unlock the next. ${Object.keys(save.completed).filter(k=>save.completed[k]).length} complete.</p><div class="level-list">${Array.from({length:Math.min(30,TOTAL-begin)},(_,k)=>{let n=begin+k,done=save.completed[n];return `<button class="level-choice ${save.level===n?'current':''}" ${unlocked(n)?'':'disabled'} data-action="go-level" data-level="${n}">${done?'✓ ':''}${n+1}${unlocked(n)?'':' 🔒'}</button>`}).join('')}</div><div class="settings-actions"><button class="sheet-btn outline" data-action="levels-prev" ${begin===0?'disabled':''}>← Earlier</button><button class="sheet-btn outline" data-action="levels-next" ${begin+30>=TOTAL?'disabled':''}>Later →</button></div>`;
 root.insertAdjacentHTML('beforeend',`<div class="sheet-overlay"><section class="sheet" role="dialog" aria-modal="true" aria-label="Your levels"><button class="sheet-close" data-action="close" aria-label="Close">×</button>${html}</section></div>`);}
function render(){if(view==='home')renderHome();else renderGame();if(modal)renderModal();updateClock();}
function updateClock(){const t=root.querySelector('.status-time');if(t)t.textContent=new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});}
function confettiPart(ctx,pts,frame){ctx.clearRect(0,0,innerWidth,innerHeight);for(let p of pts){p.y+=p.v;p.x+=Math.sin(frame/15+p.s)*.6;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.s+frame*.02);ctx.fillStyle=p.color;ctx.fillRect(-3,-2,7,5);ctx.restore();}}
function celebrate(){if(!save.motion)return;const canvas=document.getElementById('confetti'),ctx=canvas.getContext('2d');canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.display='block';ctx.scale(devicePixelRatio,devicePixelRatio);const colors=['#ffdfb3','#ffbbc8','#ffd4dc','#fb9fa1','#fcf1d0'];const pts=Array.from({length:80},()=>({x:Math.random()*innerWidth,y:-Math.random()*innerHeight,v:1+Math.random()*3,s:Math.random()*6,color:colors[Math.floor(Math.random()*colors.length)]}));let frame=0;const animate=()=>{confettiPart(ctx,pts,frame++);if(frame<175)requestAnimationFrame(animate);else canvas.style.display='none'};animate();}
function exportSave(){const file=new Blob([JSON.stringify({app:'Sunlit Secrets',savedAt:new Date().toISOString(),save},null,2)],{type:'application/json'}),href=URL.createObjectURL(file),a=document.createElement('a');a.href=href;a.download='sunlit-secrets-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);toast('Progress backup downloaded.');}
root.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn||btn.disabled)return;const action=btn.dataset.action;
 if(action==='play'){play();return}if(action==='home'){modal='';view='home';render();return}if(action==='how'||action==='settings'){modal=action;renderModal();return}if(action==='close'){modal='';renderModal();return}
 if(action==='select'){selectNumber(Number(btn.dataset.number),btn.dataset.row!==undefined?Number(btn.dataset.row):undefined);return}
 if(action==='letter'){enterLetter(btn.dataset.letter);return}if(action==='erase'){erase();return}if(action==='hint'){hint();return}if(action==='check'){checkWork();return}if(action==='previous'){nextNumber(-1);return}
 if(action==='win-next'){if(save.level<TOTAL-1&&save.completed[save.level])openLevel(save.level+1);else toast('Complete this level first.');return}
 if(action==='sound'){save.sound=!save.sound;persist();renderModal();if(save.sound)sound();return}if(action==='motion'){save.motion=!save.motion;persist();render();return}
 if(action==='levels'){modalLevels();return}if(action==='levels-next'||action==='levels-prev'){levelMenuPage+=(action==='levels-next'?1:-1);renderLevels();return}
 if(action==='go-level'){openLevel(Number(btn.dataset.level));return}if(action==='export'){exportSave();return}if(action==='import'){root.querySelector('#backup-file')?.click();return}
 if(action==='reset'){if(confirm('Erase all saved Sunlit Secrets progress on this device? Export a backup first if you want to keep it.')){save=defaultState();persist();modal='';view='home';render();toast('Your fresh start is ready.');}return}
});
root.addEventListener('change',async e=>{if(e.target?.id!=='backup-file')return;try{const file=e.target.files?.[0];if(!file)return;const obj=JSON.parse(await file.text());if(obj.app!=='Sunlit Secrets'||obj.save?.version!==1||typeof obj.save.completed!=='object'||typeof obj.save.guesses!=='object')throw Error('Invalid file');save={...defaultState(),...obj.save};save.level=unlocked(Number(save.level))?Number(save.level):firstUnbeaten();persist();modal='';view='home';render();toast('Your garden has been restored.');}catch(_){toast('This file is not a valid Sunlit Secrets backup.');}});
document.addEventListener('keydown',e=>{if(modal){if(e.key==='Escape'){modal='';renderModal();}return;}if(view!=='game'||e.ctrlKey||e.altKey||e.metaKey)return;if(/^[A-Z]$/i.test(e.key)){e.preventDefault();enterLetter(e.key.toUpperCase());}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();erase();}else if(e.key==='ArrowRight'){e.preventDefault();nextNumber();}else if(e.key==='ArrowLeft'){e.preventDefault();nextNumber(-1);}else if(e.key==='Escape'){view='home';render();}});
render();
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
