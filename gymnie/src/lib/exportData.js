import { dkey } from './helpers.js';

export function toCSV(sessions){
  const q=v=>'"'+String(v).replace(/"/g,'""')+'"';
  const rows=[['date','focus','exercise','set','weight_kg','reps_or_seconds','session_minutes','example'].join(',')];
  for(const s of sessions.slice().sort((a,b)=>new Date(a.date)-new Date(b.date))){
    for(const i of s.items){
      if(i.cardioMin) rows.push([dkey(s.date),q(s.focus),q(i.name),1,'',i.cardioMin,Math.round((s.durationSec||0)/60),s.sample?'yes':''].join(','));
      (i.sets||[]).forEach((x,k)=>rows.push([dkey(s.date),q(s.focus),q(i.name),k+1,x.w,x.r,Math.round((s.durationSec||0)/60),s.sample?'yes':''].join(',')));
    }
  }
  return rows.join('\n');
}

export function exportJSON(state){
  return JSON.stringify({app:'gymnie',version:1,exportedAt:new Date().toISOString(),profile:state.profile,settings:state.settings,custom:state.custom,sessions:state.sessions},null,2);
}
