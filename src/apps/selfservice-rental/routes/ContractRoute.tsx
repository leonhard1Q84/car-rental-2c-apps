import React from 'react';
import { ContractScreen } from '../modules/contract';

const ContractRoute: React.FC<Record<string, unknown>> = (props) => <ContractScreen {...(props as any)} />;

export default ContractRoute;
