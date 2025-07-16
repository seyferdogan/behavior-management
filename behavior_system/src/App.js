import React from 'react';
import { BehaviorProvider } from './contexts/BehaviorContext';
import BehaviorManagementApp from './components/BehaviorManagementApp';
import './styles/index.css';

function App() {
  return (
    <BehaviorProvider>
      <BehaviorManagementApp />
    </BehaviorProvider>
  );
}

export default App; 