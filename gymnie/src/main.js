import { React, ReactDOM } from './react.js';
import { App } from './App.js';

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));

// Offline support: only on https or localhost.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* app still works without it */ });
}
