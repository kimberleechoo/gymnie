export const pad = n => String(n).padStart(2,'0');

export const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);

export const clamp = (n,a,b) => Math.max(a,Math.min(b,n));

export const dkey = d => { const x=new Date(d); return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate()); };

export const startOfDay = d => { const x=new Date(d); x.setHours(0,0,0,0); return x; };

export const daysAgo = d => Math.round((startOfDay(new Date())-startOfDay(d))/86400000);

export const weekStart = d => { const x=startOfDay(d); const dow=(x.getDay()+6)%7; x.setDate(x.getDate()-dow); return x; };

export const fmtDate = iso => new Date(iso).toLocaleDateString('en-SG',{weekday:'short',day:'numeric',month:'short'});

export const fmtLong = d => d.toLocaleDateString('en-SG',{weekday:'long',day:'numeric',month:'long'});

export const fmtClock = s => { s=Math.max(0,Math.round(s)); const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), x=s%60; return (h?h+':'+pad(m):m)+':'+pad(x); };

export const fmtMin = s => Math.max(1,Math.round(s/60))+' min';

export const fmtW = w => { const n=Number(w); return Number.isInteger(n)?String(n):String(Math.round(n*10)/10); };

export const num = v => { const n=parseFloat(String(v).replace(',','.')); return isFinite(n)?n:NaN; };

export const cleanNum = v => { let s=String(v).replace(',','.').replace(/[^0-9.]/g,''); const i=s.indexOf('.'); if(i>=0) s=s.slice(0,i+1)+s.slice(i+1).replace(/\./g,''); return s.slice(0,6); };

export const repsLabel = ex => ex.reps[0]+'–'+ex.reps[1]+(ex.unit==='sec'?' sec':' reps');

export const setsLabel = (ex,sets) => (sets||ex.sets)+' × '+repsLabel(ex)+(ex.note?' '+ex.note:'');

/** Saves text as a file using a normal browser download (used outside Claude). */
export function browserDownload(name, text) {
  const type = name.endsWith('.csv') ? 'text/csv' : 'application/json';
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
