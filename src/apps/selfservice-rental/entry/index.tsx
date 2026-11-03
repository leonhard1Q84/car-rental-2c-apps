import React from 'react';
import ReactDOM from 'react-dom/client';
import SelfserviceAppShell from '../app/App';
import '@shared/styles/tailwind.css';
import '../design/tokens.css';
import '../design/theme.css';
import '../design/baseline.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

document.documentElement.dataset.app = 'selfservice-rental';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SelfserviceAppShell />
  </React.StrictMode>
);
