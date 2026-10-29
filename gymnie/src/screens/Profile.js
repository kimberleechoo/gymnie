import { html, useState } from '../react.js';
import { EXMAP, cleanCustom } from '../data/exercises.js';
import { exportJSON, toCSV } from '../lib/exportData.js';
import { browserDownload, cleanNum, dkey, num } from '../lib/helpers.js';
import { defaultState, validSession } from '../lib/state.js';
import { Header, Seg, StorageNote, useCtx } from '../ui/common.js';

export function Profile(){
  const {state,update,store,toast,user,signOut}=useCtx();
  const p=state.profile;
  const [d,setD]=useState({h:String(p.heightCm),w:String(p.weightKg),t:String(p.targetKg)});
  const [errs,setErrs]=useState({});
  const [msg,setMsg]=useState(''); const [out,setOut]=useState(''); const [paste,setPaste]=useState(''); const [wipe,setWipe]=useState(false);
  const saveProfile=()=>{
    const h=num(d.h),w=num(d.w),t=num(d.t),e={};
    if(!(h>=100&&h<=230)) e.h='Height should be 100–230 cm.';
    if(!(w>=30&&w<=200)) e.w='Weight should be 30–200 kg.';
    if(!(t>=30&&t<=200)) e.t='Target should be 30–200 kg.';
    setErrs(e);
    if(Object.keys(e).length) return;
    update(s=>({...s,profile:{...s.profile,heightCm:h,weightKg:w,targetKg:t}}));
    toast('Profile saved');
  };
  const wNum=num(d.w), tNum=num(d.t);
  const togo=isFinite(wNum)&&isFinite(tNum)?Math.round((wNum-tNum)*10)/10:null;
  const download=async(name,text)=>{
    setMsg(''); setOut('');
    try{
      const dl=await (window.claude&&window.claude.use?window.claude.use('downloads'):null);
      if(!dl){ browserDownload(name,text); setMsg('Backup downloaded. Keep it somewhere safe.'); return; }
      await dl.save({filename:name,data:text});
      setMsg('Backup ready. Check your downloads or share sheet.');
    }catch(e){
      if(e&&e.code==='declined'){ setMsg('Download cancelled.'); return; }
      setOut(text); setMsg('Could not start a download. Copy the text below instead.');
    }
  };
  const copy=async text=>{
    try{ await navigator.clipboard.writeText(text); setMsg('Copied. Paste it into Notes or an email to yourself.'); setOut(''); }
    catch(e){ setOut(text); setMsg('Copy was blocked. Select the text below and copy it manually.'); }
  };
  const doImport=text=>{
    let data; try{ data=JSON.parse(text); }catch(e){ setMsg('That is not valid JSON. Use a backup file made by Gymnie.'); return; }
    if(!data||!Array.isArray(data.sessions)){ setMsg('No workout history found in that file.'); return; }
    const ok=data.sessions.filter(validSession).map(s=>({...s,items:s.items.filter(i=>i&&typeof i.name==='string').map(i=>({...i,sets:Array.isArray(i.sets)?i.sets.map(x=>({w:Number(x.w)||0,r:Number(x.r)||0})):[]}))}));
    const cc=Array.isArray(data.custom)?data.custom.map(cleanCustom).filter(Boolean).filter(c=>!EXMAP[c.id]):[];
    if(cc.length) update(s=>({...s,custom:[...s.custom,...cc]}));
    const have=new Set(state.sessions.map(s=>s.id));
    const add=ok.filter(s=>!have.has(s.id));
    update(s=>({...s,sessions:[...s.sessions,...add].sort((a,b)=>new Date(b.date)-new Date(a.date)),
      profile:data.profile&&typeof data.profile==='object'?{...s.profile,...['heightCm','weightKg','targetKg','weeklyGoal'].reduce((o,k)=>isFinite(Number(data.profile[k]))&&data.profile[k]!==null?{...o,[k]:Number(data.profile[k])}:o,{})}:s.profile}));
    const cn=cc.length?' and '+cc.length+' custom exercise'+(cc.length===1?'':'s'):'';
    setMsg('Imported '+add.length+' session'+(add.length===1?'':'s')+cn+(ok.length-add.length?' ('+(ok.length-add.length)+' already here)':'')+'.');
    setPaste('');
  };
  const onFile=e=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>doImport(String(r.result)); r.onerror=()=>setMsg('Could not read that file.'); r.readAsText(f); e.target.value='';
  };
  const hasSamples=state.sessions.some(s=>s.sample);
  return html`<div className="stack">
    <${Header} title="Profile" sub="Your numbers and settings."/>
    <div className="card stack">
      <h3>Account</h3>
      <p className="muted">${user?.email}</p>
      <button type="button" className="btn ghost" onClick=${signOut}>Sign out</button>
    </div>
    <div className="card stack">
      <div className="row"><div className="field grow"><label htmlFor="p-h">Height (cm)</label><input id="p-h" className=${'input'+(errs.h?' bad':'')} inputMode="decimal" value=${d.h} onChange=${e=>setD({...d,h:cleanNum(e.target.value)})}/>${errs.h&&html`<span className="err">${errs.h}</span>`}</div>
        <div className="field grow"><label htmlFor="p-w">Weight (kg)</label><input id="p-w" className=${'input'+(errs.w?' bad':'')} inputMode="decimal" value=${d.w} onChange=${e=>setD({...d,w:cleanNum(e.target.value)})}/>${errs.w&&html`<span className="err">${errs.w}</span>`}</div></div>
      <div className="field"><label htmlFor="p-t">Target weight (kg)</label><input id="p-t" className=${'input'+(errs.t?' bad':'')} inputMode="decimal" value=${d.t} onChange=${e=>setD({...d,t:cleanNum(e.target.value)})}/>${errs.t&&html`<span className="err">${errs.t}</span>`}</div>
      ${togo!==null&&html`<p className="muted small">${togo>0?togo+' kg to go. A steady pace is about 0.25–0.5 kg a week, which protects muscle.':'You are at or below your target. Focus on holding strength.'}</p>`}
      <button type="button" className="btn primary" onClick=${saveProfile}>Save profile</button>
    </div>
    <div className="card stack">
      <h3>Training</h3>
      <div className="field"><span className="label">Sessions per week goal</span><${Seg} label="Sessions per week" value=${p.weeklyGoal} onChange=${v=>update(s=>({...s,profile:{...s.profile,weeklyGoal:v}}))} options=${[{v:2,label:'2'},{v:3,label:'3'},{v:4,label:'4'}]}/></div>
      <div className="field"><span className="label">Default rest between sets</span><${Seg} label="Default rest" value=${state.settings.rest} onChange=${v=>update(s=>({...s,settings:{...s.settings,rest:v}}))} options=${[{v:60,label:'60s'},{v:90,label:'90s'},{v:120,label:'2 min'},{v:150,label:'2.5 min'}]}/></div>
      <div className="row between"><div><b>Start rest timer automatically</b><div className="muted small">When you tick a set</div></div>
        <button type="button" role="switch" aria-checked=${state.settings.autoRest} aria-label="Start rest timer automatically" className=${'chip'+(state.settings.autoRest?' on':'')} onClick=${()=>update(s=>({...s,settings:{...s.settings,autoRest:!s.settings.autoRest}}))}>${state.settings.autoRest?'On':'Off'}</button></div>
    </div>
    <div className="card stack">
      <h3>Your data</h3>
      <${StorageNote}/>
      <button type="button" className="btn" onClick=${()=>download('gymnie-backup-'+dkey(new Date())+'.json',exportJSON(state))}>Download backup (JSON)</button>
      <button type="button" className="btn ghost" onClick=${()=>download('gymnie-history-'+dkey(new Date())+'.csv',toCSV(state.sessions))} disabled=${!state.sessions.length}>Download history (CSV)</button>
      <button type="button" className="btn ghost" onClick=${()=>copy(exportJSON(state))}>Copy backup text</button>
      <div className="field"><label htmlFor="import-file">Restore from a backup file</label><input id="import-file" className="input" type="file" accept=".json,application/json" onChange=${onFile} style=${{paddingTop:10}}/></div>
      <div className="field"><label htmlFor="import-text">Or paste backup text</label><textarea id="import-text" className="input" value=${paste} onChange=${e=>setPaste(e.target.value)} placeholder="Paste the JSON here"></textarea></div>
      <button type="button" className="btn ghost" disabled=${!paste.trim()} onClick=${()=>doImport(paste)}>Restore pasted backup</button>
      ${msg&&html`<div className="notice ok" role="status">${msg}</div>`}
      ${out&&html`<textarea id="export-out" className="input" readOnly value=${out} onFocus=${e=>e.target.select()}></textarea>`}
      ${hasSamples&&html`<button type="button" className="btn ghost" onClick=${()=>update(s=>({...s,sessions:s.sessions.filter(x=>!x.sample)}))}>Remove example sessions</button>`}
      ${wipe?html`<div className="stack" style=${{gap:8}}><p className="err">This deletes all history and settings on this device and your account copy.</p>
        <button type="button" className="btn danger" onClick=${()=>{update(()=>defaultState());setWipe(false);toast('All data cleared');}}>Yes, delete everything</button>
        <button type="button" className="btn ghost" onClick=${()=>setWipe(false)}>Cancel</button></div>`
        :html`<button type="button" className="btn danger" onClick=${()=>setWipe(true)}>Delete all data</button>`}
    </div>
  </div>`;
}
