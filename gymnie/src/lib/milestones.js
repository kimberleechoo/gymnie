import { dkey, startOfDay, weekStart } from './helpers.js';

export const keyToDate = k => { const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); };

export function metricsFor(list,goal){
  const wk={}; let pbs=0,secs=0,back=false;
  list.forEach((s,i)=>{
    const k=dkey(weekStart(s.date)); wk[k]=(wk[k]||0)+1;
    pbs+=(s.pbs?s.pbs.length:0); secs+=s.durationSec||0;
    if(i>0&&(startOfDay(s.date)-startOfDay(list[i-1].date))/86400000>=14) back=true;
  });
  const hit=Object.keys(wk).filter(k=>wk[k]>=goal).sort();
  let maxS=0,run=0,prev=null;
  hit.forEach(k=>{ const t=keyToDate(k).getTime(); run=(prev!==null&&Math.round((t-prev)/604800000)===1)?run+1:1; prev=t; maxS=Math.max(maxS,run); });
  let curS=0;
  if(hit.length){ const since=Math.round((weekStart(new Date())-keyToDate(hit[hit.length-1]))/604800000); curS=since<=1?run:0; }
  return {count:list.length,pbs,secs,wk,hit:new Set(hit),weeksHit:hit.length,maxS,curS,back};
}

export const cap=(v,t)=>[Math.min(v,t),t];

export const CATALOG=[
  {id:'first',title:'First workout',text:'You showed up. That is the hardest part.',test:m=>m.count>=1,prog:m=>cap(m.count,1)},
  {id:'w5',title:'5 workouts',text:'Five sessions logged. A habit is forming.',test:m=>m.count>=5,prog:m=>cap(m.count,5)},
  {id:'w10',title:'10 workouts',text:'Double digits. Your body is noticing.',test:m=>m.count>=10,prog:m=>cap(m.count,10)},
  {id:'w25',title:'25 workouts',text:'Twenty-five sessions. This is who you are now.',test:m=>m.count>=25,prog:m=>cap(m.count,25)},
  {id:'w50',title:'50 workouts',text:'Fifty sessions. Seriously strong consistency.',test:m=>m.count>=50,prog:m=>cap(m.count,50)},
  {id:'wg1',title:'First goal week',text:'You hit your weekly session goal.',test:m=>m.weeksHit>=1,prog:m=>cap(m.weeksHit,1)},
  {id:'wg4',title:'4 goal weeks',text:'Four weeks where you hit your goal.',test:m=>m.weeksHit>=4,prog:m=>cap(m.weeksHit,4)},
  {id:'st2',title:'2 weeks in a row',text:'Two goal weeks back to back.',test:m=>m.maxS>=2,prog:m=>cap(m.maxS,2)},
  {id:'st4',title:'4 weeks in a row',text:'A whole month of hitting your goal.',test:m=>m.maxS>=4,prog:m=>cap(m.maxS,4)},
  {id:'st8',title:'8 weeks in a row',text:'Two months of steady weeks. Impressive.',test:m=>m.maxS>=8,prog:m=>cap(m.maxS,8)},
  {id:'pb1',title:'First personal best',text:'You lifted more than ever before.',test:m=>m.pbs>=1,prog:m=>cap(m.pbs,1)},
  {id:'pb10',title:'10 personal bests',text:'Ten new records. Progress is real.',test:m=>m.pbs>=10,prog:m=>cap(m.pbs,10)},
  {id:'back',title:'Welcome back',text:'You returned after a break of two weeks or more.',test:m=>m.back,prog:null},
  {id:'hrs10',title:'10 hours trained',text:'Ten hours of work in the gym.',test:m=>m.secs>=36000,prog:m=>cap(Math.floor(m.secs/360)/10,10)}
];

export function milestoneState(sessions,goal){
  const real=sessions.filter(x=>!x.sample).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const pm=real.map((_,i)=>metricsFor(real.slice(0,i+1),goal));
  const fin=metricsFor(real,goal);
  const items=CATALOG.map(d=>{
    const done=d.test(fin); let date=null;
    if(done){ const i=pm.findIndex(m=>d.test(m)); date=i>=0?real[i].date:null; }
    return {id:d.id,title:d.title,text:d.text,done,date,prog:d.prog?d.prog(fin):null};
  });
  return {items,m:fin,real};
}

export function newlyAchieved(prev,next,goal){
  const a=milestoneState(prev,goal), b=milestoneState(next,goal);
  const had=new Set(a.items.filter(i=>i.done).map(i=>i.id));
  const out=[];
  b.m.hit.forEach(k=>{ if(!a.m.hit.has(k)) out.push({id:'wk-'+k,title:'Weekly goal reached',text:'You hit the gym '+goal+' time'+(goal===1?'':'s')+' this week. Amazing consistency.'}); });
  b.items.forEach(i=>{ if(i.done&&!had.has(i.id)) out.push({id:i.id,title:i.title,text:i.text}); });
  return out;
}
