import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BehaviorProvider } from './contexts/BehaviorContext';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BehaviorProvider>
      <App />
    </BehaviorProvider>
  </React.StrictMode>
); 