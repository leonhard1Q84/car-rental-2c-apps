import React from 'react';
import { ReturnFlowScreen } from '../modules/return-flow';

const ReturnRoute: React.FC<Record<string, unknown>> = (props) => <ReturnFlowScreen {...(props as any)} />;

export default ReturnRoute;
