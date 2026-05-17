/**
 * MaybePromise - Type that could be either T or Promise<T>
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * DeepPartial - Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Prettify - Improve type display in IDE
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
