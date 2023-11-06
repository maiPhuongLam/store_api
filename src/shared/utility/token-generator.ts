import * as jwt from 'jsonwebtoken';
import configuration from 'src/config/configuration';

export const generateAuthToken = (id: string) => {
  return jwt.sign({ id }, configuration().jwtSecretToken, {
    expiresIn: '30d',
  });
};

export const decodeAuthToken = (token: string) => {
  return jwt.verify(token, configuration().jwtSecretToken);
};
