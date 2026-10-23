const cards = window.LITERACY_CARDS || [];
const cardsByBook = {
  upper: cards.filter(card => card.book === 'upper'),
  lower: cards.filter(card => card.book === 'lower')
};
const bookNames = {upper:'一年级上册', lower:'一年级下册'};
const legacyCharacters = ['一','二','三','人','大','小','口','日','月','山','水','火','木','土','天','上','下','你','我','他','学','生','家','国'];
const state = {book:'upper', index:0, queue:[0,1,2], queuePos:0, learned:new Set(), due:new Set(), streak:0, daily:0, mode:'儿童端', reviewing:false};
const $ = id => document.getElementById(id);

function activeCards(){return cardsByBook[state.book]}
function today(){const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem('village-literacy')||'{}');
    if(saved.version===2){
      state.learned=new Set((saved.learned||[]).filter(value=>typeof value==='string'));
      state.due=new Set((saved.due||[]).filter(value=>typeof value==='string'));
    }else{
      for(const index of saved.learned||[]){const card=cards.find(item=>item.char===legacyCharacters[index]);if(card)state.learned.add(card.id)}
      for(const index of saved.due||[]){const card=cards.find(item=>item.char===legacyCharacters[index]);if(card)state.due.add(card.id)}
    }
    state.streak=Number(saved.streak)||0;
    state.daily=saved.dailyDate===today()?Number(saved.daily)||0:0;
    state.mode=saved.mode||'儿童端';
    state.book=saved.book==='lower'?'lower':'upper';
    const savedIndex=activeCards().findIndex(card=>card.id===saved.current);
    state.index=savedIndex>=0?savedIndex:0;
    state.queue=[state.index];
    state.queuePos=0;
  }catch{}
}
function save(){
  try{localStorage.setItem('village-literacy',JSON.stringify({version:2,learned:[...state.learned],due:[...state.due],streak:state.streak,daily:state.daily,dailyDate:today(),mode:state.mode,book:state.book,current:current()?.id}))}catch{}
}
function current(){return activeCards()[state.index]||activeCards()[0]}
function render(){
  const card=current();
  if(!card)return;
  const termCards=activeCards();
  const learnedInBook=termCards.filter(item=>state.learned.has(item.id)).length;
  $('bookHeading').textContent=bookNames[state.book];
  $('charText').textContent=card.char;
  $('charTitle').textContent=card.char;
  $('traceChar').textContent=card.char;
  $('pinyinText').textContent=card.pinyin.join(' / ');
  $('wordText').textContent=card.words.join(' · ')||'—';
  $('cardIndex').textContent=`${state.queuePos+1} / ${state.queue.length}`;
  $('learnedCount').textContent=learnedInBook;
  $('totalCount').textContent=termCards.length;
  $('progressBar').style.width=`${Math.round(learnedInBook/termCards.length*100)}%`;
  $('streakValue').textContent=state.streak;
  $('taskNumber').textContent=String(Math.max(0,3-state.daily)).padStart(2,'0');
  $('taskStatus').textContent=state.daily>=3?'今日任务已完成':`还差 ${Math.max(0,3-state.daily)} 个字`;
  $('modeLabel').textContent=state.mode;
  $('profileMode').textContent=state.mode;
  $('reviewText').textContent=state.due.size?`有 ${state.due.size} 个字等你复习`:'今天还没有需要复习的字';
  $('bookMark').textContent=state.book==='upper'?'上册':'下册';
  $('bookCardCount').textContent=termCards.length;
  $('bookInfoText').textContent=`${bookNames[state.book]} · 识字表`;
  document.querySelectorAll('.book-tab').forEach(button=>{
    const selected=button.dataset.book===state.book;
    button.classList.toggle('active',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  document.querySelectorAll('.stroke-live').forEach(path=>path.classList.remove('show'));
}
function renderLibrary(){
  const query=$('cardSearch').value.trim().toLocaleLowerCase();
  const filtered=activeCards().filter(card=>`${card.char} ${card.pinyin.join(' ')} ${card.words.join(' ')}`.toLocaleLowerCase().includes(query));
  $('libraryCount').textContent=`${filtered.length} / ${activeCards().length} 个字`;
  const grid=$('cardsGrid');
  const fragment=document.createDocumentFragment();
  for(const card of filtered){
    const button=document.createElement('button');
    button.type='button';
    button.className='library-card';
    button.dataset.cardId=card.id;
    button.setAttribute('aria-label',`${card.char}，${card.pinyin.join('、')}，${card.words.join('、')}`);
    const character=document.createElement('strong');character.textContent=card.char;
    const pinyin=document.createElement('span');pinyin.textContent=card.pinyin[0]||'';
    button.append(character,pinyin);
    fragment.append(button);
  }
  grid.replaceChildren(fragment);
}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2200)}
function speak(){
  const card=current();
  if(!('speechSynthesis' in window)){toast('当前设备暂不支持发音');return}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(card.char);
  utterance.lang='zh-CN';utterance.rate=.72;window.speechSynthesis.speak(utterance);
  toast(`正在读：${card.char}`);
}
function markLearned(){
  const card=current();
  if(!card)return;
  const wasNew=!state.learned.has(card.id);
  state.learned.add(card.id);
  if(state.reviewing){state.due.delete(card.id);state.reviewing=false}
  else state.due.add(card.id);
  if(wasNew){state.daily=Math.min(3,state.daily+1);if(state.daily===1)state.streak=Math.max(1,state.streak)}
  save();render();
}
function next(){
  markLearned();
  if(state.queue.length<=1){state.index=(state.index+1)%activeCards().length;state.queue=[state.index];state.queuePos=0}
  else{state.queuePos=(state.queuePos+1)%state.queue.length;state.index=state.queue[state.queuePos]}
  save();
  $('feedback').textContent='';
  render();
}
function readAloud(){
  const char=current().char;
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){markLearned();$('feedback').textContent='设备不支持语音识别，已记录本次练习';toast('已记录跟读练习');return}
  const recognition=new Recognition();
  recognition.lang='zh-CN';recognition.interimResults=false;recognition.maxAlternatives=3;
  $('feedback').textContent='请读出这个字…';
  recognition.onresult=event=>{
    const heard=[...event.results[0]].map(result=>result.transcript).join('');
    if(heard.includes(char)){markLearned();$('feedback').textContent='读得很准，继续保持';toast('跟读正确')}
    else{$('feedback').textContent=`听到“${heard||'…'}”，再试一次`;toast('再试一次')}
  };
  recognition.onerror=()=>$('feedback').textContent='没有听清，再试一次';
  recognition.start();
}
function openTrace(){const overlay=$('traceOverlay');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');clearCanvas()}
function closeTrace(){const overlay=$('traceOverlay');overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')}
const canvas=$('traceCanvas'),ctx=canvas.getContext('2d');
let drawing=false,hasInk=false;
function clearCanvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();ctx.font='360px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(30,119,113,.09)';ctx.fillText(current().char,canvas.width/2,canvas.height/2+22);ctx.restore();hasInk=false;
}
function point(event){const rect=canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)*canvas.width/rect.width,y:(event.clientY-rect.top)*canvas.height/rect.height}}
function startDraw(event){drawing=true;hasInk=true;const p=point(event);ctx.beginPath();ctx.moveTo(p.x,p.y);canvas.setPointerCapture?.(event.pointerId);event.preventDefault()}
function moveDraw(event){if(!drawing)return;const p=point(event);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#1e7771';ctx.lineWidth=13;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();event.preventDefault()}
function endDraw(){drawing=false}
function openCards(){const overlay=$('cardsOverlay');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');renderLibrary()}
function closeCards(){const overlay=$('cardsOverlay');overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')}
function openMenu(){const overlay=$('menuOverlay');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false')}
function closeMenu(){const overlay=$('menuOverlay');overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true')}
function chooseBook(book){
  if(!cardsByBook[book]||state.book===book)return;
  state.book=book;state.index=0;state.queue=[0];state.queuePos=0;state.reviewing=false;
  save();render();
  if($('cardsOverlay').classList.contains('open'))renderLibrary();
}
function chooseCard(id){
  const card=cards.find(item=>item.id===id);
  if(!card)return;
  state.book=card.book;state.index=activeCards().findIndex(item=>item.id===id);state.queue=[state.index];state.queuePos=0;state.reviewing=false;
  save();render();closeCards();document.querySelector('.learn-panel').scrollIntoView({behavior:'smooth',block:'start'});
}
function setup(){
  load();render();
  $('soundBtn').onclick=speak;$('readBtn').onclick=readAloud;$('traceBtn').onclick=openTrace;
  $('closeTrace').onclick=closeTrace;$('clearTrace').onclick=clearCanvas;
  $('finishTrace').onclick=()=>{if(hasInk){markLearned();toast('已完成描红');closeTrace()}else toast('先描一描再提交')};
  $('nextBtn').onclick=next;
  $('startBtn').onclick=()=>{
    const termCards=activeCards();
    const fresh=termCards.map((card,index)=>index).filter(index=>!state.learned.has(termCards[index].id));
    const pool=fresh.length?fresh:termCards.map((card,index)=>index);
    state.queue=pool.sort(()=>Math.random()-.5).slice(0,3);state.queuePos=0;state.index=state.queue[0];state.reviewing=false;
    save();render();document.querySelector('.learn-panel').scrollIntoView({behavior:'smooth',block:'start'});toast('今天的练习开始了');
  };
  $('modeBtn').onclick=()=>{state.mode=state.mode==='儿童端'?'长辈端':'儿童端';save();render();toast(`已切换到${state.mode}`)};
  $('menuBtn').onclick=openMenu;$('closeMenu').onclick=closeMenu;
  $('resetBtn').onclick=()=>{if(confirm('确定要清除本机学习进度吗？')){localStorage.removeItem('village-literacy');location.reload()}};
  $('reviewBtn').onclick=()=>{
    const card=cards.find(item=>state.due.has(item.id));
    if(!card){toast('暂时没有复习任务');return}
    state.book=card.book;state.index=activeCards().findIndex(item=>item.id===card.id);state.queue=[state.index];state.queuePos=0;state.reviewing=true;
    save();render();document.querySelector('.learn-panel').scrollIntoView({behavior:'smooth',block:'start'});toast('开始复习');
  };
  document.querySelectorAll('.book-tab').forEach(button=>button.addEventListener('click',()=>chooseBook(button.dataset.book)));
  $('cardsNav').onclick=openCards;$('closeCards').onclick=closeCards;$('cardSearch').addEventListener('input',renderLibrary);
  $('cardsGrid').addEventListener('click',event=>{const button=event.target.closest('[data-card-id]');if(button)chooseCard(button.dataset.cardId)});
  $('statsNav').onclick=()=>{document.querySelector('.dashboard').scrollIntoView({behavior:'smooth',block:'start'});toast(`${$('learnedCount').textContent} / ${$('totalCount').textContent} 字`)};
  $('settingsNav').onclick=openMenu;
  canvas.addEventListener('pointerdown',startDraw);canvas.addEventListener('pointermove',moveDraw);window.addEventListener('pointerup',endDraw);
  $('traceOverlay').addEventListener('click',event=>{if(event.target===$('traceOverlay'))closeTrace()});
  $('cardsOverlay').addEventListener('click',event=>{if(event.target===$('cardsOverlay'))closeCards()});
  $('menuOverlay').addEventListener('click',event=>{if(event.target===$('menuOverlay'))closeMenu()});
}
setup();
