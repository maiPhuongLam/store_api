import { SetMetadata } from '@nestjs/common';
import { UserTypes } from '../schemas/user';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
// export const Roles = (...roles: UserTypes[]) => SetMetadata(ROLES_KEY, roles);
export const Roles = Reflector.createDecorator<UserTypes[]>();
