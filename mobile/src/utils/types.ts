export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type ValueOf<T> = T[keyof T];

export interface PaginationState {
  initLoading: boolean;
  refreshing: boolean;
  page: number;
  reachedEnd: boolean;
  paginationLoading: boolean;
  pageSize: number;
}

export const defaultPaginationState: PaginationState = {
  initLoading: true,
  pageSize: 10,
  refreshing: false,
  page: 1,
  reachedEnd: false,
  paginationLoading: false,
};

export interface User {
  username: string;
  avatar: string;
}

export const defaultUser: User = {
  username: "",
  avatar: "",
};

export type Callback = (...args: any[]) => any;
