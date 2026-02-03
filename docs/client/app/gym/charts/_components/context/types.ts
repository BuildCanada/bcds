import { type Dispatch, SetStateAction } from "react";

type Setter<T> = Dispatch<SetStateAction<T>>;
export type State<T> = {
  get: T;
  set: Setter<T>;
};
