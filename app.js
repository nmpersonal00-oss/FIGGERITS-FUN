(() => {
'use strict';
const DATA = window.SUNLIT_DATA;
const ORIGINAL_LEVELS=DATA.chapters.reduce((n,c)=>n+c.lines.length,0);
const BASE_PER_CHAPTER=DATA.chapters[0].lines.length;
const EXTRA_PER_CHAPTER=window.SUNLIT_EXPANSION?.[0]?.length||0;
const perChapter=BASE_PER_CHAPTER+EXTRA_PER_CHAPTER;
const TOTAL=DATA.chapters.length*perChapter;
if(EXTRA_PER_CHAPTER===0||!window.SUNLIT_EXPANSION.every(g=>g.length===EXTRA_PER_CHAPTER))throw Error('Expansion puzzle data unavailable');
const PAGE_SIZE=40;
// The original 48 indices keep their original puzzle IDs and save data.
const chapterOf=n=>n<ORIGINAL_LEVELS?Math.floor(n/BASE_PER_CHAPTER):Math.floor((n-ORIGINAL_LEVELS)/EXTRA_PER_CHAPTER);
const chapterLevelOf=n=>n<ORIGINAL_LEVELS?n%BASE_PER_CHAPTER+1:(n-ORIGINAL_LEVELS)%EXTRA_PER_CHAPTER+BASE_PER_CHAPTER+1;
const globalLevel=(c,local)=>local<BASE_PER_CHAPTER?c*BASE_PER_CHAPTER+local:ORIGINAL_LEVELS+c*EXTRA_PER_CHAPTER+local-BASE_PER_CHAPTER;

const KEY = 'sunlit-secrets-progress-v1';
const defaultState = () => ({version:1, level:0, completed:{}, guesses:{}, hints:{}, sound:true, motion:true, tutorialSeen:false});
function load(){try{const obj=JSON.parse(localStorage.getItem(KEY));return obj && obj.version===1 ? {...defaultState(),...obj}:defaultState();}catch(_){return defaultState();}}
let save=load();
save.level=Math.min(Math.max(Number(save.level)||0,0),TOTAL-1);
let view='home', detailChapter=0, detailPage=0, selected=null, modal=null, wrong=new Set(), toastTimer=null, audioContext=null, gameCache=new Map();
let delayedCompletion=false;
const root=document.getElementById('app');
const allPhrases=[...DATA.chapters.flatMap(c=>c.lines),...window.SUNLIT_EXPANSION.flat()];
const artSrc=key=>window.SUNLIT_ASSETS?.[key]||'assets/'+key+'.svg';
const plain=x=>String(x).toUpperCase().replace(/[^A-Z]/g,'');
const letters=x=>[...new Set(plain(x))];
const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
const countCompleted=()=>Object.values(save.completed).filter(Boolean).length;
const chapterCompleted=c=>Array.from({length:perChapter},(_,i)=>Boolean(save.completed[globalLevel(c,i)])).filter(Boolean).length;
const pct=(val,total)=>Math.round(100*val/total);
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch(_){}}
function mappings(n=save.level){return {...levelData(n).seeds,...(save.guesses[n]||{})};}
function textGuess(number){return mappings()[number]||'';}
function currentArt(){const c=view==='detail'?detailChapter:chapterOf(save.level);return DATA.chapters[c];}
function sparkleHTML(){return Array.from({length:13},(_,i)=>`<i class="firefly" style="--x:${(i*79+13)%91+5}%;--y:${(i*131+17)%72+10}%;--dur:${5+i%7}s;animation-delay:-${i*.8}s"></i>`).join('');}
const icons={
 back:'<path d="M15 18l-6-6 6-6M9 12h12"/>',
 home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.4-2-3.4-2.3 1A7 7 0 0 0 15 6l-.4-2h-4.1l-.4 2a7 7 0 0 0-1.6 1.2l-2.2-1-2 3.4 1.9 1.4a7 7 0 0 0 0 2L4.3 14l2 3.4 2.2-1a7 7 0 0 0 1.6 1.2l.4 2.4h4.1l.4-2.4a7 7 0 0 0 1.6-1.2l2.3 1 2-3.4-2-1.4a7 7 0 0 0 .1-1Z"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 1 1 4.4 1.7c-.8.7-2 1.1-2 2.8M12 17h.01"/>',
 light:'<path d="M9 18h6m-5 3h4m-6.5-7a7 7 0 1 1 9 0c-.9.8-1.5 1.7-1.5 3H9c0-1.3-.6-2.2-1.5-3Z"/>',
 check:'<path d="m5 12 5 5L20 7"/>',
 undo:'<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 sound:'<path d="M4 9v6h4l5 4V5L8 9H4Zm12 0q3 3 0 6"/>',
 book:'<path d="M3 5a3 3 0 0 1 3-3h15v17H6a3 3 0 0 0-3 3V5Zm3 14a3 3 0 0 0 0 3h15"/>'
};
function ico(s){return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[s]}</svg>`;}
function sceneHTML(){
 const c=currentArt();const title=view==='game'?c.name:view==='home'?'A little joy,\none word at a time.':view==='detail'?c.name:view==='chapters'?'Find your\nhappy place.':'A garden\njust for you.';
 const desc=view==='game'?c.description:view==='home'?'Unravel lovely little mysteries, and let each answer bring something beautiful to life.':view==='detail'?c.description:'Follow the sunshine, wherever it leads.';
 return `<section class="scene" aria-label="${safe(c.name)} illustration"><img class="scene-image" src="${artSrc(c.art)}" alt="Hand-illustrated ${safe(c.name)} landscape"/>${save.motion?sparkleHTML():''}<div class="scene-content"><div class="brand"><div class="brand-icon">✿</div><span>Sunlit Secrets</span></div><div class="scene-bottom"><div class="scene-kicker">✧ &nbsp; A WORD PUZZLE GARDEN</div><h2>${safe(title).replaceAll('\n','<br>')}</h2><p>${safe(desc)}</p><div class="scene-dots">${DATA.chapters.map((_,i)=>`<i class="${i===(view==='detail'?detailChapter:chapterOf(save.level))?'active':''}"></i>`).join('')}</div></div></div></section>`;
}
function navHeader(label,showBack=false){return `<div class="topbar"><span class="eyebrow">${safe(label)}</span><div class="top-actions">${showBack?`<button class="icon-btn" data-act="back" aria-label="Go back">${ico('back')}</button>`:''}<button class="icon-btn" data-act="how" aria-label="How to play">${ico('help')}</button><button class="icon-btn" data-act="settings" aria-label="Settings">${ico('settings')}</button></div></div>`;}
function homeHTML(){
 const done=countCompleted(), c=DATA.chapters[chapterOf(save.level)];
 return `<div class="content-scroll"><div class="main-pad">${navHeader('YOUR LITTLE ESCAPE')}<div class="home-intro"><div class="overline">✦ UNPLUG. UNWIND. UNRAVEL.</div><h1>Words to warm<br>your <em>heart.</em></h1><p>A dreamy, ad-free escape full of curious clues, hidden sayings, and little moments of wonder. Your garden is waiting.</p><div class="btn-row"><button class="primary" data-act="play">${done?'Continue exploring':'Begin your journey'} ${ico('arrow')}</button><button class="secondary" data-act="chapters">Explore chapters</button></div></div><div class="progress-tile"><div><strong>${done}<span style="font-size:17px;color:#ae9090"> / ${TOTAL}</span></strong><small>beautiful little puzzles completed</small></div><div class="progress-meter"><div style="width:${pct(done,TOTAL)}%"></div></div></div><div class="section-heading"><h3>Your destinations</h3><button class="text-link" data-act="chapters">View all chapters →</button></div><div class="chapter-grid">${DATA.chapters.map((c,i)=>`<button class="chapter-card" data-act="detail" data-chapter="${i}"><img src="${artSrc(c.art)}" alt="" loading="lazy"><span class="chapter-count">${chapterCompleted(i)}/${perChapter}</span><span class="chapter-card-text"><strong>${safe(c.name)}</strong><small>${safe(c.short)}</small></span></button>`).join('')}</div><p class="footer-note">Made for slow mornings & cozy evenings · Always ad-free · Play offline</p></div></div>`;
}
function chaptersHTML(){return `<div class="content-scroll"><div class="main-pad">${navHeader('EXPLORE YOUR GARDEN',true)}<h1 class="page-title">Choose a little adventure.</h1><p class="page-intro">Six places to wander. Two thousand four hundred hidden thoughts to discover. Explore in any order — every path is open.</p>${DATA.chapters.map((c,i)=>`<button class="big-chapter" data-act="detail" data-chapter="${i}"><img src="${artSrc(c.art)}" alt=""><span style="flex:1"><strong>${safe(c.name)}</strong><small>${safe(c.description)}</small><small>${chapterCompleted(i)} / ${perChapter} puzzles solved</small><span class="mini-meter"><span style="width:${pct(chapterCompleted(i),perChapter)}%"></span></span></span></button>`).join('')}</div></div>`;}
function detailHTML(){
 const c=DATA.chapters[detailChapter],totalPages=Math.ceil(perChapter/PAGE_SIZE);
 const page=Math.max(0,Math.min(totalPages-1,detailPage)),start=page*PAGE_SIZE,end=Math.min(perChapter,start+PAGE_SIZE);
 return `<div class="content-scroll"><div class="main-pad">${navHeader('THE CHAPTERS',true)}<h1 class="page-title">${safe(c.name)}</h1><p class="page-intro">${safe(c.description)}<br>Choose any puzzle — no locks, no rush.</p><div class="chapter-detail-top"><img src="${artSrc(c.art)}" alt=""><div><div class="eyebrow">${safe(c.short)}</div><p style="font-size:14px;color:#836a73;line-height:1.6;margin-top:8px">${chapterCompleted(detailChapter)} of ${perChapter} moments collected</p></div></div><div class="section-heading"><h3>Little mysteries</h3><span class="tiny">${perChapter} puzzles</span></div><div class="page-controls"><button class="secondary" data-act="prev-page" ${page===0?'disabled':''} aria-label="Previous puzzles">← Previous</button><span>Levels ${start+1}–${end}<br><small>Page ${page+1} of ${totalPages}</small></span><button class="secondary" data-act="next-page" ${page===totalPages-1?'disabled':''} aria-label="Next puzzles">Next →</button></div><div class="level-grid">${Array.from({length:end-start},(_,i)=>{const local=start+i,n=globalLevel(detailChapter,local);return `<button class="level-tile ${save.completed[n]?'done':save.level===n?'current':''}" data-act="open-level" data-level="${n}">${save.completed[n]?'✓':String(local+1).padStart(2,'0')}<small>${save.completed[n]?'Completed':save.level===n?'In progress':'Play puzzle'}</small></button>`;}).join('')}</div><div class="page-controls bottom"><button class="secondary" data-act="prev-page" ${page===0?'disabled':''}>← Previous</button><button class="secondary" data-act="next-page" ${page===totalPages-1?'disabled':''}>Next →</button></div><p class="footer-note">Choose any level, including one you've already solved.</p></div></div>`;
}
function settingsHTML(){return `<div class="content-scroll"><div class="main-pad">${navHeader('MAKE IT YOURS',true)}<h1 class="page-title">Your cozy corner.</h1><p class="page-intro">Settle in your own way. Everything stays right here on this device, unless you export it yourself.</p><div class="setting-card"><div class="setting-row"><div><strong>Gentle sound effects</strong><small>Soft little notes for letters and discoveries.</small></div><button class="toggle ${save.sound?'on':''}" data-act="toggle-sound" role="switch" aria-checked="${save.sound}" aria-label="Toggle sound effects"></button></div></div><div class="setting-card"><div class="setting-row"><div><strong>Living scenery</strong><small>Floating fireflies, a slow-moving landscape, and subtle sparkle.</small></div><button class="toggle ${save.motion?'on':''}" data-act="toggle-motion" role="switch" aria-checked="${save.motion}" aria-label="Toggle animations"></button></div></div><div class="setting-card"><strong style="font-size:14px">Your progress</strong><p class="tiny" style="line-height:1.7;margin-top:7px">${countCompleted()} / ${TOTAL} puzzles complete. Progress is saved automatically in this browser.</p><div class="setting-actions"><button class="secondary" data-act="export">Export backup</button><button class="secondary" data-act="import">Import backup</button><button class="secondary" data-act="reset">Start fresh</button></div><input type="file" id="backup-file" accept="application/json,.json" style="display:none" aria-label="Import game backup"/></div><div class="setting-card"><strong style="font-size:14px">A little note about this game</strong><p class="tiny" style="line-height:1.75;margin-top:9px">Sunlit Secrets is an independent, original word-and-number puzzle game. No accounts, trackers, advertisements, payments, or internet connection are needed after the site is cached for offline use.</p></div><p class="footer-note">A little sunshine, all yours. ♡</p></div></div>`;}
function buildPhraseTokens(puzzle){
 return puzzle.phrase.split(/(\s+)/).filter(t=>t.length && !/^\s+$/.test(t)).map((word,wi)=>`<span class="cipher-word" aria-label="Hidden word ${wi+1}">${[...word].map((ch,pos)=>/[A-Z]/.test(ch)?slotHTML(puzzle.lookup[ch],{kind:'phrase',row:wi,pos},true):`<span class="punct">${safe(ch)}</span>`).join('')}</span>`).join('');
}
function slotHTML(n,where,quote=false){const map=mappings(),ch=map[n]||'',locked=Boolean(levelData(save.level).seeds[n]),isSel=selected && selected.kind===where.kind&&selected.row===where.row&&selected.pos===where.pos;
 const isWrong=wrong.has(Number(n));const title=ch?`Number ${n}, letter ${ch}`:`Number ${n}, empty`;
 return `<button type="button" data-act="select" data-kind="${where.kind}" data-row="${where.row}" data-pos="${where.pos}" data-num="${n}" title="${title}" aria-label="${title}" class="${quote?'cipher-slot':'answer-slot'} ${isSel?'active':''} ${locked?'locked':''} ${isWrong?'wrong':''}"><span class="letter">${ch||'&nbsp;'}</span><span class="number">${n}</span></button>`;
}
function clueHTML(puzzle){const map=mappings();return puzzle.clues.map((cl,i)=>{
 const chars=[...cl.word];const solved=chars.every(ch=>map[puzzle.lookup[ch]]===ch);
 return `<article class="clue-card ${solved?'is-solved':''}"><div class="clue-top"><span class="clue-index">${String(i+1).padStart(2,'0')}.</span><span class="clue-text">${safe(cl.clue)}</span></div><div class="clue-letters">${chars.map((ch,pos)=>slotHTML(puzzle.lookup[ch],{kind:'clue',row:i,pos})).join('')}</div></article>`;
 }).join('');}
function revealCount(){const p=levelData(save.level),guess=mappings();return p.phraseNums.filter(n=>Boolean(guess[n])).length;}
function gameHTML(){
 const p=levelData(save.level),c=DATA.chapters[p.chapter],count=revealCount();
 return `<div class="game-header"><div class="topbar"><button class="icon-btn" data-act="home" aria-label="Back to garden">${ico('home')}</button><div class="level-subtitle">✦ ${safe(c.name)} &nbsp;•&nbsp; Puzzle ${p.chapterLevel} of ${perChapter}</div><div class="top-actions"><button class="icon-btn" data-act="how" aria-label="How to play">${ico('help')}</button><button class="icon-btn" data-act="chapters" aria-label="Choose a puzzle">${ico('book')}</button></div></div><div class="game-title-row"><h1>The hidden thought</h1><span class="game-badge">${save.completed[save.level]?'✓ Completed':'✿ No time limit'}</span></div></div><section class="game-board" aria-label="Puzzle board"><div class="quote-panel"><div class="panel-eyebrow"><span>✧ DECODE THIS SAYING</span><span id="phraseCount">${count} / ${p.phraseNums.length} letters</span></div><div id="phraseSlots" class="quote-words">${buildPhraseTokens(p)}</div><div class="solve-progress"><div class="progress-meter"><div id="solveMeter" style="width:${pct(count,p.phraseNums.length)}%"></div></div><span id="solvePercent">${pct(count,p.phraseNums.length)}%</span></div></div><div class="clue-heading"><h3>Clue garden</h3><small>Tap a box, then type a letter</small></div><div id="cluesScroll" class="clues-scroll">${clueHTML(p)}</div><div class="board-bottom"><div class="toolrow"><button class="toolbtn accent" data-act="hint">${ico('light')} Free hint <span id="hintNumber">${Number(save.hints[save.level]||0)?`· ${save.hints[save.level]}`:''}</span></button><button class="toolbtn" data-act="erase">${ico('undo')} Erase</button><button class="toolbtn" data-act="check">${ico('check')} Check work</button></div></div></section><section class="keyboard" aria-label="On-screen keyboard"><div class="keyboard-hint">ONE LETTER UNLOCKS EVERY MATCHING NUMBER</div>${['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map((row,i)=>`<div class="keyrow">${i===2?'<button class="key special" data-act="erase" aria-label="Delete letter">⌫</button>':''}${[...row].map(ch=>`<button class="key" data-act="letter" data-letter="${ch}">${ch}</button>`).join('')}${i===2?'<button class="key special" data-act="next" aria-label="Next empty space">↪</button>':''}</div>`).join('')}</section>`;
}
function render(){const c=view==='game'?'game-content':'';
 root.innerHTML=`<main class="app ${save.motion?'':'reduce-motion'}"><div class="app-screen">${sceneHTML()}<div class="content ${c}">${view==='home'?homeHTML():view==='chapters'?chaptersHTML():view==='detail'?detailHTML():view==='settings'?settingsHTML():gameHTML()}</div></div></main>`;
 updateModal();if(view==='game'){if(!selected)chooseInitial();applySelection();}
}
function chooseInitial(){const p=levelData(save.level);const map=mappings();for(let i=0;i<p.clues.length;i++){const pos=[...p.clues[i].word].findIndex(ch=>!map[p.lookup[ch]]);if(pos!==-1){selected={kind:'clue',row:i,pos};return;}}selected={kind:'clue',row:0,pos:0};}
function selectedNumber(){const p=levelData(save.level);if(!selected)return null;
 if(selected.kind==='clue'){const c=p.clues[selected.row];return c&&p.lookup[c.word[selected.pos]]||null;}
 const tokens=p.phrase.split(/\s+/).filter(Boolean);const str=tokens[selected.row];return str&&p.lookup[str[selected.pos]]||null;
}
function applySelection(){const n=selectedNumber();document.querySelectorAll('[data-num]').forEach(el=>{el.classList.toggle('related',Number(el.dataset.num)===Number(n)&&!(selected&&el.dataset.kind===selected.kind&&+el.dataset.row===selected.row&&+el.dataset.pos===selected.pos));el.classList.toggle('active',Boolean(selected&&el.dataset.kind===selected.kind&&+el.dataset.row===selected.row&&+el.dataset.pos===selected.pos));});
 const map=mappings();document.querySelectorAll('.key[data-letter]').forEach(el=>el.classList.toggle('mapped',Object.values(map).includes(el.dataset.letter)));
}
function updateBoard(){if(view!=='game')return;const p=levelData(save.level);const scroll=document.getElementById('cluesScroll');if(!scroll){render();return;}const y=scroll.scrollTop;
 document.getElementById('phraseSlots').innerHTML=buildPhraseTokens(p);scroll.innerHTML=clueHTML(p);scroll.scrollTop=y;const count=revealCount();document.getElementById('phraseCount').textContent=`${count} / ${p.phraseNums.length} letters`;document.getElementById('solveMeter').style.width=pct(count,p.phraseNums.length)+'%';document.getElementById('solvePercent').textContent=pct(count,p.phraseNums.length)+'%';document.getElementById('hintNumber').textContent=save.hints[save.level]?'· '+save.hints[save.level]:'';applySelection();
}
function currentPositions(){const p=levelData(save.level);if(selected?.kind==='clue'){const word=p.clues[selected.row]?.word||'';return [...word].map((ch,pos)=>({kind:'clue',row:selected.row,pos,n:p.lookup[ch]}));}
 if(selected?.kind==='phrase'){const word=p.phrase.split(/\s+/).filter(Boolean)[selected.row]||'';return [...word].map((ch,pos)=>({kind:'phrase',row:selected.row,pos,n:p.lookup[ch]})).filter(x=>x.n);}
 return [];
}
function moveNext(){const positions=currentPositions(),map=mappings();let found=false;
 for(const p of positions){if(found&&!map[p.n]&&!levelData(save.level).seeds[p.n]){selected={kind:p.kind,row:p.row,pos:p.pos};applySelection();return;}if(p.pos===selected?.pos)found=true;}
 const puzzle=levelData(save.level);
 for(let offset=1;offset<=puzzle.clues.length;offset++){
  const idx=((selected?.kind==='clue'?selected.row:-1)+offset+puzzle.clues.length)%puzzle.clues.length;
  const chars=[...puzzle.clues[idx].word];const pos=chars.findIndex(ch=>!map[puzzle.lookup[ch]]);
  if(pos>=0){selected={kind:'clue',row:idx,pos};applySelection();const target=document.querySelector(`[data-kind="clue"][data-row="${idx}"][data-pos="${pos}"]`);target?.scrollIntoView({block:'nearest',behavior:save.motion?'smooth':'auto'});return;}
 }
 // All clue letters are filled; focus remaining hidden phrase letters.
 const tokens=puzzle.phrase.split(/\s+/).filter(Boolean);
 for(let row=0;row<tokens.length;row++){for(let pos=0;pos<tokens[row].length;pos++){const n=puzzle.lookup[tokens[row][pos]];if(n&&!map[n]){selected={kind:'phrase',row,pos};applySelection();return;}}}
}
function chime(success=false){if(!save.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioContext=audioContext||new C();if(audioContext.state==='suspended')audioContext.resume();const now=audioContext.currentTime;const notes=success?[523.25,659.25,783.99,1046.5]:[690];notes.forEach((freq,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,now+i*.115);gain.gain.setValueAtTime(.0001,now+i*.115);gain.gain.exponentialRampToValueAtTime(success?.075:.025,now+i*.115+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.115+.24);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now+i*.115);osc.stop(now+i*.115+.25);});}catch(_){}}
function toast(str){const el=document.getElementById('toast');el.textContent=str;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}
function enterLetter(ch){if(view!=='game'||modal||!/^[A-Z]$/.test(ch))return;let n=selectedNumber();if(!n){chooseInitial();n=selectedNumber();if(!n)return;}
 const p=levelData(save.level),map=mappings();if(p.seeds[n]){toast('That letter is already revealed. Choose another box.');moveNext();return;}
 const conflict=Object.keys(map).find(k=>Number(k)!==Number(n)&&map[k]===ch);
 if(conflict){toast(`${ch} already belongs to number ${conflict}. Try another letter.`);return;}
 if(!save.guesses[save.level])save.guesses[save.level]={};save.guesses[save.level][n]=ch;
 wrong.clear();persist();chime();updateBoard();
 if(checkWin())return;
 moveNext();
}
function erase(){if(view!=='game'||modal)return;const n=selectedNumber();const p=levelData(save.level);if(!n){chooseInitial();return;}if(p.seeds[n]){toast('This letter is a starting hint and cannot be erased.');return;}
 if(save.guesses[save.level])delete save.guesses[save.level][n];wrong.delete(Number(n));persist();updateBoard();}
function hint(){if(view!=='game'||modal)return;const p=levelData(save.level),map=mappings();let n=selectedNumber();if(!n||map[n]===p.truth[n])n=Object.keys(p.truth).map(Number).find(x=>map[x]!==p.truth[x]);if(!n){toast('All letters are already correct!');return;}
 const truth=p.truth[n];if(!save.guesses[save.level])save.guesses[save.level]={};
 for(const key of Object.keys(save.guesses[save.level]))if(key!=n&&save.guesses[save.level][key]===truth)delete save.guesses[save.level][key];
 save.guesses[save.level][n]=truth;save.hints[save.level]=(Number(save.hints[save.level])||0)+1;wrong.clear();persist();chime();updateBoard();toast(`A little sunshine! ${n} = ${truth}`);checkWin();}
function checkWin(){const p=levelData(save.level),map=mappings();if(!p.phraseNums.every(n=>map[n]===p.truth[n]))return false;
 if(!save.completed[save.level]){save.completed[save.level]=true;persist();chime(true);}
 if(!delayedCompletion){delayedCompletion=true;setTimeout(()=>{delayedCompletion=false;modal='win';updateModal();confetti();},400);}return true;
}
function checkWork(){const p=levelData(save.level),map=mappings();wrong=new Set(Object.keys(map).filter(k=>map[k]!==p.truth[k]).map(Number));updateBoard();if(wrong.size)toast(`${wrong.size} letter ${wrong.size===1?'match needs':'matches need'} a second look.`);else if(checkWin())return;else toast('Everything you’ve entered so far looks good! Keep blooming.');}
function go(dest){if(dest==='game'){view='game';wrong.clear();selected=null;}else{view=dest;selected=null;wrong.clear();}modal=null;render();}
function openLevel(n){save.level=Math.min(Math.max(n,0),TOTAL-1);persist();go('game');}
function openChapter(n){detailChapter=Math.min(Math.max(n,0),DATA.chapters.length-1);detailPage=chapterOf(save.level)===detailChapter?Math.floor((chapterLevelOf(save.level)-1)/PAGE_SIZE):0;go('detail');}
function updateModal(){document.getElementById('modalLayer')?.remove();if(!modal)return;const p=levelData(save.level),c=DATA.chapters[p.chapter];let body='';
 if(modal==='win')body=`<img class="modal-art" src="${artSrc(c.art)}" alt="${safe(c.name)}"><div class="overline">✦ A LITTLE MOMENT OF MAGIC ✦</div><h2>Beautifully done!</h2><p>You followed the clues and brought a hidden thought into the light.</p><div class="revealed">“${safe(allPhrases[save.level])}”</div><p style="font-size:12px">Another flower in your word garden. ${countCompleted()} of ${TOTAL} puzzles collected.</p><div class="modal-actions"><button class="secondary" data-act="chapters">Choose a chapter</button><button class="primary" data-act="win-next">Next little mystery ${ico('arrow')}</button></div>`;
 else if(modal==='how')body=`<div style="font-size:55px;color:#c98c88;line-height:1">✿</div><div class="overline" style="margin-top:16px">WELCOME TO YOUR WORD GARDEN</div><h2>How to play</h2><p>Just like a classic number-and-word cryptogram, clues help you uncover a secret saying.</p><div class="how-step"><b>1</b><span><strong>Read a clue.</strong> Guess the word from its definition below the hidden phrase.</span></div><div class="how-step"><b>2</b><span><strong>Tap a numbered box.</strong> Type the letter you think belongs there. The same number fills itself everywhere!</span></div><div class="how-step"><b>3</b><span><strong>Reveal the saying.</strong> Check your work or use unlimited free hints. There’s no timer and no penalty.</span></div><div class="modal-actions"><button class="primary" data-act="close-modal">Let's bloom ${ico('arrow')}</button></div>`;
 root.insertAdjacentHTML('beforeend',`<div class="overlay" id="modalLayer"><section class="modal" role="dialog" aria-modal="true" aria-label="${modal==='win'?'Puzzle completed':'How to play'}"><button class="close-modal" data-act="close-modal" aria-label="Close">×</button>${body}</section></div>`);
}
function confetti(){if(!save.motion)return;const canvas=document.getElementById('confetti');const ctx=canvas.getContext('2d');let raf=0,frames=0;canvas.width=window.innerWidth*devicePixelRatio;canvas.height=window.innerHeight*devicePixelRatio;canvas.style.display='block';ctx.scale(devicePixelRatio,devicePixelRatio);
 const shades=['#fff2bb','#ef9fac','#c7a4d1','#b8dba6','#ffe3d0','#c88d9b'];const rng=randFn(Date.now()|0);const particles=Array.from({length:95},()=>({x:rng()*innerWidth,y:-rng()*innerHeight*.5,v:1.5+rng()*2.8,w:4+rng()*5,rotate:rng()*6,vr:(rng()-.5)*.13,color:shades[Math.floor(rng()*shades.length)]}));
 const tick=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);for(const p of particles){p.y+=p.v;p.x+=Math.sin(frames/23+p.rotate)*.7;p.rotate+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotate);ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.w/3,p.w,p.w*.65);ctx.restore();}frames++;if(frames<200){raf=requestAnimationFrame(tick);}else{canvas.style.display='none';cancelAnimationFrame(raf);}};tick();}
function exportBackup(){const blob=new Blob([JSON.stringify({app:'Sunlit Secrets',exportedAt:new Date().toISOString(),save},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sunlit-secrets-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your garden backup is ready.');}
root.addEventListener('click',ev=>{
 const el=ev.target.closest('[data-act]');if(!el)return;const act=el.dataset.act;
 if(act==='select'){selected={kind:el.dataset.kind,row:Number(el.dataset.row),pos:Number(el.dataset.pos)};applySelection();return;}
 if(act==='letter'){enterLetter(el.dataset.letter);return;}
 if(act==='play'){go('game');return;}
 if(act==='home'){go('home');return;}
 if(act==='chapters'){go('chapters');return;}
 if(act==='detail'){openChapter(Number(el.dataset.chapter));return;}
 if(act==='prev-page'||act==='next-page'){detailPage=Math.max(0,Math.min(Math.ceil(perChapter/PAGE_SIZE)-1,detailPage+(act==='next-page'?1:-1)));render();return;}
 if(act==='open-level'){openLevel(Number(el.dataset.level));return;}
 if(act==='back'){if(view==='detail')go('chapters');else go('home');return;}
 if(act==='settings'){go('settings');return;}
 if(act==='how'){modal='how';updateModal();return;}
 if(act==='close-modal'){modal=null;updateModal();return;}
 if(act==='win-next'){const c=chapterOf(save.level),local=chapterLevelOf(save.level)-1;openLevel(globalLevel(local+1<perChapter?c:(c+1)%DATA.chapters.length,local+1<perChapter?local+1:0));return;}
 if(act==='hint'){hint();return;}
 if(act==='erase'){erase();return;}
 if(act==='check'){checkWork();return;}
 if(act==='next'){moveNext();return;}
 if(act==='toggle-sound'){save.sound=!save.sound;persist();render();if(save.sound)chime();return;}
 if(act==='toggle-motion'){save.motion=!save.motion;persist();render();return;}
 if(act==='export'){exportBackup();return;}
 if(act==='import'){document.getElementById('backup-file')?.click();return;}
 if(act==='reset'){if(confirm('Start your word garden from the beginning? This will erase local progress. Export a backup first if you might want it later.')){save=defaultState();persist();toast('Fresh start — your garden is ready.');go('home');}return;}
});
root.addEventListener('change',async(ev)=>{if(ev.target?.id!=='backup-file')return;try{const file=ev.target.files[0];if(!file)return;const obj=JSON.parse(await file.text());if(obj.app!=='Sunlit Secrets'||obj.save?.version!==1||typeof obj.save.guesses!=='object')throw Error('Invalid backup');save={...defaultState(),...obj.save};save.level=Math.min(Math.max(Number(save.level)||0,0),TOTAL-1);persist();go('home');toast('Your word garden has been restored.');}catch(e){toast('Could not import this backup. Use a Sunlit Secrets backup file.');}});
document.addEventListener('keydown',ev=>{if(modal){if(ev.key==='Escape'){modal=null;updateModal();}return;}if(view!=='game'||ev.altKey||ev.ctrlKey||ev.metaKey||['INPUT','TEXTAREA'].includes(ev.target.tagName))return;
 if(/^[a-z]$/i.test(ev.key)){ev.preventDefault();enterLetter(ev.key.toUpperCase());}else if(ev.key==='Backspace'||ev.key==='Delete'){ev.preventDefault();erase();}else if(ev.key==='ArrowRight'){ev.preventDefault();moveNext();}else if(ev.key==='Escape'){go('home');}
});
render();if(!save.tutorialSeen){save.tutorialSeen=true;persist();modal='how';updateModal();}
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
