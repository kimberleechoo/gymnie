import { html, useMemo, useState } from '../react.js';
import { SessionCard } from '../components/SessionCard.js';
import { EX } from '../data/exercises.js';
import { clamp, dkey, fmtDate, fmtW, weekStart } from '../lib/helpers.js';
import { keyToDate, milestoneState } from '../lib/milestones.js';
import { makeSamples } from '../lib/sampleData.js';
import { bestOf, perfHistory, suggestion } from '../lib/training.js';
import { Empty, Header, Seg, useCtx } from '../ui/common.js';
import { Icon } from '../ui/icons.js';

export function Calendar({sessions}){
  const [month,setMonth]=useState(()=>{ const d=new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [sel,setSel]=useState(dkey(new Date()));
  const byDay=useMemo(()=>{ const m={}; sessions.forEach(x=>{ const k=dkey(x.date); (m[k]=m[k]||[]).push(x); }); return m; },[sessions]);
  const y=month.getFullYear(), mo=month.getMonth();
  const lead=(new Date(y,mo,1).getDay()+6)%7, dim=new Date(y,mo+1,0).getDate();
  const todayK=dkey(new Date());
  const cells=[]; for(let i=0;i<lead;i++) cells.push(null); for(let d=1;d<=dim;d++) cells.push(new Date(y,mo,d));
  const inMonth=sessions.filter(x=>{ const d=new Date(x.date); return d.getFullYear()===y&&d.getMonth()===mo; });
  const days=new Set(inMonth.map(x=>dkey(x.date))).size;
  const mins=Math.round(inMonth.reduce((a,x)=>a+(x.durationSec||0),0)/60);
  const curStart=new Date(); curStart.setDate(1); curStart.setHours(0,0,0,0);
  const atCurrent=month>=curStart;
  const shift=n=>{ setMonth(new Date(y,mo+n,1)); };
  const list=byDay[sel]||[];
  return html`<div className="stack">
    <div className="card stack" style=${{gap:12}}>
      <div className="row between">
        <button type="button" className="icon-btn" aria-label="Previous month" onClick=${()=>shift(-1)}><${Icon} name="left"/></button>
        <h3 style=${{textAlign:'center'}}>${month.toLocaleDateString('en-SG',{month:'long',year:'numeric'})}</h3>
        <button type="button" className="icon-btn" aria-label="Next month" disabled=${atCurrent} style=${{transform:'scaleX(-1)',opacity:atCurrent?.4:1}} onClick=${()=>shift(1)}><${Icon} name="left"/></button>
      </div>
      <div className="cal" role="grid" aria-label="Workout calendar">
        ${'MTWTFSS'.split('').map((d,i)=>html`<div key=${'h'+i} className="cal-h" aria-hidden="true">${d}</div>`)}
        ${cells.map((d,i)=>{
          if(!d) return html`<span key=${'b'+i}></span>`;
          const k=dkey(d), n=(byDay[k]||[]).length;
          const fut=d>new Date()&&k!==todayK;
          return html`<button key=${k} type="button" aria-pressed=${sel===k} aria-label=${d.toLocaleDateString('en-SG',{weekday:'long',day:'numeric',month:'long'})+(n?', '+n+' workout'+(n>1?'s':''):'')}
            className=${'cal-d'+(n?' has':'')+(k===todayK?' today':'')+(sel===k?' sel':'')+(fut?' future':'')} onClick=${()=>setSel(k)}>${d.getDate()}</button>`;
        })}
      </div>
      <p className="muted small num">${inMonth.length?inMonth.length+' workout'+(inMonth.length>1?'s':'')+' on '+days+' day'+(days>1?'s':'')+' · '+mins+' min':'No workouts this month yet.'}</p>
    </div>
    <h3>${keyToDate(sel).toLocaleDateString('en-SG',{weekday:'long',day:'numeric',month:'long'})}</h3>
    ${list.length?list.map(x=>html`<${SessionCard} key=${x.id} s=${x}/>`):html`<p className="muted">${sel>todayK?'This day has not happened yet.':'No workout logged on this day. Rest days count too.'}</p>`}
  </div>`;
}

export function Milestones(){
  const {state}=useCtx();
  const goal=state.profile.weeklyGoal;
  const ms=useMemo(()=>milestoneState(state.sessions,goal),[state.sessions,goal]);
  const done=ms.items.filter(i=>i.done).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  const todo=ms.items.filter(i=>!i.done);
  const thisWeek=state.sessions.filter(x=>new Date(x.date)>=weekStart(new Date())&&!x.sample).length;
  return html`<div className="stack">
    <div className="stats">
      <div className="stat"><b className="num">${done.length}/${ms.items.length}</b><span>unlocked</span></div>
      <div className="stat"><b className="num">${ms.m.weeksHit}</b><span>goal weeks</span></div>
      <div className="stat"><b className="num">${ms.m.curS}</b><span>week streak</span></div>
    </div>
    <div className="card stack" style=${{gap:8}}>
      <div className="row between"><h3>This week's goal</h3><span className=${'tag num'}>${thisWeek} of ${goal}</span></div>
      <div className="bar" aria-hidden="true"><i style=${{width:clamp(thisWeek/goal*100,0,100)+'%'}}></i></div>
      <p className="muted small">${thisWeek>=goal?'Goal reached. Yay! Anything extra is a bonus.':(goal-thisWeek)+' more session'+(goal-thisWeek>1?'s':'')+' to hit your goal. You can change the goal in Profile.'}</p>
    </div>
    ${ms.real.length===0&&html`<div className="notice">Milestones count real workouts only. Example sessions are not included.</div>`}
    ${done.length>0&&html`<span className="label">Unlocked</span>`}
    ${done.map(i=>html`<div key=${i.id} className="card ms row"><span className="badge on"><${Icon} name="star" size=${22}/></span><div className="grow"><b>${i.title}</b><div className="small">${i.text}</div>${i.date&&html`<div className="muted small">${fmtDate(i.date)}</div>`}</div></div>`)}
    <span className="label">Up next</span>
    ${todo.map(i=>html`<div key=${i.id} className="card ms locked stack" style=${{gap:8}}>
      <div className="row"><span className="badge"><${Icon} name="star" size=${22}/></span><div className="grow"><b>${i.title}</b><div className="muted small">${i.text}</div></div>${i.prog&&html`<span className="muted small num">${i.prog[0]}/${i.prog[1]}</span>`}</div>
      ${i.prog&&html`<div className="bar" aria-hidden="true"><i style=${{width:(i.prog[0]/i.prog[1]*100)+'%'}}></i></div>`}</div>`)}
    ${todo.length===0&&html`<p className="muted">Everything unlocked. You are on a roll.</p>`}
  </div>`;
}

export function History(){
  const {state,update,go,ui,setUi}=useCtx();
  const tab=ui.histTab||'sessions';
  const setTab=v=>setUi(u=>({...u,histTab:v}));
  const sorted=useMemo(()=>state.sessions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)),[state.sessions]);
  const exs=useMemo(()=>EX.filter(e=>perfHistory(e.id,state.sessions).length),[state.sessions]);
  const loadSamples=()=>update(s=>({...s,sessions:[...makeSamples(),...s.sessions]}));
  const emptyAll=html`<${Empty} title="No workouts yet" text="Finish a workout and it will be saved here with weights, reps and personal bests."
      action=${html`<div className="stack" style=${{width:'100%'}}><button type="button" className="btn primary" onClick=${()=>go('build')}>Build a workout</button><button type="button" className="btn ghost" onClick=${loadSamples}>Load 3 example sessions</button></div>`}/>`;
  return html`<div className="stack">
    <${Header} title="History" sub=${sorted.length?sorted.length+' session'+(sorted.length>1?'s':'')+' logged':'Your sessions appear here.'}/>
    <${Seg} cls="four" label="History view" value=${tab} onChange=${setTab} options=${[{v:'sessions',label:'Sessions'},{v:'calendar',label:'Calendar'},{v:'milestones',label:'Milestones'},{v:'exercises',label:'Lifts'}]}/>
    ${tab==='calendar'?html`<${Calendar} sessions=${state.sessions}/>`
    :tab==='milestones'?html`<${Milestones}/>`
    :sorted.length===0?emptyAll
    :tab==='sessions'?sorted.map(s=>html`<${SessionCard} key=${s.id} s=${s}/>`)
    :exs.map(ex=>{ const h=perfHistory(ex.id,state.sessions); const best=bestOf(ex.id,state.sessions); const sg=suggestion(ex.id,state.sessions); const l=h[0];
      return html`<div key=${ex.id} className="card stack" style=${{gap:6}}>
        <div className="row between"><b>${ex.name}</b><span className="muted small">${h.length} session${h.length>1?'s':''}</span></div>
        <div className="sline"><span className="muted">Last (${fmtDate(l.date)})</span><span className="num">${l.sets.map(x=>(ex.bw?'':fmtW(x.w)+'×')+x.r).join('  ')}</span></div>
        <div className="sline"><span className="muted">Personal best</span><span className="num"><span className="tag rose">${ex.bw?best.r+(ex.unit==='sec'?' sec':' reps'):fmtW(best.w)+' kg × '+best.r}</span></span></div>
        <p className=${'small'+(sg.kind==='up'?'':' muted')}>${sg.text}</p></div>`; })}
    ${sorted.length>0&&tab==='exercises'&&exs.length===0&&html`<${Empty} title="No exercise records" text="Complete some sets to see per-exercise progress."/>`}
  </div>`;
}
