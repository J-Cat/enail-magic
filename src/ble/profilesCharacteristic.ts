/*
 * File: c:\enail-magic\src\ble\profilesCharacteristic.ts
 * Project: c:\enail-magic
 * Created Date: Friday August 17th 2018
 * Author: J-Cat
 * -----
 * Last Modified:
 * Modified By:
 * -----
 * License: 
 *    This work is licensed under a Creative Commons Attribution-NonCommercial 4.0 
 *    International License (http://creativecommons.org/licenses/by-nc/4.0/).
 * -----
 * Copyright (c) 2018
 */
import { Characteristic, Descriptor } from 'bleno';
import { throttle } from "lodash";

import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';

import { BlenoResult } from './BlenoResult';
import { App } from '../app';

import { IProfile } from "../profiles/IProfile";
const _profiles: Array<IProfile> = require("../profiles/profiles.json");

export const UUID: string = "10AB3AB3-0F41-408E-A99E-2B523ADEF812";

export class ProfilesCharacteristic extends Characteristic {
    constructor() {
        super({
            uuid: UUID,
            properties: ["read"],
            value: null,
            descriptors: [
                new Descriptor({
                    uuid: "0x2901",
                    value: "eNail Magic Profiles"
                }),
                new Descriptor({
                    uuid: UUID,
                    value: new Buffer("{}")
                })
            ]
        });        

    }

    public onReadRequest(offset: number, callback: (result: BlenoResult, value?: Buffer) => void) {
        const dataStr: string = JSON.stringify(_profiles);
        callback(BlenoResult.RESULT_SUCCESS, new Buffer(dataStr.substr(offset, 255)));
    }
}
