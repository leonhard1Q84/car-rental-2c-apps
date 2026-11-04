import React from 'react';
import { DepositScreen } from '../modules/selfservice-rental/deposit';

const DepositRoute: React.FC<Record<string, unknown>> = (props) => <DepositScreen {...(props as any)} />;

export default DepositRoute;
