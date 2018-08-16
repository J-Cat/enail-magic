import { IProfile } from "./IProfile";
import { Profile } from "./profile";
import { App } from "../app";

const _profiles: Array<IProfile> = require("./profiles.json");
let index: number = 1;

export class Profiles {
    items: Array<Profile>;

    constructor(app: App) {
        this.items = _profiles.map(_profile => {
            return new Profile(app, _profile, index++);
        });        
    }    
}