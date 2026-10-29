import { html, useState } from '../react.js';
import { ExCard, ExerciseForm } from '../components/ExerciseCards.js';
import { CARDIO_MINS, CARDIO_TYPES, EQUIP, EX, EXMAP, GROUPS, GROUP_ORDER, cardioOf } from '../data/exercises.js';
import { clamp, fmtW, repsLabel } from '../lib/helpers.js';
import { estMinutes, generatePlan, perfHistory } from '../lib/training.js';
import { Empty, Header, Seg, useCtx } from '../ui/common.js';
import { ExIcon, Icon } from '../ui/icons.js';

export function Build(){
  const {state,update,ui,setUi,beginFromPlan,toast}=useCtx();
  const {builder,plan,sessions}=state;
  const [form,setForm]=useState(null);
  const del=ex=>{
    if(state.active&&state.active.items.some(i=>i.exId===ex.id)){ toast('Finish or discard your current workout first.'); return; }
    update(s=>({...s,custom:s.custom.filter(c=>c.id!==ex.id),plan:s.plan.filter(p=>p.id!==ex.id),builder:{...s.builder,avoidEx:s.builder.avoidEx.filter(x=>x!==ex.id)}}));
    toast('Exercise removed');
  };
  const setB=patch=>update(s=>({...s,builder:{...s.builder,...patch}}));
  const toggleIn=(key,id)=>setB({[key]:builder[key].includes(id)?builder[key].filter(x=>x!==id):[...builder[key],id]});
  const inPlan=id=>plan.some(p=>p.id===id);
  const togglePlan=ex=>update(s=>({...s,plan:inPlan(ex.id)?s.plan.filter(p=>p.id!==ex.id):[...s.plan,{id:ex.id,sets:ex.sets}]}));
  const move=(i,d)=>update(s=>{const p=s.plan.slice(); const j=i+d; if(j<0||j>=p.length) return s; [p[i],p[j]]=[p[j],p[i]]; return {...s,plan:p};});
  const setSets=(i,d)=>update(s=>({...s,plan:s.plan.map((p,k)=>k===i?{...p,sets:clamp(p.sets+d,1,6)}:p)}));
  const remove=i=>update(s=>({...s,plan:s.plan.filter((_,k)=>k!==i)}));
  const generate=()=>{
    const r=generatePlan(builder,sessions);
    if(r.error){ setUi(u=>({...u,genNote:r.error,genErr:true})); return; }
    update(s=>({...s,plan:r.plan}));
    setUi(u=>({...u,genNote:r.note,genErr:false}));
    toast('Workout built: '+r.plan.length+' exercises');
  };
  const visibleGroups=GROUP_ORDER.filter(g=>builder.groups.includes(g));
  const minutes=estMinutes(plan,builder.cardio,builder.cardioMin);
  return html`<div className="stack">
    <${Header} title="Build workout" sub="Set up your session, then generate or pick exercises yourself."/>
    <div className="card stack">
      <div className="field"><span className="label">Time available</span>
        <${Seg} label="Time available" value=${builder.time} onChange=${v=>setB({time:v})} options=${[{v:30,label:'30 min'},{v:45,label:'45 min'},{v:60,label:'60 min'}]}/></div>
      <div className="field"><span className="label">Energy today</span>
        <${Seg} label="Energy today" value=${builder.energy} onChange=${v=>setB({energy:v})} options=${[{v:'low',label:'Low'},{v:'normal',label:'Normal'},{v:'high',label:'High'}]}/>
        ${builder.energy==='low'&&html`<p className="muted small">Low energy: fewer exercises, 2 sets each, no heavy leg presses or squats.</p>`}</div>
      <div className="row between"><div><b>Add cardio</b><div className="muted small">Optional, done at the end. Always skippable.</div></div>
        <button type="button" role="switch" aria-checked=${builder.cardio} aria-label="Add cardio" className=${'chip'+(builder.cardio?' on':'')} onClick=${()=>setB({cardio:!builder.cardio})}>${builder.cardio?'On':'Off'}</button></div>
      ${builder.cardio&&html`<div className="stack" style=${{gap:10}}>
        <div className="chips" role="radiogroup" aria-label="Cardio type">${CARDIO_TYPES.map(c=>html`<button key=${c.id} type="button" role="radio" aria-checked=${builder.cardioType===c.id} className=${'chip'+(builder.cardioType===c.id?' on':'')} onClick=${()=>setB({cardioType:c.id,cardioMin:c.min})}>${c.name}</button>`)}</div>
        <div className="chips" role="radiogroup" aria-label="Cardio minutes">${CARDIO_MINS.map(m=>html`<button key=${m} type="button" role="radio" aria-checked=${builder.cardioMin===m} className=${'chip'+(builder.cardioMin===m?' on':'')} onClick=${()=>setB({cardioMin:m})}>${m} min</button>`)}</div>
      </div>`}
    </div>
    <div className="stack" style=${{gap:10}}>
      <span className="label">Muscle groups to train</span>
      <div className="tiles">${GROUP_ORDER.map(g=>{const on=builder.groups.includes(g); return html`
        <button key=${g} type="button" aria-pressed=${on} className=${'tile'+(on?' on':'')} onClick=${()=>toggleIn('groups',g)}>
          <span className="tick">${on&&html`<${Icon} name="check" size=${14}/>`}</span><b>${GROUPS[g].name}</b><span className="muted small">${GROUPS[g].blurb}</span></button>`;})}</div>
    </div>
    <div className="card flat"><details>
      <summary><span>Avoid equipment or exercises ${(builder.avoidEquip.length+builder.avoidEx.length)?html`<span className="tag rose">${builder.avoidEquip.length+builder.avoidEx.length}</span>`:null}</span><${Icon} name="down" size=${18}/></summary>
      <div className="stack" style=${{marginTop:8}}>
        <span className="label">Equipment</span>
        <div className="chips">${EQUIP.map(e=>html`<button key=${e.id} type="button" aria-pressed=${builder.avoidEquip.includes(e.id)} className=${'chip x'+(builder.avoidEquip.includes(e.id)?' on':'')} onClick=${()=>toggleIn('avoidEquip',e.id)}>${builder.avoidEquip.includes(e.id)?'Avoiding ':''}${e.name}</button>`)}</div>
        <span className="label">Single exercises</span>
        <div className="chips">${EX.map(e=>html`<button key=${e.id} type="button" aria-pressed=${builder.avoidEx.includes(e.id)} className=${'chip x'+(builder.avoidEx.includes(e.id)?' on':'')} onClick=${()=>toggleIn('avoidEx',e.id)}>${e.name}</button>`)}</div>
      </div></details></div>
    <button type="button" className="btn primary" onClick=${generate}>Generate my workout</button>
    ${ui.genNote&&html`<div className=${'notice'+(ui.genErr?'':' ok')} role="status">${ui.genNote}</div>`}

    <div className="card stack" style=${{gap:6}}>
      <div className="row between"><h2>Today's workout</h2>${plan.length||builder.cardio?html`<span className="tag num">about ${minutes} min</span>`:null}</div>
      ${plan.length===0&&!builder.cardio?html`<p className="muted">Nothing yet. Tap Generate, or add exercises below.</p>`:html`<div>
        ${plan.map((p,i)=>{const ex=EXMAP[p.id]; return html`<div key=${p.id} className="plan-item">
          <span className="tag num">${i+1}</span>
          <div className="grow"><b>${ex.name}</b><div className="muted small num">${p.sets} × ${repsLabel(ex)}${ex.note?' '+ex.note:''}</div></div>
          <div className="row" style=${{gap:4}}>
            <span className="stepper"><button type="button" aria-label=${'Fewer sets of '+ex.name} onClick=${()=>setSets(i,-1)}><${Icon} name="minus" size=${14}/></button><span className="num">${p.sets} sets</span><button type="button" aria-label=${'More sets of '+ex.name} onClick=${()=>setSets(i,1)}><${Icon} name="plus" size=${14}/></button></span>
            <button type="button" className="icon-btn sm" aria-label=${'Move '+ex.name+' up'} disabled=${i===0} onClick=${()=>move(i,-1)}><${Icon} name="up" size=${16}/></button>
            <button type="button" className="icon-btn sm" aria-label=${'Move '+ex.name+' down'} disabled=${i===plan.length-1} onClick=${()=>move(i,1)}><${Icon} name="down" size=${16}/></button>
            <button type="button" className="icon-btn sm" aria-label=${'Remove '+ex.name} onClick=${()=>remove(i)}><${Icon} name="x" size=${16}/></button>
          </div></div>`;})}
        ${builder.cardio&&html`<div className="plan-item"><span className="tag">+</span><div className="grow"><b>${cardioOf(builder.cardioType).name}</b><div className="muted small">${builder.cardioMin} min, optional</div></div><span></span></div>`}
      </div>`}
    </div>

    <div className="row between" style=${{marginTop:6}}><h2>Exercise library</h2><button type="button" className="btn primary sm" onClick=${()=>setForm({})}><${Icon} name="plus" size=${16}/> Add exercise</button></div>
    ${visibleGroups.length===0&&html`<${Empty} title="No muscle groups selected" text="Tap a group above to see its exercises."/>`}
    ${visibleGroups.map(g=>html`<div key=${g} className="stack" style=${{gap:10}}>
      <div className="row between"><span className="label">${GROUPS[g].name}</span><span className="muted small">${plan.filter(p=>EXMAP[p.id].g===g).length} added</span></div>
      ${EX.filter(e=>e.g===g).map(ex=>html`<${ExCard} key=${ex.id} ex=${ex} inPlan=${inPlan(ex.id)} onToggle=${()=>togglePlan(ex)} onEdit=${()=>setForm({initial:ex})} onDelete=${()=>del(ex)}/>`)}
    </div>`)}
    <div className="stack" style=${{gap:10}}>
      <div className="row between"><span className="label">Cardio (optional)</span><span className="muted small">${builder.cardio?cardioOf(builder.cardioType).name+', '+builder.cardioMin+' min':'None added'}</span></div>
      ${CARDIO_TYPES.map(c=>{ const on=builder.cardio&&builder.cardioType===c.id; return html`<div key=${c.id} className=${'card ex'+(on?' sel':'')}><${ExIcon} id=${c.id}/>
        <div className="stack" style=${{gap:6}}><div><b>${c.name}</b><div className="muted small">Suggested ${c.min} min</div></div><p className="small">${c.cue}</p>
        <button type="button" aria-pressed=${on} className=${'chip'+(on?' on':'')} style=${{alignSelf:'flex-start'}} onClick=${()=>setB(on?{cardio:false}:{cardio:true,cardioType:c.id,cardioMin:c.min})}><${Icon} name=${on?'check':'plus'} size=${16}/>${on?'In workout':'Add to workout'}</button></div></div>`; })}
    </div>
    ${form&&html`<${ExerciseForm} initial=${form.initial} onClose=${()=>setForm(null)}/>`}
  </div>`;
}

export function newActiveItem(exId,sessions,sets){
  const ex=EXMAP[exId]; const last=perfHistory(exId,sessions)[0]; const n=sets||ex.sets;
  return {exId,planned:n,skipped:false,sets:Array.from({length:n},(_,i)=>{
    const ref=last?(last.sets[i]||last.sets[last.sets.length-1]):null;
    return {w:ex.bw?'0':(ref?fmtW(ref.w):''),r:ref?String(ref.r):String(ex.reps[0]),done:false,err:''};
  })};
}
