// Custom decorator to extract AuthContext from request

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContext } from '../../../application/auth/auth-context';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest<{ authContext: AuthContext }>();
    return request.authContext;
  },
);
