import { html, useState } from '../react.js';
import { CARDIO_TYPES, EX, EXMAP, GROUPS, GROUP_ORDER, cardioOf } from '../data/exercises.js';
import { cleanNum, dkey, fmtDate, fmtMin, fmtW, num } from '../lib/helpers.js';
import { computePBs } from '../lib/training.js';
import { useCtx } from '../ui/common.js';
import { Icon } from '../ui/icons.js';

export function ExercisePicker({onPick,onClose,title}){
  return html`<div className="sheet-bg" style=${{zIndex:60}} onClick=${e=>{if(e.target===e.currentTarget)onClose();}}><div className="sheet" role="dialog" aria-modal="true" aria-label=${title||'Add exercise'}>
    <div className="row between"><h2>${title||'Add exercise'}</h2><button type="button" className="icon-btn" aria-label="Close" onClick=${onClose}><${Icon} name="x"/></button></div>
    ${GROUP_ORDER.map(g=>html`<div key=${g} className="stack" style=${{gap:6}}><span className="label">${GROUPS[g].name}</span>
      ${EX.filter(e=>e.g===g).map(e=>html`<button key=${e.id} type="button" className="btn ghost" style=${{justifyContent:'space-between',textAlign:'left'}} onClick=${()=>onPick({exId:e.id})}><span>${e.name}</span><span className="muted small num">${e.sets} × ${e.reps[0]}–${e.reps[1]}</span></button>`)}</div>`)}
    <div className="stack" style=${{gap:6}}><span className="label">Cardio</span>
      ${CARDIO_TYPES.map(c=>html`<button key=${c.id} type="button" className="btn ghost" style=${{justifyContent:'space-between',textAlign:'left'}} onClick=${()=>onPick({cardio:c.id})}><span>${c.name}</span><span className="muted small num">${c.min} min</span></button>`)}</div>
  </div></div>`;
}

export function EditSession({s,onClose}){
  const {state,update,toast}=useCtx();
  const [d,setD]=useState(()=>({date:dkey(s.date),mins:String(Math.round((s.durationSec||0)/60)),
    items:s.items.map(i=>({...i,sets:(i.sets||[]).map(x=>({w:String(x.w),r:String(x.r)})),cardioMin:i.cardioMin?String(i.cardioMin):''}))}));
  const [err,setErr]=useState(''); const [picker,setPicker]=useState(false);
  const addPick=pick=>{
    const it=pick.cardio?{exId:'cardio',ctype:pick.cardio,name:cardioOf(pick.cardio).name,group:'cardio',setsPlanned:1,skipped:false,sets:[],cardioMin:String(cardioOf(pick.cardio).min)}
      :(()=>{ const ex=EXMAP[pick.exId]; return {exId:ex.id,name:ex.name,group:ex.g,setsPlanned:1,skipped:false,sets:[{w:ex.bw?'0':'',r:String(ex.reps[0])}],cardioMin:''}; })();
    setD(x=>({...x,items:[...x.items,it]})); setPicker(false);
  };
  const setItem=(k,fn)=>setD(x=>({...x,items:x.items.map((it,j)=>j===k?fn(it):it)}));
  const save=()=>{
    const mins=num(d.mins);
    if(!(mins>=0&&mins<=600)){ setErr('Session length should be 0–600 minutes.'); return; }
    if(!d.date){ setErr('Pick the date of the workout.'); return; }
    const items=[];
    for(const it of d.items){
      if(it.exId==='cardio'){ const m=num(it.cardioMin); if(it.cardioMin!==''&&!(m>0&&m<=600)){ setErr('Check the cardio minutes.'); return; } if(m>0) items.push({...it,cardioMin:m,sets:[]}); continue; }
      const ex=EXMAP[it.exId]; const sets=[];
      for(const x of it.sets){
        const w=num(x.w), r=num(x.r);
        if(!(r>0)||r>999||(!(ex&&ex.bw)&&!(w>0&&w<=400))){ setErr('Check the numbers for '+it.name+'. Each set needs reps'+(ex&&ex.bw?'':' and a weight')+'.'); return; }
        sets.push({w:ex&&ex.bw?0:w,r});
      }
      items.push({...it,sets,cardioMin:undefined});
    }
    if(!items.some(i=>i.sets.length||i.cardioMin)){ setErr('Keep at least one completed set, or delete the session instead.'); return; }
    const old=new Date(s.date); const [y,m,dd]=d.date.split('-').map(Number);
    const when=new Date(y,m-1,dd,old.getHours(),old.getMinutes()).toISOString();
    const done=items.filter(i=>i.sets.length);
    const gs=GROUP_ORDER.filter(g=>done.some(i=>(EXMAP[i.exId]?EXMAP[i.exId].g:i.group)===g));
    const focus=gs.map(g=>GROUPS[g].short).concat(items.some(i=>i.cardioMin)?['Cardio']:[]).join(' · ')||s.focus;
    const prior=state.sessions.filter(x=>x.id!==s.id&&new Date(x.date)<new Date(when));
    const next={...s,date:when,focus,durationSec:Math.round(mins*60),items,pbs:s.sample?[]:computePBs(done,prior)};
    update(st=>({...st,sessions:st.sessions.map(x=>x.id===s.id?next:x)}));
    toast('Workout updated'); onClose();
  };
  return html`<div className="stack" style=${{gap:10,marginTop:6}}>
    <div className="row" style=${{alignItems:'flex-start'}}>
      <div className="field grow"><label htmlFor=${'ed-date-'+s.id}>Date</label><input id=${'ed-date-'+s.id} className="input" type="date" max=${dkey(new Date())} value=${d.date} onChange=${e=>setD({...d,date:e.target.value})}/></div>
      <div className="field grow"><label htmlFor=${'ed-min-'+s.id}>Minutes</label><input id=${'ed-min-'+s.id} className="input" inputMode="numeric" value=${d.mins} onChange=${e=>setD({...d,mins:cleanNum(e.target.value)})}/></div>
    </div>
    ${d.items.map((it,k)=>{ const ex=EXMAP[it.exId];
      if(it.exId==='cardio') return html`<div key=${k} className="stack" style=${{gap:6,borderTop:'1px solid var(--line)',paddingTop:8}}>
        <div className="row between"><b>${it.name}</b><button type="button" className="chip" aria-label=${'Remove '+it.name} onClick=${()=>setD(x=>({...x,items:x.items.filter((_,j)=>j!==k)}))}>Remove</button></div>
        <div className="field"><label htmlFor=${'ed-c-'+s.id+k}>Minutes</label><input id=${'ed-c-'+s.id+k} className="input" inputMode="numeric" value=${it.cardioMin} onChange=${e=>setItem(k,x=>({...x,cardioMin:cleanNum(e.target.value)}))}/></div></div>`;
      return html`<div key=${k} className="stack" style=${{gap:6,borderTop:'1px solid var(--line)',paddingTop:8}}>
        <div className="row between"><b>${it.name}</b><button type="button" className="chip" onClick=${()=>setD(x=>({...x,items:x.items.filter((_,j)=>j!==k)}))}>Remove</button></div>
        ${it.skipped&&!it.sets.length?html`<p className="muted small">Skipped</p>`:null}
        ${it.sets.map((x,j)=>html`<div key=${j} className="set" style=${{gridTemplateColumns:'28px 1fr 1fr 44px'}}>
          <span className="n num">${j+1}</span>
          ${ex&&ex.bw?html`<span className="muted small" style=${{textAlign:'center'}}>Bodyweight</span>`:html`<input className="input" inputMode="decimal" aria-label=${it.name+' set '+(j+1)+' weight'} value=${x.w} onChange=${e=>setItem(k,y=>({...y,sets:y.sets.map((z,m)=>m===j?{...z,w:cleanNum(e.target.value)}:z)}))}/>`}
          <input className="input" inputMode="numeric" aria-label=${it.name+' set '+(j+1)+' reps'} value=${x.r} onChange=${e=>setItem(k,y=>({...y,sets:y.sets.map((z,m)=>m===j?{...z,r:cleanNum(e.target.value).replace('.','')}:z)}))}/>
          <button type="button" className="icon-btn sm" aria-label=${'Delete set '+(j+1)+' of '+it.name} onClick=${()=>setItem(k,y=>({...y,sets:y.sets.filter((_,m)=>m!==j)}))}><${Icon} name="x" size=${16}/></button>
        </div>`)}
        <button type="button" className="btn ghost sm" style=${{alignSelf:'flex-start'}} onClick=${()=>setItem(k,y=>{const l=y.sets[y.sets.length-1]; return {...y,sets:[...y.sets,{w:l?l.w:'',r:l?l.r:''}]};})}><${Icon} name="plus" size=${16}/> Set</button>
      </div>`; })}
    <button type="button" className="btn ghost sm" style=${{alignSelf:'flex-start'}} onClick=${()=>setPicker(true)}><${Icon} name="plus" size=${16}/> Add exercise</button>
    ${picker&&html`<${ExercisePicker} onPick=${addPick} onClose=${()=>setPicker(false)}/>`}
    ${err&&html`<div className="err" role="alert">${err}</div>`}
    <div className="row"><button type="button" className="btn primary grow" onClick=${save}>Save changes</button><button type="button" className="btn ghost grow" onClick=${onClose}>Cancel</button></div>
  </div>`;
}

export function SessionCard({s}){
  const {update,toast}=useCtx();
  const [open,setOpen]=useState(false); const [confirm,setConfirm]=useState(false); const [edit,setEdit]=useState(false);
  const done=s.items.filter(i=>(i.sets&&i.sets.length)||i.cardioMin);
  return html`<div className="card stack" style=${{gap:8}}>
    <button type="button" style=${{border:0,background:'transparent',textAlign:'left',padding:0,minHeight:48}} aria-expanded=${open} onClick=${()=>setOpen(!open)}>
      <div className="row between"><b>${s.focus}</b><span className="muted small">${fmtDate(s.date)}</span></div>
      <div className="row" style=${{gap:6,marginTop:4,flexWrap:'wrap'}}>
        <span className="muted small">${done.length} exercises · ${fmtMin(s.durationSec||0)}</span>
        ${s.sample&&html`<span className="tag warn">Example</span>`}
        ${s.pbs&&s.pbs.length>0&&html`<span className="tag rose">${s.pbs.length} PB${s.pbs.length>1?'s':''}</span>`}
      </div>
    </button>
    ${open&&edit&&html`<${EditSession} s=${s} onClose=${()=>setEdit(false)}/>`}
    ${open&&!edit&&html`<div>
      ${s.items.map((i,k)=>{ const ex=EXMAP[i.exId]; const pb=s.pbs&&s.pbs.find(p=>p.exId===i.exId);
        if(i.exId==='cardio') return i.cardioMin?html`<div key=${k} className="sline"><span>${i.name}</span><span className="num muted">${i.cardioMin} min</span></div>`:null;
        return html`<div key=${k} className="sline"><span>${i.name} ${pb&&html`<span className="tag rose">PB</span>`}</span>
          <span className="num muted" style=${{textAlign:'right'}}>${i.skipped?'Skipped':i.sets.length?i.sets.map(x=>(ex&&ex.bw?'':fmtW(x.w)+'×')+x.r).join('  '):'Not done'}</span></div>`; })}
      ${confirm?html`<div className="row" style=${{marginTop:10}}><button type="button" className="btn danger sm grow" onClick=${()=>{update(st=>({...st,sessions:st.sessions.filter(x=>x.id!==s.id)}));toast('Session deleted');}}>Delete for good</button><button type="button" className="btn ghost sm grow" onClick=${()=>setConfirm(false)}>Cancel</button></div>`
        :html`<div className="row" style=${{marginTop:10}}><button type="button" className="btn ghost sm grow" onClick=${()=>setEdit(true)}>Edit workout</button><button type="button" className="btn ghost sm grow" onClick=${()=>setConfirm(true)}>Delete</button></div>`}
    </div>`}
  </div>`;
}
