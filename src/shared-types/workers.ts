export type PayloadMap<
    M extends {
        [index: string]: {[key: string]: any};
    }
> = {
    [K in keyof M]: M[K] extends undefined
        ? {
              type: K;
          }
        : {
              type: K;
              payload: M[K];
          };
};
