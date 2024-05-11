import {Injectable} from "@angular/core";
import {Dmd} from "h5dmd";


@Injectable({
  providedIn: 'root'
})
export class DmdManagerService {
  private _dmd: Dmd| null = null

  setDmd(dmd: Dmd) {
    this._dmd = dmd
  }

  getDmd(): Dmd | null {
    return this._dmd
  }

}
