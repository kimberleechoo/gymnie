import { html } from '../react.js';
import { EXMAP } from '../data/exercises.js';
import { fmtDate, fmtMin, fmtW } from '../lib/helpers.js';
import { useCtx } from '../ui/common.js';

export function Saved(){
  const {ui,setUi,store}=useCtx();
  const s=ui.saved;
  if(!s) return null;
  const done=s.items.filter(i=>i.sets&&i.sets.length);
  const cardio=s.items.find(i=>i.exId==='cardio'&&i.cardioMin);
  const setsN=done.reduce((a,i)=>a+i.sets.length,0);
  return html`<div className="app"><div className="stack">
    ${ui.celebrate&&ui.celebrate.length>0&&html`<div className="cheer" role="status"><span className="label" style=${{color:'inherit'}}>${ui.celebrate.length>1?'Milestones unlocked':'Milestone unlocked'}</span><h1>Yay!</h1>
      ${ui.celebrate.map(c=>html`<div key=${c.id}><b style=${{fontSize:17}}>${c.title}</b><div>${c.text}</div></div>`)}</div>`}
    <div className="hero"><div><span className="label" style=${{color:'inherit',opacity:.85}}>Workout saved</span><h1 style=${{marginTop:6}}>${s.focus}</h1><p style=${{marginTop:6}}>${fmtDate(s.date)}</p></div></div>
    <div className="stats">
      <div className="stat"><b className="num">${done.length+(cardio?1:0)}</b><span>exercises</span></div>
      <div className="stat"><b className="num">${setsN}</b><span>sets</span></div>
      <div className="stat"><b className="num">${fmtMin(s.durationSec)}</b><span>total time</span></div>
    </div>
    ${s.pbs&&s.pbs.length>0&&html`<div className="card stack" style=${{gap:8}}><h3>New personal bests</h3>${s.pbs.map(p=>html`<div key=${p.exId} className="row between"><b>${p.name}</b><span className="tag rose num">${EXMAP[p.exId].bw?p.r+(EXMAP[p.exId].unit==='sec'?' sec':' reps'):fmtW(p.w)+' kg × '+p.r}</span></div>`)}</div>`}
    <div className="card">${done.map(i=>html`<div key=${i.exId} className="sline"><span>${i.name}</span><span className="num muted">${i.sets.map(x=>(EXMAP[i.exId].bw?'':fmtW(x.w)+'×')+x.r).join('  ')}</span></div>`)}
      ${cardio&&html`<div className="sline"><span>${cardio.name}</span><span className="num muted">${cardio.cardioMin} min</span></div>`}</div>
    ${store==='none'&&html`<div className="notice">This browser cannot store data. Export a backup from Profile before closing the page.</div>`}
    <button type="button" className="btn primary" onClick=${()=>setUi(u=>({...u,screen:'tabs',tab:'history',histTab:'sessions',saved:null,celebrate:null}))}>View history</button>
    <button type="button" className="btn ghost" onClick=${()=>setUi(u=>({...u,screen:'tabs',tab:'home',saved:null,celebrate:null}))}>Back to home</button>
  </div></div>`;
}
