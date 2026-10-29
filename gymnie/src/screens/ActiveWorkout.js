import { html, useEffect, useRef, useState } from '../react.js';
import { CARDIO_TYPES, EX, EXMAP, GROUPS, GROUP_ORDER, cardioOf } from '../data/exercises.js';
import { cleanNum, fmtClock, fmtDate, fmtMin, fmtW, num, setsLabel, uid } from '../lib/helpers.js';
import { newlyAchieved } from '../lib/milestones.js';
import { computePBs, perfHistory, suggestion } from '../lib/training.js';
import { newActiveItem } from './Build.js';
import { useCtx } from '../ui/common.js';
import { ExIcon, Icon } from '../ui/icons.js';

export function beep(){
  try{ const C=window.AudioContext||window.webkitAudioContext; const c=new C(); const o=c.createOscillator(); const g=c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value=880; g.gain.value=.15; o.start(); o.stop(c.currentTime+.3); setTimeout(()=>{try{c.close();}catch(e){}},600);}catch(e){}
  try{ navigator.vibrate&&navigator.vibrate([200,100,200]); }catch(e){}
}

export function itemStatus(it){
  if(it.skipped) return 'skipped';
  if(it.kind==='cardio') return it.done?'done':'todo';
  if(it.sets.every(s=>s.done)) return 'done';
  return it.sets.some(s=>s.done)?'partial':'todo';
}

export function validateSet(ex,s){
  const r=num(s.r), w=num(s.w);
  if(!(r>0)) return 'Enter '+(ex.unit==='sec'?'seconds':'reps')+' first.';
  if(r>(ex.unit==='sec'?900:200)) return 'That looks too high. Check the number.';
  if(!ex.bw){ if(!(w>0)) return 'Enter the weight in kg first.'; if(w>400) return 'That looks too heavy. Check the number.'; }
  return '';
}

export function PerfHint({exId}){
  const {state}=useCtx();
  const hist=perfHistory(exId,state.sessions); const sg=suggestion(exId,state.sessions); const ex=EXMAP[exId];
  const last=hist[0];
  return html`<div className="stack" style=${{gap:6,padding:'0 14px 10px'}}>
    ${last&&html`<p className="small muted num">Last time (${fmtDate(last.date)}): ${last.sets.map(s=>(ex.bw?'':fmtW(s.w)+'kg × ')+s.r).join(', ')}</p>`}
    <p className=${'small'+(sg.kind==='up'?'':' muted')}>${sg.kind==='up'?html`<span className="tag" style=${{marginRight:6}}>Progress</span>`:null}${sg.text}</p>
  </div>`;
}

export function SetRow({ex,s,i,onChange,onToggle}){
  const idp='s-'+ex.id+'-'+i;
  return html`<div className="stack" style=${{gap:4}}>
    <div className=${'set'+(s.done?' done':'')}>
      <span className="n num">${i+1}</span>
      ${ex.bw?html`<span className="muted small" style=${{textAlign:'center'}}>Bodyweight</span>`
        :html`<input id=${idp+'-w'} className=${'input'+(s.err?' bad':'')} inputMode="decimal" aria-label=${'Set '+(i+1)+' weight in kilograms'} placeholder="kg" value=${s.w} onChange=${e=>onChange({w:cleanNum(e.target.value),err:''})}/>`}
      <input id=${idp+'-r'} className=${'input'+(s.err?' bad':'')} inputMode="numeric" aria-label=${'Set '+(i+1)+(ex.unit==='sec'?' seconds':' reps')} placeholder=${ex.unit==='sec'?'sec':String(ex.reps[0])} value=${s.r} onChange=${e=>onChange({r:cleanNum(e.target.value).replace('.',''),err:''})}/>
      <button type="button" role="checkbox" aria-checked=${s.done} aria-label=${'Mark set '+(i+1)+' complete'} className=${'cbx'+(s.done?' on':'')} onClick=${onToggle}>${s.done&&html`<${Icon} name="check" size=${26}/>`}</button>
    </div>
    ${s.err&&html`<div className="err" role="alert">${s.err}</div>`}
  </div>`;
}

export function ActiveWorkout(){
  const {state,update,setUi,startRestRef,toast}=useCtx();
  const act=state.active;
  const [openIdx,setOpenIdx]=useState(()=>{const i=act.items.findIndex(x=>itemStatus(x)==='todo'||itemStatus(x)==='partial'); return i<0?0:i;});
  const [now,setNow]=useState(Date.now());
  const [sheet,setSheet]=useState(false);
  const [blocked,setBlocked]=useState(''); const [rm,setRm]=useState(-1);
  const [adding,setAdding]=useState(false);
  const [rest,setRest]=useState({total:state.settings.rest,left:state.settings.rest,running:false,finished:false});
  const endRef=useRef(0);
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(id);},[]);
  useEffect(()=>{
    if(!rest.running) return;
    const id=setInterval(()=>{
      const left=Math.max(0,Math.ceil((endRef.current-Date.now())/1000));
      if(left<=0){ beep(); setRest(r=>({...r,left:0,running:false,finished:true})); }
      else setRest(r=>r.left===left?r:{...r,left});
    },250);
    return ()=>clearInterval(id);
  },[rest.running]);
  const startRest=(secs)=>setRest(r=>{const left=secs||(r.left>0?r.left:r.total); endRef.current=Date.now()+left*1000; return {...r,left,running:true,finished:false};});
  const pauseRest=()=>setRest(r=>({...r,running:false}));
  const resetRest=()=>setRest(r=>({...r,left:r.total,running:false,finished:false}));
  const setTotal=t=>setRest(r=>({total:t,left:t,running:false,finished:false}));
  useEffect(()=>{ startRestRef.current=()=>{ if(state.settings.autoRest) setRest(r=>{endRef.current=Date.now()+r.total*1000; return {...r,left:r.total,running:true,finished:false};}); }; });

  const items=act.items;
  const commit=next=>update(s=>({...s,active:{...s.active,items:next}}));
  const patchItem=(i,fn)=>commit(items.map((it,k)=>k===i?fn(it):it));
  const nextTodo=(list,from)=>{ for(let k=1;k<=list.length;k++){ const j=(from+k)%list.length; const st=itemStatus(list[j]); if(st==='todo'||st==='partial') return j; } return -1; };
  const toggleSet=(i,j)=>{
    const it=items[i], ex=EXMAP[it.exId], s=it.sets[j];
    if(s.done){ patchItem(i,x=>({...x,sets:x.sets.map((y,k)=>k===j?{...y,done:false}:y)})); return; }
    const err=validateSet(ex,s);
    if(err){ patchItem(i,x=>({...x,sets:x.sets.map((y,k)=>k===j?{...y,err}:y)})); return; }
    const updated=items.map((x,k)=>k===i?{...x,skipped:false,sets:x.sets.map((y,m)=>m===j?{...y,done:true,err:''}:y)}:x);
    commit(updated);
    if(updated[i].sets.every(y=>y.done)){ const nx=nextTodo(updated,i); setOpenIdx(nx); } else startRestRef.current&&startRestRef.current();
    if(updated[i].sets.every(y=>y.done)) startRestRef.current&&startRestRef.current();
  };
  const toggleAll=i=>{
    const it=items[i];
    if(it.kind==='cardio'){ patchItem(i,x=>({...x,done:!x.done,skipped:false})); return; }
    const ex=EXMAP[it.exId];
    if(it.sets.every(s=>s.done)){ patchItem(i,x=>({...x,sets:x.sets.map(s=>({...s,done:false}))})); return; }
    let bad=false;
    const sets=it.sets.map(s=>{ if(s.done) return s; const err=validateSet(ex,s); if(err){bad=true; return {...s,err};} return {...s,done:true,err:''}; });
    const updated=items.map((x,k)=>k===i?{...x,skipped:false,sets}:x);
    commit(updated);
    if(bad) setOpenIdx(i); else { setOpenIdx(nextTodo(updated,i)); startRestRef.current&&startRestRef.current(); }
  };
  const setField=(i,j,patch)=>patchItem(i,x=>({...x,sets:x.sets.map((y,k)=>k===j?{...y,...patch}:y)}));
  const addSet=i=>patchItem(i,x=>{const l=x.sets[x.sets.length-1]; return {...x,sets:[...x.sets,{w:l?l.w:'',r:l?l.r:'',done:false,err:''}]};});
  const dropSet=i=>patchItem(i,x=>x.sets.length>1&&!x.sets[x.sets.length-1].done?{...x,sets:x.sets.slice(0,-1)}:x);
  const moveItem=(i,dir)=>{ const j=i+dir; if(j<0||j>=items.length) return; const n=items.slice(); [n[i],n[j]]=[n[j],n[i]]; commit(n); setOpenIdx(j); setRm(-1); };
  const removeItem=i=>{
    const it=items[i]; const hasDone=it.kind==='cardio'?it.done:it.sets.some(x=>x.done);
    if(hasDone&&rm!==i){ setRm(i); return; }
    commit(items.filter((_,k)=>k!==i)); setRm(-1); setOpenIdx(-1);
  };
  const manage=i=>html`<div className="row" style=${{marginTop:8}}>
    <button type="button" className="btn ghost sm grow" disabled=${i===0} onClick=${()=>moveItem(i,-1)}><${Icon} name="up" size=${16}/> Up</button>
    <button type="button" className="btn ghost sm grow" disabled=${i===items.length-1} onClick=${()=>moveItem(i,1)}><${Icon} name="down" size=${16}/> Down</button>
    <button type="button" className=${'btn sm grow '+(rm===i?'danger':'ghost')} onClick=${()=>removeItem(i)}>${rm===i?'Tap to confirm':'Remove'}</button>
  </div>`;
  const skip=i=>{ const updated=items.map((x,k)=>k===i?{...x,skipped:!x.skipped}:x); commit(updated); if(updated[i].skipped) setOpenIdx(nextTodo(updated,i)); };

  const finished=items.filter(x=>{const s=itemStatus(x); return s==='done';}).length;
  const skipped=items.filter(x=>x.skipped).length;
  const pct=items.length?(finished+skipped)/items.length*100:0;
  const setsDone=items.reduce((a,x)=>a+(x.kind==='cardio'?0:x.sets.filter(s=>s.done).length),0);
  const cardioDone=items.some(x=>x.kind==='cardio'&&x.done&&!x.skipped);
  const elapsed=Math.round((now-act.startedAt)/1000);
  const volume=items.reduce((a,x)=>a+(x.kind==='cardio'||EXMAP[x.exId].bw||EXMAP[x.exId].unit==='sec'?0:x.sets.filter(s=>s.done).reduce((b,s)=>b+num(s.w)*num(s.r),0)),0);

  const buildSession=()=>{
    const arr=items.map(x=>{
      if(x.kind==='cardio') return {exId:'cardio',ctype:x.ctype,name:cardioOf(x.ctype).name,group:'cardio',setsPlanned:1,skipped:x.skipped,sets:[],cardioMin:x.done&&!x.skipped?(num(x.minutes)||cardioOf(x.ctype).min):0};
      const ex=EXMAP[x.exId];
      return {exId:x.exId,name:ex.name,group:ex.g,setsPlanned:x.planned,skipped:x.skipped,sets:x.skipped?[]:x.sets.filter(s=>s.done).map(s=>({w:ex.bw?0:num(s.w),r:num(s.r)}))};
    });
    const done=arr.filter(a=>a.sets.length);
    const gs=GROUP_ORDER.filter(g=>done.some(a=>a.group===g));
    return {id:uid(),date:new Date(act.startedAt).toISOString(),focus:(gs.map(g=>GROUPS[g].short).concat(arr.some(a=>a.cardioMin)?['Cardio']:[]).join(' · ')||'Cardio'),durationSec:elapsed,items:arr.filter(a=>a.sets.length||a.cardioMin),
      pbs:computePBs(done,state.sessions)};
  };
  const save=()=>{
    if(setsDone===0&&!cardioDone){ setBlocked('Log at least one set before saving, or discard this workout.'); return; }
    const sess=buildSession();
    const cel=newlyAchieved(state.sessions,[sess,...state.sessions],state.profile.weeklyGoal);
    update(s=>({...s,sessions:[sess,...s.sessions],active:null,plan:[]}));
    setUi(u=>({...u,screen:'saved',saved:sess,celebrate:cel,genNote:''}));
  };
  const discard=()=>{ update(s=>({...s,active:null})); setUi(u=>({...u,screen:'tabs',tab:'home'})); toast('Workout discarded'); };

  const rp=rest.total?(1-rest.left/rest.total)*100:0;
  return html`<div className="app working">
    <div className="a-head">
      <div className="row between">
        <button type="button" className="icon-btn" aria-label="Back to home (workout keeps running)" onClick=${()=>setUi(u=>({...u,screen:'tabs',tab:'home'}))}><${Icon} name="left"/></button>
        <div className="grow" style=${{textAlign:'center'}}><div className="label">Elapsed</div><b className="num" style=${{fontSize:20}}>${fmtClock(elapsed)}</b></div>
        <button type="button" className="btn primary sm" style=${{minHeight:44}} onClick=${()=>{setBlocked('');setSheet(true);}}>Finish</button>
      </div>
      <div className="stack" style=${{gap:6}}>
        <div className="row between"><b className="num">${finished} of ${items.length} exercises done</b>${skipped?html`<span className="muted small">${skipped} skipped</span>`:null}</div>
        <div className="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(pct)}><i style=${{width:pct+'%'}}></i></div>
      </div>
    </div>
    <div className="stack">
      ${items.map((it,i)=>{
        const st=itemStatus(it), isOpen=openIdx===i&&!it.skipped;
        const cardio=it.kind==='cardio'; const ex=cardio?null:EXMAP[it.exId];
        return html`<div key=${i} className=${'a-card'+(st==='done'||st==='skipped'?' done':'')}>
          <div className="a-top">
            <button type="button" role="checkbox" aria-checked=${st==='done'} aria-label=${'Mark '+(cardio?cardioOf(it.ctype).name:ex.name)+' complete'} className=${'cbx'+(st==='done'?' on':st==='partial'?' part':'')} onClick=${()=>toggleAll(i)}>${st==='done'&&html`<${Icon} name="check" size=${26}/>`}</button>
            <button type="button" className="grow" style=${{border:0,background:'transparent',textAlign:'left',padding:0,minHeight:48}} aria-expanded=${isOpen} onClick=${()=>setOpenIdx(isOpen?-1:i)}>
              <b style=${{fontSize:16,textDecoration:it.skipped?'line-through':'none'}}>${cardio?cardioOf(it.ctype).name:ex.name}</b>
              <div className="muted small num">${it.skipped?'Skipped':cardio?(num(it.minutes)||cardioOf(it.ctype).min)+' min, optional':setsLabel(ex,it.sets.length)}</div>
            </button>
            <${ExIcon} id=${cardio?(it.ctype||'incline'):it.exId}/>
          </div>
          ${it.skipped&&html`<div className="sets"><button type="button" className="btn ghost sm" onClick=${()=>skip(i)}>Undo skip</button></div>`}
          ${isOpen&&!cardio&&html`<div>
            <p className="small" style=${{padding:'0 14px 8px'}}>${ex.cue}</p>
            <${PerfHint} exId=${it.exId}/>
            <div className="sets">
              <div className="set head"><span style=${{textAlign:'center'}}>Set</span><span style=${{textAlign:'center'}}>${ex.bw?'':'Kg'}</span><span style=${{textAlign:'center'}}>${ex.unit==='sec'?'Sec':'Reps'}</span><span style=${{textAlign:'center'}}>Done</span></div>
              ${it.sets.map((s,j)=>html`<${SetRow} key=${j} ex=${ex} s=${s} i=${j} onChange=${p=>setField(i,j,p)} onToggle=${()=>toggleSet(i,j)}/>`)}
              <div className="row" style=${{marginTop:4}}>
                <button type="button" className="btn ghost sm grow" onClick=${()=>addSet(i)}><${Icon} name="plus" size=${16}/> Set</button>
                <button type="button" className="btn ghost sm grow" disabled=${it.sets.length<=1||it.sets[it.sets.length-1].done} onClick=${()=>dropSet(i)}><${Icon} name="minus" size=${16}/> Set</button>
                <button type="button" className="btn ghost sm grow" onClick=${()=>skip(i)}><${Icon} name="skip" size=${16}/> Skip</button>
              </div>
            </div></div>`}
          ${isOpen&&cardio&&html`<div className="sets">
            <p className="small">${cardioOf(it.ctype).cue}</p>
            <div className="field"><label htmlFor="cardio-min">Minutes</label><input id="cardio-min" className="input" inputMode="numeric" value=${it.minutes} onChange=${e=>patchItem(i,x=>({...x,minutes:cleanNum(e.target.value).replace('.','')}))}/></div>
            <button type="button" className="btn ghost sm" onClick=${()=>skip(i)}><${Icon} name="skip" size=${16}/> Skip cardio</button>
          </div>`}
          ${isOpen&&html`<div className="sets">${manage(i)}</div>`}
        </div>`;
      })}
      <button type="button" className="btn ghost" onClick=${()=>setAdding(true)}><${Icon} name="plus" size=${18}/> Add exercise</button>
      <button type="button" className="btn" onClick=${()=>{setBlocked('');setSheet(true);}}>Finish workout</button>
    </div>

    <div className="rest" role="region" aria-label="Rest timer"><div>
      <div className="row between">
        <div><div className="label">Rest</div><div className=${'clock'+(rest.finished?' fin':'')} aria-live="off">${fmtClock(rest.left)}</div></div>
        <div className="row" style=${{gap:8}}>
          ${rest.running?html`<button type="button" className="btn sm" style=${{minHeight:52,width:104}} onClick=${pauseRest}><${Icon} name="pause" size=${18}/> Pause</button>`
            :html`<button type="button" className="btn primary sm" style=${{minHeight:52,width:104}} onClick=${()=>startRest()}><${Icon} name="play" size=${18}/> Start</button>`}
          <button type="button" className="btn ghost sm" style=${{minHeight:52}} onClick=${resetRest}><${Icon} name="reset" size=${18}/> Reset</button>
        </div>
      </div>
      <div className="bar" aria-hidden="true"><i style=${{width:rp+'%'}}></i></div>
      <div className="row" role="radiogroup" aria-label="Rest length">${[60,90,120,150].map(t=>html`<button key=${t} type="button" role="radio" aria-checked=${rest.total===t} className=${'chip grow'+(rest.total===t?' on':'')} style=${{justifyContent:'center'}} onClick=${()=>setTotal(t)}>${t<120?t+'s':(t/60)+' min'}</button>`)}</div>
      ${rest.finished&&html`<div className="notice ok" role="status">Rest is over. Ready for the next set.</div>`}
    </div></div>

    ${adding&&html`<div className="sheet-bg" onClick=${e=>{if(e.target===e.currentTarget)setAdding(false);}}><div className="sheet" role="dialog" aria-modal="true" aria-label="Add exercise to workout">
      <h2>Add to this workout</h2>
      ${GROUP_ORDER.map(g=>{ const list=EX.filter(e=>e.g===g&&!items.some(i=>i.exId===e.id)); return list.length?html`<div key=${g} className="stack" style=${{gap:8}}><span className="label">${GROUPS[g].name}</span>
        <div className="chips">${list.map(e=>html`<button key=${e.id} type="button" className="chip" onClick=${()=>{ commit([...items,newActiveItem(e.id,state.sessions)]); setOpenIdx(items.length); setAdding(false); toast(e.name+' added'); }}>${e.name}</button>`)}</div></div>`:null; })}
      <div className="stack" style=${{gap:8}}><span className="label">Cardio</span>
        <div className="chips">${CARDIO_TYPES.filter(c=>!items.some(i=>i.kind==='cardio'&&i.ctype===c.id)).map(c=>html`<button key=${c.id} type="button" className="chip" onClick=${()=>{ commit([...items,{kind:'cardio',exId:'cardio',ctype:c.id,minutes:String(c.min),done:false,skipped:false}]); setOpenIdx(items.length); setAdding(false); toast(c.name+' added'); }}>${c.name}</button>`)}</div></div>
      <button type="button" className="btn ghost" onClick=${()=>setAdding(false)}>Close</button>
    </div></div>`}
    ${sheet&&html`<div className="sheet-bg" onClick=${e=>{if(e.target===e.currentTarget)setSheet(false);}}><div className="sheet" role="dialog" aria-modal="true" aria-label="Finish workout">
      <h2>Finish workout?</h2>
      <div className="stats">
        <div className="stat"><b className="num">${finished}/${items.length}</b><span>exercises</span></div>
        <div className="stat"><b className="num">${setsDone}</b><span>sets</span></div>
        <div className="stat"><b className="num">${fmtMin(elapsed)}</b><span>time</span></div>
      </div>
      ${volume>0&&html`<p className="muted small num">Total weight moved: ${Math.round(volume).toLocaleString('en-SG')} kg</p>`}
      ${items.some(x=>itemStatus(x)==='partial')&&html`<p className="muted small">Partly done exercises are saved with the sets you completed.</p>`}
      ${blocked&&html`<div className="err" role="alert">${blocked}</div>`}
      <button type="button" className="btn primary" onClick=${save}>Save workout</button>
      <button type="button" className="btn ghost" onClick=${()=>setSheet(false)}>Keep training</button>
      <button type="button" className="btn danger" onClick=${discard}>Discard workout</button>
    </div></div>`}
  </div>`;
}
