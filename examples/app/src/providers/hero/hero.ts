import { HttpClient } from '@angular/common/http';
import {Get, passToStub, Route} from "idl2ts-ng";
import {HeroHandler} from "spec";
import {Injectable} from "@angular/core";

@Route('hero')
class HeroServiceStub implements HeroHandler {
  @Get('/name')
  getName(): string {
    return undefined;
  }
}

@Injectable()
export class HeroProvider {
  stub = new HeroServiceStub();

  constructor(public http: HttpClient) {
    console.log('Hello HeroProvider Provider');
  }
  getName() {
    return passToStub(this,this.getName,{});
  }

}
