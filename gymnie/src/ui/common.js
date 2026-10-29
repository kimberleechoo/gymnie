import { createContext, html, useContext } from '../react.js';

export const Ctx=createContext(null);

export const useCtx=()=>useContext(Ctx);

export function Seg({value,options,onChange,label,cls}){
  return html`<div className=${'seg'+(cls?' '+cls:'')} role="radiogroup" aria-label=${label}>
    ${options.map(o=>html`<button key=${o.v} type="button" role="radio" aria-checked=${value===o.v} className=${'seg-b'+(value===o.v?' on':'')} onClick=${()=>onChange(o.v)}>${o.label}</button>`)}
  </div>`;
}

export function Header({title,sub,right}){
  return html`<div className="row between" style=${{marginBottom:14,alignItems:'flex-end'}}>
    <div className="grow"><h1>${title}</h1>${sub&&html`<p className="muted serif" style=${{marginTop:4,fontSize:20,lineHeight:1.2}}>${sub}</p>`}</div>${right}
  </div>`;
}

export function StorageNote(){
  const {store}=useCtx();
  const m={
    account:['ok','Saved to your Supabase account. Works across your devices.'],
    device:['warn','Saved in this browser only. Browsers can clear it, so export a backup now and then.'],
    none:['warn','Cannot save here. Your history disappears when you close this page. Export a backup before you leave.'],
    checking:['ok','Checking where your data can be saved…']
  }[store];
  return html`<div className=${'notice '+(m[0]==='ok'?'ok':'')} role="status">${m[1]}</div>`;
}

export function Empty({title,text,action}){
  return html`<div className="card empty"><h3>${title}</h3><p className="muted">${text}</p>${action}</div>`;
}
