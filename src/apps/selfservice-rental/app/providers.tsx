import React, { useEffect } from 'react';

interface SelfserviceAppProvidersProps {
  children: React.ReactNode;
}

const SelfserviceAppProviders: React.FC<SelfserviceAppProvidersProps> = ({ children }) => {
  useEffect(() => {
    document.documentElement.dataset.app = 'selfservice-rental';
    return () => {
      delete document.documentElement.dataset.app;
    };
  }, []);

  return <>{children}</>;
};

export default SelfserviceAppProviders;
