import { html } from '../react.js';
import { POSES } from '../data/exercises.js';

export function Icon({name,size=22}){
  const P={
    home:html`<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>`,
    build:html`<path d="M4 12h16M7 8v8M17 8v8M4 10v4M20 10v4"/>`,
    history:html`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
    profile:html`<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>`,
    check:html`<path d="M5 12.5l4.5 4.5L19 7.5"/>`,
    plus:html`<path d="M12 5v14M5 12h14"/>`,
    minus:html`<path d="M5 12h14"/>`,
    x:html`<path d="M6 6l12 12M18 6L6 18"/>`,
    up:html`<path d="M6 14l6-6 6 6"/>`,
    down:html`<path d="M6 10l6 6 6-6"/>`,
    left:html`<path d="M15 6l-6 6 6 6"/>`,
    play:html`<path d="M8 5l11 7-11 7z"/>`,
    pause:html`<path d="M8 5v14M16 5v14"/>`,
    reset:html`<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>`,
    skip:html`<path d="M5 5l9 7-9 7zM18 5v14"/>`,
    star:html`<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>`,
    flag:html`<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>`
  };
  const fill=(name==='play'||name==='skip')?'currentColor':'none';
  return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill=${fill} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">${P[name]}</svg>`;
}

export function ExIcon({id}){
  const p=POSES[id]||{h:[32,10],b:['M32 14V30L24 44','M32 30L40 44','M32 20L23 27','M32 20L41 27'],e:['M14 27H21','M43 27H50','M16 23V31','M48 23V31']};
  return html`<svg className="exicon" viewBox="0 0 64 50" aria-hidden="true">
    <g className="eq">${p.e.map((d,i)=>html`<path key=${i} d=${d}/>`)}</g>
    <g className="body"><circle cx=${p.h[0]} cy=${p.h[1]} r="3.6"/>${p.b.map((d,i)=>html`<path key=${i} d=${d}/>`)}</g>
  </svg>`;
}
