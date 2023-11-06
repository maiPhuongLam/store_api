import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import configuration from 'src/config/configuration';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(UserRepository) private readonly userDB: UserRepository,
  ) {}
  async use(req: Request | any, res: Response, next: NextFunction) {
    try {
      const token = req.cookies._digi_auth_token;
      // const token = (authHeaders as string).split(' ')[1];
      if (!token) {
        throw new UnauthorizedException('Unauthorized! Missing Token');
      }
      const decoded: any = jwt.verify(token, configuration().jwtSecretToken);
      const user: any = await this.userDB.getUserDetailsById(decoded.id);
      if (!user) {
        throw new UnauthorizedException('Unauthorized! User not Exists');
      }
      user.password = undefined;
      req.user = user;
      next();
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
