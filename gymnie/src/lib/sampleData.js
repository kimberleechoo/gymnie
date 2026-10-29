import { EXMAP } from '../data/exercises.js';
import { uid } from './helpers.js';

export function makeSamples(){
  const d=n=>{ const x=new Date(); x.setDate(x.getDate()-n); x.setHours(18,10,0,0); return x.toISOString(); };
  const it=(id,w,reps)=>({exId:id,name:EXMAP[id].name,group:EXMAP[id].g,setsPlanned:reps.length,skipped:false,sets:reps.map(r=>({w,r}))});
  return [
    {id:'ex-'+uid(),sample:true,date:d(10),focus:'Back · Glutes · Core',durationSec:2820,items:[
      it('lat-pulldown',30,[12,11,10]),it('seated-row',27.5,[12,12,10]),it('hip-thrust',40,[12,10,10]),it('glute-kickback',10,[15,14,12]),it('plank',0,[30,30,25])],pbs:[]},
    {id:'ex-'+uid(),sample:true,date:d(6),focus:'Legs · Glutes · Core',durationSec:3010,items:[
      it('leg-press',50,[12,12,10]),it('leg-curl',25,[12,12,11]),it('hip-abduction',30,[15,15,14]),it('cable-crunch',20,[15,14,12])],pbs:[]},
    {id:'ex-'+uid(),sample:true,date:d(2),focus:'Back · Glutes · Core',durationSec:2700,items:[
      it('lat-pulldown',32.5,[12,12,11]),it('chest-row',25,[12,12,12]),it('hip-thrust',45,[12,11,10]),it('pallof',7.5,[12,12,12])],
      pbs:[{exId:'lat-pulldown',name:'Lat pulldown',w:32.5,r:12},{exId:'hip-thrust',name:'Hip thrust machine',w:45,r:12}]}
  ];
}
