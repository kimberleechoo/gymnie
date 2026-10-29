import { html, useState } from '../react.js';
import { supabase } from '../lib/supabase.js';

export function Auth({ status, error, onRetry, onSignOut }){
  const [mode,setMode]=useState('signin');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [formError,setFormError]=useState('');

  const submit=async e=>{
    e.preventDefault();
    setBusy(true); setMessage(''); setFormError('');
    try{
      if(status==='passwordRecovery'){
        const {error}=await supabase.auth.updateUser({password});
        if(error) throw error;
        setMessage('Password updated. Loading your account…');
      }else if(mode==='signup'){
        const {data,error}=await supabase.auth.signUp({email:email.trim(),password});
        if(error) throw error;
        if(!data.session) setMessage('Check your email to confirm your account, then sign in.');
      }else if(mode==='reset'){
        const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:location.origin});
        if(error) throw error;
        setMessage('If an account exists for that email, a password reset link is on its way.');
      }else{
        const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(error) throw error;
      }
    }catch(err){
      setFormError(err.message||'Could not complete that request. Please try again.');
    }finally{
      setBusy(false);
    }
  };

  if(status==='setup') return html`<main className="auth-page">
    <div className="auth-card card stack">
      <div className="auth-brand"><span className="auth-mark">G</span><h1>Gymnie</h1></div>
      <p className="muted">Connect your Supabase project to enable account sign-in and cloud saves.</p>
      <div className="notice">Add your project URL and publishable key in <code>src/lib/supabase.js</code>, then follow the database setup steps in README.md.</div>
    </div>
  </main>`;

  if(status==='loading') return html`<main className="auth-page"><div className="auth-card card stack" role="status">
    <div className="auth-brand"><span className="auth-mark">G</span><h1>Gymnie</h1></div><p className="muted">Loading your account…</p>
  </div></main>`;

  if(status==='error') return html`<main className="auth-page">
    <div className="auth-card card stack">
      <div className="auth-brand"><span className="auth-mark">G</span><h1>Gymnie</h1></div>
      <p className="err" role="alert">${error}</p>
      <button type="button" className="btn primary" onClick=${onRetry}>Retry</button>
      <button type="button" className="btn ghost" onClick=${onSignOut}>Sign out</button>
    </div>
  </main>`;

  if(status==='passwordRecovery') return html`<main className="auth-page">
    <div className="auth-card card stack">
      <div className="auth-brand"><span className="auth-mark">G</span><h1>Gymnie</h1></div>
      <div><h2>Choose a new password</h2><p className="muted small">Use at least 8 characters.</p></div>
      <form className="stack" onSubmit=${submit}>
        <div className="field"><label htmlFor="auth-password">New password</label><input id="auth-password" className="input" type="password" autoComplete="new-password" minLength="8" required value=${password} onInput=${e=>setPassword(e.target.value)}/></div>
        ${formError&&html`<p className="err" role="alert">${formError}</p>`}
        ${message&&html`<div className="notice ok" role="status">${message}</div>`}
        <button type="submit" className="btn primary" disabled=${busy}>${busy?'Please wait…':'Update password'}</button>
      </form>
    </div>
  </main>`;

  const title=mode==='signup'?'Create your account':mode==='reset'?'Reset your password':'Welcome back';
  return html`<main className="auth-page">
    <div className="auth-card card stack">
      <div className="auth-brand"><span className="auth-mark">G</span><h1>Gymnie</h1></div>
      <div><h2>${title}</h2><p className="muted small">Sign in to keep your workouts saved to your account.</p></div>
      <form className="stack" onSubmit=${submit}>
        <div className="field"><label htmlFor="auth-email">Email</label><input id="auth-email" className="input" type="email" autoComplete="email" required value=${email} onInput=${e=>setEmail(e.target.value)}/></div>
        ${mode!=='reset'&&html`<div className="field"><label htmlFor="auth-password">Password</label><input id="auth-password" className="input" type="password" autoComplete=${mode==='signup'?'new-password':'current-password'} minLength=${mode==='signup'?8:undefined} required value=${password} onInput=${e=>setPassword(e.target.value)}/>${mode==='signup'&&html`<span className="muted small">Use at least 8 characters.</span>`}</div>`}
        ${formError&&html`<p className="err" role="alert">${formError}</p>`}
        ${message&&html`<div className="notice ok" role="status">${message}</div>`}
        <button type="submit" className="btn primary" disabled=${busy}>${busy?'Please wait…':mode==='signup'?'Create account':mode==='reset'?'Send reset link':'Sign in'}</button>
      </form>
      ${mode==='signin'&&html`<button type="button" className="link-btn" onClick=${()=>{setMode('reset');setMessage('');setFormError('');}}>Forgot password?</button>`}
      <div className="auth-switch">
        ${mode==='signup'?html`<span>Already have an account?</span><button type="button" className="link-btn" onClick=${()=>{setMode('signin');setMessage('');setFormError('');}}>Sign in</button>`
          :mode==='reset'?html`<button type="button" className="link-btn" onClick=${()=>{setMode('signin');setMessage('');setFormError('');}}>Back to sign in</button>`
          :html`<span>New to Gymnie?</span><button type="button" className="link-btn" onClick=${()=>{setMode('signup');setMessage('');setFormError('');}}>Create an account</button>`}
      </div>
    </div>
  </main>`;
}
