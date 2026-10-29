import { html, useState } from '../react.js';
import { EQUIP, EX, GROUPS, GROUP_ORDER, cleanCustom } from '../data/exercises.js';
import { cleanNum, setsLabel, uid } from '../lib/helpers.js';
import { Seg, useCtx } from '../ui/common.js';
import { ExIcon, Icon } from '../ui/icons.js';

export function ExCard({ex,inPlan,onToggle,onEdit,onDelete}){
  const [ask,setAsk]=useState(false);
  return html`<div className=${'card ex'+(inPlan?' sel':'')}>
    <${ExIcon} id=${ex.id}/>
    <div className="stack" style=${{gap:6}}>
      <div><div className="row" style=${{gap:6,flexWrap:'wrap'}}><b>${ex.name}</b>${ex.custom&&html`<span className="tag">Yours</span>`}</div><div className="muted small num">${setsLabel(ex)}</div></div>
      <p className="small">${ex.cue}</p>
      <div className="row" style=${{flexWrap:'wrap'}}>
        <button type="button" aria-pressed=${inPlan} className=${'chip'+(inPlan?' on':'')} onClick=${onToggle}>
          <${Icon} name=${inPlan?'check':'plus'} size=${16}/>${inPlan?'In workout':'Add to workout'}</button>
        ${ex.custom&&!ask&&html`<button type="button" className="chip" onClick=${onEdit}>Edit</button><button type="button" className="chip" onClick=${()=>setAsk(true)}>Delete</button>`}
        ${ex.custom&&ask&&html`<button type="button" className="chip on" onClick=${onDelete}>Delete for good</button><button type="button" className="chip" onClick=${()=>setAsk(false)}>Cancel</button>`}
      </div>
    </div>
  </div>`;
}

export function ExerciseForm({initial,onClose}){
  const {update,toast}=useCtx();
  const edit=!!initial;
  const [f,setF]=useState(()=>initial?{name:initial.name,g:initial.g,equip:initial.tags[0]||'other',sets:String(initial.sets),lo:String(initial.reps[0]),hi:String(initial.reps[1]),unit:initial.unit,bw:!!initial.bw,cue:initial.cue||''}
    :{name:'',g:'back',equip:'dumbbell',sets:'3',lo:'10',hi:'12',unit:'reps',bw:false,cue:''});
  const [err,setErr]=useState({});
  const set=p=>setF(x=>({...x,...p}));
  const save=()=>{
    const e={}, name=f.name.trim(), lo=parseInt(f.lo), hi=parseInt(f.hi), sets=parseInt(f.sets);
    if(!name) e.name='Give the exercise a name.';
    else if(EX.some(x=>x.id!==(initial&&initial.id)&&x.name.toLowerCase()===name.toLowerCase())) e.name='You already have an exercise with this name.';
    if(!(sets>=1&&sets<=6)) e.sets='Use 1 to 6 sets.';
    if(!(lo>=1)) e.lo='Lowest must be at least 1.';
    if(!(hi>=lo)) e.hi='Highest must be at least the lowest.';
    else if(hi>(f.unit==='sec'?600:100)) e.hi='That looks too high.';
    setErr(e);
    if(Object.keys(e).length) return;
    const ex=cleanCustom({id:edit?initial.id:'c-'+uid(),g:f.g,name,sets,reps:[lo,hi],unit:f.unit,cue:f.cue.trim()||'Controlled reps. Stop 1–2 reps before your form breaks.',tags:[f.equip],bw:f.bw});
    update(s=>({...s,custom:edit?s.custom.map(c=>c.id===ex.id?ex:c):[...s.custom,ex]}));
    toast(edit?'Exercise updated':'Added to your library');
    onClose();
  };
  return html`<div className="sheet-bg" onClick=${e=>{if(e.target===e.currentTarget)onClose();}}><div className="sheet" role="dialog" aria-modal="true" aria-label=${edit?'Edit exercise':'Add exercise'}>
    <h2>${edit?'Edit exercise':'Add your own exercise'}</h2>
    <div className="field"><label htmlFor="cx-name">Name</label><input id="cx-name" className=${'input'+(err.name?' bad':'')} style=${{fontSize:16}} maxLength="40" placeholder="e.g. Dumbbell Romanian deadlift" value=${f.name} onChange=${e=>set({name:e.target.value})}/>${err.name&&html`<span className="err" role="alert">${err.name}</span>`}</div>
    <div className="field"><span className="label">Muscle group</span><${Seg} label="Muscle group" value=${f.g} onChange=${v=>set({g:v})} options=${GROUP_ORDER.map(g=>({v:g,label:GROUPS[g].short}))}/></div>
    <div className="field"><span className="label">Equipment</span><div className="chips" role="radiogroup" aria-label="Equipment">${EQUIP.map(q=>html`<button key=${q.id} type="button" role="radio" aria-checked=${f.equip===q.id} className=${'chip'+(f.equip===q.id?' on':'')} onClick=${()=>set({equip:q.id})}>${q.name}</button>`)}</div></div>
    <div className="field"><span className="label">Counted in</span><${Seg} label="Counted in" value=${f.unit} onChange=${v=>set({unit:v,lo:v==='sec'?'30':'10',hi:v==='sec'?'45':'12'})} options=${[{v:'reps',label:'Reps'},{v:'sec',label:'Seconds'}]}/></div>
    <div className="row" style=${{alignItems:'flex-start'}}>
      <div className="field grow"><label htmlFor="cx-sets">Sets</label><input id="cx-sets" className=${'input'+(err.sets?' bad':'')} inputMode="numeric" value=${f.sets} onChange=${e=>set({sets:cleanNum(e.target.value).replace('.','')})}/>${err.sets&&html`<span className="err">${err.sets}</span>`}</div>
      <div className="field grow"><label htmlFor="cx-lo">${f.unit==='sec'?'Min sec':'Min reps'}</label><input id="cx-lo" className=${'input'+(err.lo?' bad':'')} inputMode="numeric" value=${f.lo} onChange=${e=>set({lo:cleanNum(e.target.value).replace('.','')})}/>${err.lo&&html`<span className="err">${err.lo}</span>`}</div>
      <div className="field grow"><label htmlFor="cx-hi">${f.unit==='sec'?'Max sec':'Max reps'}</label><input id="cx-hi" className=${'input'+(err.hi?' bad':'')} inputMode="numeric" value=${f.hi} onChange=${e=>set({hi:cleanNum(e.target.value).replace('.','')})}/>${err.hi&&html`<span className="err">${err.hi}</span>`}</div>
    </div>
    <div className="row between"><div><b>Bodyweight only</b><div className="muted small">Skips the weight box when logging</div></div>
      <button type="button" role="switch" aria-checked=${f.bw} aria-label="Bodyweight only" className=${'chip'+(f.bw?' on':'')} onClick=${()=>set({bw:!f.bw})}>${f.bw?'On':'Off'}</button></div>
    <div className="field"><label htmlFor="cx-cue">Form cue (optional)</label><input id="cx-cue" className="input" style=${{fontSize:16}} maxLength="140" placeholder="One short tip for yourself" value=${f.cue} onChange=${e=>set({cue:e.target.value})}/></div>
    <button type="button" className="btn primary" onClick=${save}>${edit?'Save changes':'Add to library'}</button>
    <button type="button" className="btn ghost" onClick=${onClose}>Cancel</button>
  </div></div>`;
}
