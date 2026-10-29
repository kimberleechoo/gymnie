import { html, useMemo } from '../react.js';
import { GROUPS, GROUP_ORDER } from '../data/exercises.js';
import { clamp, dkey, fmtDate, fmtLong, fmtMin, weekStart } from '../lib/helpers.js';
import { milestoneState } from '../lib/milestones.js';
import { groupRecency, isRamping } from '../lib/training.js';
import { Header, useCtx } from '../ui/common.js';
import { Icon } from '../ui/icons.js';

export function Home(){
  const {state,quickStart,go,setUi}=useCtx();
  const {sessions,active,profile}=state;
  const mst=useMemo(()=>milestoneState(sessions,profile.weeklyGoal),[sessions,profile.weeklyGoal]);
  const latestMs=mst.items.filter(i=>i.done&&i.date).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const nextMs=mst.items.filter(i=>!i.done&&i.prog).sort((a,b)=>(b.prog[0]/b.prog[1])-(a.prog[0]/a.prog[1]))[0];
  const sorted=useMemo(()=>sessions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)),[sessions]);
  const last=sorted[0];
  const ws=weekStart(new Date());
  const days=[0,1,2,3,4,5,6].map(i=>{const d=new Date(ws); d.setDate(ws.getDate()+i); return d;});
  const counts=days.map(d=>sessions.filter(s=>dkey(s.date)===dkey(d)).length);
  const thisWeek=sessions.filter(s=>new Date(s.date)>=ws);
  const weekMin=Math.round(thisWeek.reduce((a,s)=>a+(s.durationSec||0),0)/60);
  const rec=groupRecency(sessions);
  const suggest=sessions.length?GROUP_ORDER.slice().sort((a,b)=>(rec[b]-rec[a])||(GROUP_ORDER.indexOf(a)-GROUP_ORDER.indexOf(b))).slice(0,2):['back','glutes'];
  const doneN=active?active.items.filter(i=>i.skipped||(i.kind==='cardio'?i.done:i.sets.every(s=>s.done))).length:0;
  const goal=profile.weeklyGoal;
  const hour=new Date().getHours();
  const greet=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
  return html`<div className="stack">
    <${Header} title=${greet} sub=${fmtLong(new Date())}/>
    ${isRamping(sessions)&&html`<div className="notice ok">${sessions.length?'Welcome back. Keep weights comfortable for your first couple of sessions.':'Welcome. Start light, learn each machine, and let the weights come later.'}</div>`}
    <div className="hero">
      <div><h2 style=${{fontSize:24}}>${active?'Workout in progress':'Today\'s workout'}</h2>
        <p style=${{marginTop:4}}>${active?doneN+' of '+active.items.length+' exercises done':'Suggested focus: '+suggest.map(g=>GROUPS[g].short).join(' + ')+(sessions.length&&isFinite(rec[suggest[0]])?' (last trained '+(rec[suggest[0]]===0?'today':rec[suggest[0]]+' days ago')+')':'')}</p></div>
      <button type="button" className="btn primary" onClick=${quickStart}>${active?'Resume workout':'Start Today\'s Workout'}</button>
    </div>
    <div className="card stack" style=${{gap:12}}>
      <div className="row between"><h3>This week</h3><span className="tag num">${thisWeek.length} of ${goal} sessions</span></div>
      <div className="week">${days.map((d,i)=>html`<div key=${i} className="day"><span className=${'dot'+(counts[i]?' on':'')+(dkey(d)===dkey(new Date())?' today':'')}>${counts[i]?html`<${Icon} name="check" size=${18}/>`:null}</span>${'MTWTFSS'[i]}</div>`)}</div>
      <div className="bar" aria-hidden="true"><i style=${{width:clamp(thisWeek.length/goal*100,0,100)+'%'}}></i></div>
      <p className="muted small">${thisWeek.length?weekMin+' minutes trained so far. ':''}${thisWeek.length>=goal?'Weekly goal reached. Yay! Extra rest counts too.':'2–3 sessions a week is plenty for steady progress.'}</p>
    </div>
    <div className="card stack" style=${{gap:10}}>
      <div className="row between"><h3>Milestones</h3><button type="button" className="btn ghost sm" onClick=${()=>setUi(u=>({...u,tab:'history',screen:'tabs',histTab:'milestones'}))}>See all</button></div>
      ${latestMs&&html`<div className="row"><span className="badge on"><${Icon} name="star" size=${20}/></span><div className="grow"><b>${latestMs.title}</b><div className="muted small">Unlocked ${fmtDate(latestMs.date)}</div></div></div>`}
      ${nextMs?html`<div className="stack" style=${{gap:6}}><div className="row between"><span className="small">Next: <b>${nextMs.title}</b></span><span className="muted small num">${nextMs.prog[0]} of ${nextMs.prog[1]}</span></div><div className="bar" aria-hidden="true"><i style=${{width:(nextMs.prog[0]/nextMs.prog[1]*100)+'%'}}></i></div></div>`
        :!latestMs&&html`<p className="muted">Your first milestone is one workout away.</p>`}
    </div>
    <div className="card stack" style=${{gap:10}}>
      <div className="row between"><h3>Last workout</h3>${last&&html`<button type="button" className="btn ghost sm" onClick=${()=>go('history')}>History</button>`}</div>
      ${last?html`<div>
        <div className="row between"><b>${last.focus}</b><span className="muted small">${fmtDate(last.date)}</span></div>
        <p className="muted small" style=${{marginTop:2}}>${last.items.filter(i=>(i.sets&&i.sets.length)||i.cardioMin).length} exercises · ${fmtMin(last.durationSec||0)}</p>
        <p style=${{marginTop:8}} className="small">${last.items.filter(i=>(i.sets&&i.sets.length)||i.cardioMin).slice(0,4).map(i=>i.name).join(', ')}</p>
      </div>`:html`<p className="muted">Nothing logged yet. Your first session will show up here.</p>`}
    </div>
  </div>`;
}
