type user = {
  id: import('../../src/zapatos/schema').users.Selectable['id'];
};

declare namespace Express {
  export interface Request {
    user: user;
  }
}
