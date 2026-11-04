import React from 'react';
import { AuthScreen } from '../modules/auth';

const AuthRoute: React.FC<Record<string, unknown>> = (props) => <AuthScreen {...(props as any)} />;

export default AuthRoute;
