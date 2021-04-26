import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { JWT_SECRET } from '../config';

export type Payload = {
  id: string;
};
const signAsync = promisify(jwt.sign);
export const create = async (userId: string) => {
  const payload: Payload = {
    id: userId
  };
  // @ts-ignore
  return signAsync(payload, JWT_SECRET!, {
    algorithm: 'HS256'
  });
};

const verifyAsync = promisify(jwt.verify);

export const verify = async (token: string) => {
  // @ts-ignore
  return verifyAsync(token, JWT_SECRET!, { algorithms: ['HS256'] });
};
