import React from 'react';
import { DepositScreen } from '../modules/deposit';

const DepositRoute: React.FC<Record<string, unknown>> = (props) => <DepositScreen {...(props as any)} />;

export default DepositRoute;
