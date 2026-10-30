import { EX, EXMAP, GROUPS, GROUP_ORDER, MIN_PER_SET, STEP_KG, WARMUP_MIN } from '../data/exercises.js';
import { clamp, daysAgo, fmtW } from './helpers.js';

export function itemsDone(it){ return it.sets?it.sets.length:0; }

export function perfHistory(exId,sessions){
  const out=[];
  for(const s of sessions){
    for(const it of s.items){
      if(it.exId===exId&&it.sets&&it.sets.length) out.push({date:s.date,sets:it.sets,planned:it.setsPlanned||it.sets.length,id:s.id});
    }
  }
  return out.sort((a,b)=>new Date(b.date)-new Date(a.date));
}

export function bestSet(sets,ex){
  let best=null;
  for(const s of sets){
    if(!best) best=s;
    else if(ex&&ex.bw){ if(s.r>best.r) best=s; }
    else if(s.w>best.w||(s.w===best.w&&s.r>best.r)) best=s;
  }
  return best;
}

export function bestOf(exId,sessions){
  const ex=EXMAP[exId]; let best=null;
  for(const h of perfHistory(exId,sessions)){
    const b=bestSet(h.sets,ex); if(!b) continue;
    if(!best) best=b;
    else if(ex.bw?b.r>best.r:(b.w>best.w||(b.w===best.w&&b.r>best.r))) best=b;
  }
  return best;
}

export function computePBs(items,prior){
  const out=[];
  for(const it of items){
    const ex=EXMAP[it.exId]; if(!ex||!it.sets||!it.sets.length) continue;
    const prev=bestOf(it.exId,prior), cur=bestSet(it.sets,ex);
    if(!prev||!cur) continue;
    const better=ex.bw?cur.r>prev.r:(cur.w>prev.w||(cur.w===prev.w&&cur.r>prev.r));
    if(better) out.push({exId:it.exId,name:ex.name,w:cur.w,r:cur.r});
  }
  return out;
}

export function isRamping(sessions){
  if(!sessions.length) return true;
  const last=sessions.slice().sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  return sessions.length<3||daysAgo(last.date)>14;
}

/* Progression: never auto-raises. Suggests small steps only when every planned set hit the top of the range. */
export function suggestion(exId,sessions){
  const ex=EXMAP[exId]; const hist=perfHistory(exId,sessions);
  const hi=ex.reps[1], lo=ex.reps[0];
  if(!hist.length){
    return ex.bw?{kind:'start',text:'First time: go slow and stop 1–2 reps before it gets shaky.'}
      :{kind:'start',text:'First time: pick a weight you could lift 15+ times. Learn the movement first.'};
  }
  const last=hist[0];
  const topW=Math.max(...last.sets.map(s=>s.w));
  const allTop=last.sets.length>=last.planned&&last.sets.every(s=>s.r>=hi);
  const anyLow=last.sets.some(s=>s.r<lo);
  if(ex.bw){
    if(allTop&&!isRamping(sessions)) return {kind:'up',text:ex.unit==='sec'?'Strong. Try 5 more seconds per set.':'Strong. Slow the tempo or add 1–2 reps.'};
    return {kind:'stay',text:'Repeat this and aim for '+hi+(ex.unit==='sec'?' sec':' reps')+' on every set.'};
  }
  if(allTop){
    if(isRamping(sessions)) return {kind:'hold',text:'Strong session. Repeat '+fmtW(topW)+' kg once more while you rebuild, then go up.',w:topW};
    return {kind:'up',text:'Top of the range on every set. If your form stayed clean, try '+fmtW(topW+STEP_KG)+' kg next time.',w:topW+STEP_KG};
  }
  if(anyLow){
    const prev=hist[1];
    if(prev&&prev.sets.some(s=>s.r<lo)&&Math.max(...prev.sets.map(s=>s.w))===topW&&topW>STEP_KG)
      return {kind:'down',text:'Tough two sessions in a row. Drop to '+fmtW(topW-STEP_KG)+' kg and build back up.',w:topW-STEP_KG};
    return {kind:'stay',text:'Stay at '+fmtW(topW)+' kg until every set reaches '+lo+' reps.',w:topW};
  }
  return {kind:'stay',text:'Stay at '+fmtW(topW)+' kg and aim for '+hi+' reps on every set.',w:topW};
}

export function groupRecency(sessions){
  const r={}; GROUP_ORDER.forEach(g=>r[g]=Infinity);
  for(const s of sessions){
    const d=daysAgo(s.date);
    for(const it of s.items){
      const ex=EXMAP[it.exId];
      if(ex&&it.sets&&it.sets.length&&d<r[ex.g]) r[ex.g]=d;
    }
  }
  return r;
}

export function exRecency(sessions){
  const r={};
  for(const s of sessions){
    const d=daysAgo(s.date);
    for(const it of s.items){ if(it.sets&&it.sets.length&&(r[it.exId]===undefined||d<r[it.exId])) r[it.exId]=d; }
  }
  return r;
}

export function estMinutes(plan,cardio,cmin){
  let m=WARMUP_MIN;
  for(const p of plan) m+=p.sets*MIN_PER_SET;
  if(cardio) m+=(cmin||10);
  return Math.round(m);
}

export function generatePlan(b,sessions){
  const {time,energy,groups,avoidEquip,avoidEx,cardio}=b;
  if(!groups.length) return {error:'Pick at least one muscle group first.'};
  const low=energy==='low', high=energy==='high';
  const sets=low?2:3;
  let n={30:3,45:5,60:6}[time]||5;
  if(cardio) n-=(b.cardioMin>=30?2:1);
  if(low) n-=1;
  if(high&&time===60) n+=1;
  n=clamp(n,2,7);
  const rec=groupRecency(sessions), erec=exRecency(sessions);
  const pool=g=>EX.filter(e=>e.g===g&&!avoidEx.includes(e.id)&&!e.tags.some(t=>avoidEquip.includes(t)));
  let chosen=groups.filter(g=>pool(g).length);
  if(!chosen.length) return {error:'Everything is excluded. Loosen the "avoid" list and try again.'};
  const cap=time===30?2:(low?3:5);
  let note='';
  if(chosen.length>cap){
    chosen=chosen.slice().sort((a,b)=>(rec[b]-rec[a])||(GROUP_ORDER.indexOf(a)-GROUP_ORDER.indexOf(b))).slice(0,cap);
    chosen.sort((a,b)=>GROUP_ORDER.indexOf(a)-GROUP_ORDER.indexOf(b));
    note='Kept it to '+chosen.map(g=>GROUPS[g].short).join(', ')+' so you are not overloaded. The rest can wait for next time.';
  }
  const cand={};
  chosen.forEach(g=>{
    cand[g]=pool(g).slice().sort((a,b)=>{
      if(low&&a.heavy!==b.heavy) return a.heavy?1:-1;
      const ra=erec[a.id]===undefined?Infinity:erec[a.id], rb=erec[b.id]===undefined?Infinity:erec[b.id];
      return (rb-ra)||(EX.indexOf(a)-EX.indexOf(b));
    });
  });
  const seq=['back','arms','shoulders','glutes','back','legs','core','arms','shoulders','glutes','legs','back','core','arms','shoulders','glutes','legs','core'].filter(g=>chosen.includes(g));
  const picks=[]; let guard=0;
  while(picks.length<n&&guard<60){
    guard++;
    let added=false;
    for(const g of (seq.length?seq:chosen)){
      if(picks.length>=n) break;
      if(cand[g].length){ picks.push(cand[g].shift()); added=true; }
    }
    if(!added) break;
  }
  const rank={back:1,arms:2,shoulders:3,glutes:4,legs:5,core:6};
  picks.sort((a,b)=>((a.heavy?0:rank[a.g])-(b.heavy?0:rank[b.g]))||(EX.indexOf(a)-EX.indexOf(b)));
  return {plan:picks.map(e=>({id:e.id,sets:low?2:e.sets})),note};
}
