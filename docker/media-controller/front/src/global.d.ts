import {Dmd} from "h5dmd";

declare global {
  interface Window {
    dmd: Dmd
  }
}
