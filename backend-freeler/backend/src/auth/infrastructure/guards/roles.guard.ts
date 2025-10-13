import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../shared/infrastructure/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const rawReq: unknown = context.switchToHttp().getRequest();
    if (!rawReq || typeof rawReq !== 'object' || !('user' in rawReq))
      return false;
    const userVal = (rawReq as { user?: unknown }).user;
    if (!userVal || typeof userVal !== 'object') return false;
    const type = (userVal as Record<string, unknown>).type;
    const roleAny = (userVal as Record<string, unknown>).role;
    if (type !== 'empresa') return false;
    if (typeof roleAny !== 'string') return false;
    const roleName = roleAny.toLowerCase();
    return required.some((r) => r.toLowerCase() === roleName);
  }
}

export default RolesGuard;
