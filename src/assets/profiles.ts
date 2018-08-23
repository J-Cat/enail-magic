import { Profile } from "../profiles/profile";
import { App } from "../app";

import { IProfile } from "../profiles/IProfile";
const _profiles: Array<IProfile> = require("../assets/profiles.json")

let index: number = 1;

export class Profiles {
    items: Array<Profile>;

    constructor(app: App) {
        this.items = _profiles.map(_profile => {
            return new Profile(app, _profile, index++);
        });        
    }    
}