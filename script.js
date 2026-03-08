// ---- Settings ----
const KEY     = "recycle_vote_state";
const PIN_KEY = "recycle_vote_pin";

// หน้าไหนก็ใช้ตัวแปร staff ร่วมกันได้ (หน้าบ้านตั้งเป็น false, หน้า staff เปลี่ยนเป็น true หลังล็อกอิน)
window.staff = window.staff ?? false;

// ---- State & helpers ----
let state = {};

function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function load(){ try{ state = JSON.parse(localStorage.getItem(KEY)||"{}")||{} }catch{ state = {}; } }

function getPIN(){ return localStorage.getItem(PIN_KEY)||"1234"; }
function setPIN(p){ localStorage.setItem(PIN_KEY,p); }

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => (
    {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]
  ));
}

// ---- Data mutations ----
function upsert(num,name){
  const n = Number(num);
  if(!state[n]) state[n] = { num:n, name:name||"", votes:0 };
  else if(name) state[n].name = name;
  save(); render();
}
function addVote(num,amt){
  const n = Number(num);
  if(!state[n]) state[n] = { num:n, name:"", votes:0 };
  state[n].votes += Number(amt||0);
  save(); render();
}
function removeVote(num,amt){
  const n = Number(num);
  if(state[n]){ state[n].votes = Math.max(0, state[n].votes-Number(amt||0)); save(); render(); }
}
function removeContestantInstant(card, num){
  const key = String(num);
  if(!(key in state)) return;
  delete state[key];
  save();
  if (card) card.remove();
  quickUpdateStatsOrEmpty();
}
function quickUpdateStatsOrEmpty(){
  const arr = Object.values(state);
  const statsEl = document.querySelector('#stats');
  if(!statsEl) return;
  const totalTeams = arr.length;
  const totalVotes = arr.reduce((s,x)=>s+x.votes,0);
  statsEl.textContent = totalTeams ? `ทีมทั้งหมด: ${totalTeams} | คะแนนรวม: ${totalVotes}` : '';
  if(!totalTeams){
    const root = document.querySelector('#list');
    if (root) root.innerHTML = "<div class='item'>ยังไม่มีข้อมูล</div>";
  }
}

// ---- View helpers ----
function filterSort(){
  const qEl = document.querySelector("#searchInput");
  const sEl = document.querySelector("#sortSelect");
  const q = (qEl?.value || "").toLowerCase();
  const sort = sEl?.value || "votes-desc";

  let arr = Object.values(state);
  if(q) arr = arr.filter(x => String(x.num).includes(q) || (x.name||"").toLowerCase().includes(q));

  arr.sort({
    "votes-desc":(a,b)=>(b.votes-a.votes)||(a.num-b.num),
    "votes-asc":(a,b)=>(a.votes-b.votes)||(a.num-b.num),
    "num-asc":(a,b)=>a.num-b.num,
    "num-desc":(a,b)=>b.num-a.num
  }[sort]);

  return arr;
}

function render(){
  const root = document.querySelector("#list");
  const stats = document.querySelector("#stats");
  if(!root) return;

  root.innerHTML = "";
  const arr = filterSort();

  if(!arr.length){
    root.innerHTML = "<div class='item'>ยังไม่มีข้อมูล</div>";
    if (stats) stats.textContent = "";
    return;
  }

  const top3 = [...arr].sort((a,b)=>(b.votes-a.votes)||(a.num-b.num)).slice(0,3).map(x=>x.num);

  for(const x of arr){
    const el = document.createElement("div");
    el.className = "item";
    el.dataset.num = String(x.num);

    if(top3[0]===x.num) el.classList.add("top1");
    else if(top3[1]===x.num) el.classList.add("top2");
    else if(top3[2]===x.num) el.classList.add("top3");

    el.innerHTML = `
      <div class="num">หมายเลข ${x.num}</div>
      <div class="name">${x.name?escapeHtml(x.name):"(ไม่มีชื่อ)"}</div>
      <div class="votes">${x.votes}</div>
      ${window.staff ? `
      <div class="controls">
        <button class="btn-yellow" data-action="plus1">+1</button>
        <button class="btn-orange" data-action="plus5">+5</button>
        <button class="btn-blue"   data-action="minus1">-1</button>
        <button class="btn-danger" data-action="remove">ลบ</button>
      </div>` : ``}
    `;
    root.appendChild(el);
  }

  if (stats) stats.textContent = `ทีมทั้งหมด: ${arr.length} | คะแนนรวม: ${arr.reduce((s,x)=>s+x.votes,0)}`;
}

// ---- Init & events ----
function initPage(isStaffPage=false){
  if(!localStorage.getItem(PIN_KEY)) setPIN("147");
  load(); render();

  // delegation for list buttons (works on both pages)
  const list = document.querySelector("#list");
  if (list) {
    list.addEventListener("click",(e)=>{
      const btn = e.target.closest("button"); if(!btn) return;
      const card = btn.closest(".item");
      const num  = parseInt(card?.dataset.num,10);
      const act  = btn.dataset.action;
      if(!Number.isFinite(num) || !act) return;

      if(act==="plus1") addVote(num,1);
      else if(act==="plus5") addVote(num,5);
      else if(act==="minus1") removeVote(num,1);
      else if(act==="remove") removeContestantInstant(card, num);
    });
  }

  // search/sort (staff page only)
  const search = document.querySelector("#searchInput");
  const sort   = document.querySelector("#sortSelect");
  if (search) search.oninput = render;
  if (sort)   sort.onchange = render;

  if (!isStaffPage) return; // home page stops here

  // Staff login + controls
  const loginBtn = document.querySelector("#loginBtn");
  const pinInput = document.querySelector("#pinInput");
  const loginPanel   = document.querySelector("#loginPanel");
  const controlPanel = document.querySelector("#controlPanel");

  const addContestantBtn = document.querySelector("#addContestantBtn");
  const numInput  = document.querySelector("#numInput");
  const nameInput = document.querySelector("#nameInput");

  const addVoteBtn  = document.querySelector("#addVoteBtn");
  const addVote5Btn = document.querySelector("#addVote5Btn");
  const voteNumInput = document.querySelector("#voteNumInput");

  if (loginBtn && pinInput){
    loginBtn.onclick = ()=>{
      if(pinInput.value === getPIN()){
        window.staff = true;
        if (loginPanel)   loginPanel.style.display = "none";
        if (controlPanel) controlPanel.style.display = "block";
        render();
      }else{
        alert("PIN ไม่ถูกต้อง");
      }
    };
  }

  if (addContestantBtn){
    addContestantBtn.onclick = ()=>{
      const n = (numInput?.value || "").trim();
      const nm= (nameInput?.value||"").trim();
      if(!/^[0-9]{1,4}$/.test(n)) return alert("ใส่หมายเลข 1-4 หลัก");
      upsert(n, nm);
      if(numInput)  numInput.value  = "";
      if(nameInput) nameInput.value = "";
    };
  }

  if (addVoteBtn){
    addVoteBtn.onclick = ()=>{
      const n = (voteNumInput?.value || "").trim();
      if(!/^[0-9]{1,4}$/.test(n)) return alert("หมายเลขไม่ถูกต้อง");
      addVote(n,1);
      if(voteNumInput) voteNumInput.value="";
    };
  }
  if (addVote5Btn){
    addVote5Btn.onclick = ()=>{
      const n = (voteNumInput?.value || "").trim();
      if(!/^[0-9]{1,4}$/.test(n)) return alert("หมายเลขไม่ถูกต้อง");
      addVote(n,5);
      if(voteNumInput) voteNumInput.value="";
    };
  }
  if (voteNumInput){
    voteNumInput.addEventListener("keydown", e=>{
      if(e.key==="Enter" && addVoteBtn) addVoteBtn.click();
    });
  }
}

// export init for inline call
window.initPage = initPage;
