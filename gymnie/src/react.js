// React, ReactDOM and htm are loaded as classic <script> tags from /vendor (see index.html).
// This module re-exports them so every other file imports from one place.
const { React, ReactDOM, htm } = window;

export { React, ReactDOM };
export const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;
/** JSX-like tagged template: html`<div className="x">${value}</div>` */
export const html = htm.bind(React.createElement);
