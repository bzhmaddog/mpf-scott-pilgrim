import {Service} from "@angular/core";
import {Dmd} from "h5dmd";


@Service()
export class DmdManagerService {
  private _dmd: Dmd| null = null

  setDmd(dmd: Dmd) {
    this._dmd = dmd

    window.dmd = this._dmd // Global dmd object for debugging
  }

  getDmd(): Dmd | null {
    return this._dmd
  }

}
