import React, { useEffect } from 'react';
import { ToastProvider } from '../design/ui';

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

  return <ToastProvider>{children}</ToastProvider>;
};

export default SelfserviceAppProviders;
