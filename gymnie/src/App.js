import { html, useEffect, useRef, useState } from './react.js';
import { EXMAP, syncCustom } from './data/exercises.js';
import { fmtW, uid } from './lib/helpers.js';
import { defaultState, lsOwnerRead, lsOwnerWrite, lsRead, lsWrite, normalize, stateForAccount } from './lib/state.js';
import { supabase, supabaseConfigured } from './lib/supabase.js';
import { generatePlan, perfHistory } from './lib/training.js';
import { ActiveWorkout } from './screens/ActiveWorkout.js';
import { Auth } from './screens/Auth.js';
import { Build } from './screens/Build.js';
import { History } from './screens/History.js';
import { Home } from './screens/Home.js';
import { Profile } from './screens/Profile.js';
import { Saved } from './screens/Saved.js';
import { Ctx } from './ui/common.js';
import { Icon } from './ui/icons.js';

export function App(){
  const [state,setState]=useState(()=>normalize(lsRead()));
  const [authStatus,setAuthStatus]=useState(supabaseConfigured&&supabase?'loading':'setup');
  const [authError,setAuthError]=useState('');
  const [user,setUser]=useState(null);
  const [store,setStore]=useState('checking');
  const [ui,setUiRaw]=useState({histTab:'sessions',celebrate:null,tab:'home',screen:'tabs',saved:null,toast:'',genNote:'',genErr:false});
  const setUi=fn=>setUiRaw(typeof fn==='function'?fn:(u=>({...u,...fn})));
  const stateRef=useRef(state); stateRef.current=state;
  const accountIdRef=useRef(null);
  const hydratingIdRef=useRef(null);
  const readyRef=useRef(false);
  const startRestRef=useRef(null);
  const toastT=useRef(0);
  const toast=m=>{ setUiRaw(u=>({...u,toast:m})); clearTimeout(toastT.current); toastT.current=setTimeout(()=>setUiRaw(u=>({...u,toast:''})),3200); };
  const update=fn=>setState(s=>{ const n={...fn(s),updatedAt:Date.now()}; syncCustom(n.custom); return n; });

  const loadAccount=async(account)=>{
    const id=account.id;
    if(!id||accountIdRef.current===id||hydratingIdRef.current===id) return;
    hydratingIdRef.current=id;
    accountIdRef.current=id;
    readyRef.current=false;
    setAuthStatus('loading');
    setAuthError('');
    setStore('checking');
    try{
      const local=normalize(lsRead());
      const owner=lsOwnerRead();
      const {data,error}=await supabase.from('gymnie_data').select('state').eq('user_id',id).maybeSingle();
      if(error) throw error;
      const remote=data?normalize(data.state):null;
      const next=stateForAccount(local,remote,owner,id);
      if(!remote||JSON.stringify(next)!==JSON.stringify(remote)){
        const {error:saveError}=await supabase.from('gymnie_data').upsert({
          user_id:id,
          state:next,
          updated_at:new Date().toISOString()
        },{onConflict:'user_id'});
        if(saveError) throw saveError;
      }
      if(accountIdRef.current!==id) return;
      lsWrite(next);
      lsOwnerWrite(id);
      stateRef.current=next;
      setState(next);
      setUser(account);
      readyRef.current=true;
      setStore('account');
      setAuthStatus('ready');
    }catch(error){
      if(accountIdRef.current!==id) return;
      if(lsOwnerRead()===id){
        setState(normalize(lsRead()));
        setStore('device');
        setUser(account);
        readyRef.current=true;
        setAuthStatus('ready');
        toast('Cloud unavailable. Changes are saved on this device for now.');
      }else{
        readyRef.current=false;
        setAuthError(error.message||'Could not load your account data.');
        setAuthStatus('error');
      }
    }finally{
      if(hydratingIdRef.current===id) hydratingIdRef.current=null;
    }
  };

  useEffect(()=>{
    if(!supabaseConfigured||!supabase) return;
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      queueMicrotask(()=>{
        if(event==='PASSWORD_RECOVERY'){
          setAuthStatus('passwordRecovery');
          return;
        }
        if(session?.user){
          loadAccount(session.user);
        }else{
          accountIdRef.current=null;
          hydratingIdRef.current=null;
          readyRef.current=false;
          setUser(null);
          setState(normalize(defaultState()));
          setStore('checking');
          setAuthError('');
          setAuthStatus('signedOut');
        }
      });
    });
    return ()=>subscription.unsubscribe();
  },[]);

  const retry=async()=>{
    if(!supabase) return;
    setAuthStatus('loading');
    const {data,error}=await supabase.auth.getSession();
    if(error){ setAuthError(error.message); setAuthStatus('error'); return; }
    if(data.session?.user){
      accountIdRef.current=null;
      hydratingIdRef.current=null;
      await loadAccount(data.session.user);
    }
    else setAuthStatus('signedOut');
  };
  const signOut=async()=>{
    const {error}=await supabase.auth.signOut();
    if(error){ setAuthError(error.message); setAuthStatus('error'); }
  };

  const busy=useRef(false), pending=useRef(false);
  const flush=async()=>{
    const id=accountIdRef.current;
    if(!id||!readyRef.current||!supabase) return;
    if(busy.current){ pending.current=true; return; }
    busy.current=true;
    try{
      const {error}=await supabase.from('gymnie_data').upsert({
        user_id:id,
        state:JSON.parse(JSON.stringify(stateRef.current)),
        updated_at:new Date().toISOString()
      },{onConflict:'user_id'});
      if(error) throw error;
      if(accountIdRef.current===id) setStore('account');
    }catch(error){
      if(accountIdRef.current===id){
        setStore('device');
        toast('Could not sync to Supabase. Your changes remain saved on this device.');
      }
    }finally{
      busy.current=false;
      if(pending.current){ pending.current=false; flush(); }
    }
  };
  useEffect(()=>{
    if(!readyRef.current) return;
    const ok=lsWrite(state);
    if(!ok&&store!=='device') setStore('device');
    const t=setTimeout(flush,500);
    return ()=>clearTimeout(t);
  },[state]);
  useEffect(()=>{
    if(!user) return;
    window.addEventListener('online',flush);
    return ()=>window.removeEventListener('online',flush);
  },[user?.id]);

  /* flows */
  const go=tab=>{ setUi(u=>({...u,tab,screen:'tabs'})); window.scrollTo(0,0); };
  const makeActive=()=>{
    const s=stateRef.current;
    const items=s.plan.map(p=>{
      const ex=EXMAP[p.id]; const last=perfHistory(p.id,s.sessions)[0];
      const sets=Array.from({length:p.sets},(_,i)=>{
        const ref=last?(last.sets[i]||last.sets[last.sets.length-1]):null;
        return {w:ex.bw?'0':(ref?fmtW(ref.w):''),r:ref?String(ref.r):String(ex.reps[0]),done:false,err:''};
      });
      return {exId:p.id,planned:p.sets,skipped:false,sets};
    });
    if(s.builder.cardio) items.push({kind:'cardio',exId:'cardio',ctype:s.builder.cardioType,minutes:String(s.builder.cardioMin),done:false,skipped:false});
    return {id:uid(),startedAt:Date.now(),items};
  };
  const beginFromPlan=()=>{
    const s=stateRef.current;
    if(!s.plan.length&&!s.builder.cardio){ toast('Add at least one exercise first'); return; }
    update(x=>({...x,active:makeActive()}));
    setUi(u=>({...u,screen:'workout'}));
    window.scrollTo(0,0);
  };
  const quickStart=()=>{
    const s=stateRef.current;
    if(s.active){ setUi(u=>({...u,screen:'workout'})); return; }
    if(s.plan.length){ beginFromPlan(); return; }
    const r=generatePlan(s.builder,s.sessions);
    if(r.error){ go('build'); setUi(u=>({...u,genNote:r.error,genErr:true})); return; }
    update(x=>({...x,plan:r.plan}));
    setUi(u=>({...u,tab:'build',screen:'tabs',genNote:r.note,genErr:false}));
    toast('Workout ready. Review it, then start.');
    window.scrollTo(0,0);
  };
  const ctx={state,update,store,ui,setUi,toast,go,quickStart,beginFromPlan,startRestRef,user,signOut};
  const tabs=[['home','Home','home'],['build','Build','build'],['history','History','history'],['profile','Profile','profile']];

  if(authStatus!=='ready') return html`<${Auth} status=${authStatus} error=${authError} onRetry=${retry} onSignOut=${signOut}/>`;

  let body;
  if(ui.screen==='workout'&&state.active) body=html`<${ActiveWorkout}/>`;
  else if(ui.screen==='saved') body=html`<${Saved}/>`;
  else body=html`<div className="app">
      ${ui.tab==='home'?html`<${Home}/>`:ui.tab==='build'?html`<${Build}/>`:ui.tab==='history'?html`<${History}/>`:html`<${Profile}/>`}
    </div>
    ${ui.tab==='build'&&(state.plan.length>0||state.builder.cardio)&&html`<div className="startbar"><div><button type="button" className="btn primary" onClick=${state.active?quickStart:beginFromPlan}>${state.active?'Resume workout':'Start workout · '+(state.plan.length+(state.builder.cardio?1:0))+' items'}</button></div></div>`}
    <nav className="nav" aria-label="Main"><div className="nav-in">${tabs.map(t=>html`<button key=${t[0]} type="button" aria-current=${ui.tab===t[0]?'page':undefined} className=${'nav-b'+(ui.tab===t[0]?' on':'')} onClick=${()=>go(t[0])}><${Icon} name=${t[2]}/>${t[1]}</button>`)}</div></nav>`;
  return html`<${Ctx.Provider} value=${ctx}>${body}${ui.toast&&html`<div className="toast" role="status">${ui.toast}</div>`}<//>`;
}
