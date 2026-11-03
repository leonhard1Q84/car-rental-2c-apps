import React from 'react';
import SelfserviceAppProviders from './providers';
import SelfserviceRouter from './router';

const SelfserviceAppShell: React.FC = () => {
  return (
    <SelfserviceAppProviders>
      <SelfserviceRouter />
    </SelfserviceAppProviders>
  );
};

export default SelfserviceAppShell;
