import { EXMAP, GROUPS, GROUP_ORDER, cleanCustom, syncCustom } from '../data/exercises.js';
import { clamp } from './helpers.js';

export function defaultState(){
  return {v:1,updatedAt:0,
    profile:{heightCm:161,weightKg:56,targetKg:51,weeklyGoal:3},
    settings:{rest:90,autoRest:true},
    builder:{time:45,energy:'normal',groups:GROUP_ORDER.slice(),avoidEquip:[],avoidEx:[],cardio:false,cardioType:'elliptical',cardioMin:15},
    plan:[],active:null,sessions:[],custom:[]};
}

export function normalize(s){
  const d=defaultState();
  if(!s||typeof s!=='object'){ syncCustom([]); return d; }
  const cust=Array.isArray(s.custom)?s.custom.map(cleanCustom).filter(Boolean):[]; syncCustom(cust);
  const out={...d,...s,profile:{...d.profile,...s.profile},settings:{...d.settings,...s.settings},builder:{...d.builder,...s.builder}};
  out.custom=cust;
  out.plan=Array.isArray(s.plan)?s.plan.filter(p=>p&&EXMAP[p.id]).map(p=>({id:p.id,sets:clamp(parseInt(p.sets)||3,1,6)})):[];
  out.sessions=Array.isArray(s.sessions)?s.sessions.filter(validSession):[];
  out.builder.groups=(out.builder.groups||[]).filter(g=>GROUPS[g]);
  return out;
}

export function validSession(s){
  return s&&typeof s.id==='string'&&typeof s.date==='string'&&!isNaN(new Date(s.date))&&Array.isArray(s.items);
}

export const LS_KEY='gym-buddy-v1';
export const ACCOUNT_OWNER_KEY='gymnie-account-owner-v1';

export function lsRead(){ try{ const t=localStorage.getItem(LS_KEY); return t?JSON.parse(t):null; }catch(e){ return null; } }

export function lsWrite(o){ try{ localStorage.setItem(LS_KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }

export function lsOwnerRead(){ try{ return localStorage.getItem(ACCOUNT_OWNER_KEY); }catch(e){ return null; } }

export function lsOwnerWrite(id){ try{ localStorage.setItem(ACCOUNT_OWNER_KEY,id); return true; }catch(e){ return false; } }

export function mergeStates(local,remote){
  const localState=normalize(local), remoteState=normalize(remote);
  const sessions=new Map(localState.sessions.map(s=>[s.id,s]));
  remoteState.sessions.forEach(s=>sessions.set(s.id,s));
  const custom=new Map(localState.custom.map(ex=>[ex.id,ex]));
  remoteState.custom.forEach(ex=>custom.set(ex.id,ex));
  const primary=(localState.updatedAt||0)>(remoteState.updatedAt||0)?localState:remoteState;
  return normalize({...primary,
    sessions:Array.from(sessions.values()).sort((a,b)=>new Date(b.date)-new Date(a.date)),
    custom:Array.from(custom.values()),
    updatedAt:Math.max(localState.updatedAt||0,remoteState.updatedAt||0)
  });
}

export function stateForAccount(local,remote,owner,userId){
  if(owner&&owner!==userId) return remote?normalize(remote):normalize(defaultState());
  return remote?mergeStates(local,remote):normalize(local);
}
