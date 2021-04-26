/*
** DON'T EDIT THIS FILE **
It's been generated by Zapatos (v0.1.43), and is liable to be overwritten

Zapatos: https://jawj.github.io/zapatos/
Copyright (C) 2020 George MacKerron
Released under the MIT licence: see LICENCE file
*/

import type {
  JSONValue,
  JSONArray,
  DateString,
  SQLFragment,
  SQL,
  GenericSQLExpression,
  ColumnNames,
  ColumnValues,
  ParentColumn,
  DefaultType
} from './src/core';

/* === schema: public === */

/* --- enums --- */

export type call_rating_enum = 'bad' | 'good';
export namespace every {
  export type call_rating_enum = ['bad', 'good'];
}
export type users_devices_platform_enum = 'android' | 'ios';
export namespace every {
  export type users_devices_platform_enum = ['android', 'ios'];
}
export type users_gender_enum = 'F' | 'M' | 'O' | 'U';
export namespace every {
  export type users_gender_enum = ['F', 'M', 'O', 'U'];
}
export type users_posts_media_types_enum = 'image' | 'video';
export namespace every {
  export type users_posts_media_types_enum = ['image', 'video'];
}
export type users_reported_types_enum = 'call' | 'post' | 'stream';
export namespace every {
  export type users_reported_types_enum = ['call', 'post', 'stream'];
}
export type users_stream_reactions_enum = 'downvote' | 'upvote';
export namespace every {
  export type users_stream_reactions_enum = ['downvote', 'upvote'];
}

/* --- tables --- */

export namespace stream_history {
  export type Table = 'stream_history';
  export interface Selectable {
    id: string;
    streamerId: string | null;
    deviceId: string | null;
    duration: number | null;
    title: string;
    thumbnail: string | null;
    upvote: number | null;
    downvote: number | null;
    views: number | null;
    createdAt: Date;
    updatedAt: Date;
    uri: string | null;
  }
  export interface Insertable {
    id?: string | DefaultType | SQLFragment;
    streamerId?: string | null | DefaultType | SQLFragment;
    deviceId?: string | null | DefaultType | SQLFragment;
    duration?: number | null | DefaultType | SQLFragment;
    title: string | SQLFragment;
    thumbnail?: string | null | DefaultType | SQLFragment;
    upvote?: number | null | DefaultType | SQLFragment;
    downvote?: number | null | DefaultType | SQLFragment;
    views?: number | null | DefaultType | SQLFragment;
    createdAt?: Date | DateString | DefaultType | SQLFragment;
    updatedAt?: Date | DateString | DefaultType | SQLFragment;
    uri?: string | null | DefaultType | SQLFragment;
  }
  export interface Updatable extends Partial<Insertable> {}
  export type Whereable = {
    [K in keyof Insertable]?: Exclude<
      Insertable[K] | ParentColumn,
      null | DefaultType
    >;
  };
  export type JSONSelectable = {
    [K in keyof Selectable]: Date extends Selectable[K]
      ? Exclude<Selectable[K], Date> | DateString
      : Date[] extends Selectable[K]
      ? Exclude<Selectable[K], Date[]> | DateString[]
      : Selectable[K];
  };
  export type UniqueIndex = 'stream_history_pkey';
  export type Column = keyof Selectable;
  export type OnlyCols<T extends readonly Column[]> = Pick<
    Selectable,
    T[number]
  >;
  export type SQLExpression =
    | GenericSQLExpression
    | Table
    | Whereable
    | Column
    | ColumnNames<Updatable | (keyof Updatable)[]>
    | ColumnValues<Updatable>;
  export type SQL = SQLExpression | SQLExpression[];
}

/* === cross-table types === */

export type Table = stream_history.Table;
export type Selectable = stream_history.Selectable;
export type Whereable = stream_history.Whereable;
export type Insertable = stream_history.Insertable;
export type Updatable = stream_history.Updatable;
export type UniqueIndex = stream_history.UniqueIndex;
export type Column = stream_history.Column;
export type AllTables = [stream_history.Table];

export type SelectableForTable<T extends Table> = {
  stream_history: stream_history.Selectable;
}[T];

export type WhereableForTable<T extends Table> = {
  stream_history: stream_history.Whereable;
}[T];

export type InsertableForTable<T extends Table> = {
  stream_history: stream_history.Insertable;
}[T];

export type UpdatableForTable<T extends Table> = {
  stream_history: stream_history.Updatable;
}[T];

export type UniqueIndexForTable<T extends Table> = {
  stream_history: stream_history.UniqueIndex;
}[T];

export type ColumnForTable<T extends Table> = {
  stream_history: stream_history.Column;
}[T];

export type SQLForTable<T extends Table> = {
  stream_history: stream_history.SQL;
}[T];
