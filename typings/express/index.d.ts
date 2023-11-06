import { Types, Document } from 'mongoose';
import { User } from '../../src/shared/schemas/user';
declare global {
  namespace Express {
    interface Request {
      user?: Document<unknown, object, User> &
        User & {
          _id: Types.ObjectId;
        };
      csrfToken?: () => string;
    }
  }
}
