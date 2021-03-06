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

import * as EMConstants from './constants';

import { IProfile } from "../models";
const _profiles: Array<IProfile> = require("../assets/profiles.json");

export const UUID: string = "10AB3AB3-0F41-408E-A99E-2B523ADEF812";

export class ProfilesCharacteristic extends Characteristic {
    private updateValueCallback: ((value: Buffer) => void) | null = null;
    private profileBase64: string;
    private position: number = 0;
    private key: string = '';
    private maxValueSize: number = 100;

    constructor() {
        super({
            uuid: UUID,
            properties: ["writeWithoutResponse", "notify"],            
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
        this.profileBase64 = Buffer.from(JSON.stringify(_profiles), 'utf8').toString('base64');
    }

    public onNotify() {
        setTimeout(() => 
            {
//                console.log('notify');

                if (this.position >= this.profileBase64.length) {
                    return;
                }

                const chunk: string = this.profileBase64.substr(this.position, this.maxValueSize);
                const complete: boolean = (this.position + this.maxValueSize) >= this.profileBase64.length;

//                console.log(`${this.position}, ${this.maxValueSize}, ${this.profileBase64.length}, ${complete}, ${chunk}`);

                const type: string = `0${EMConstants.EM_FROMSERVER_PROFILES.toString(16)}`.slice(-2);
                if (this.updateValueCallback !== null) {            
                    const s: string = JSON.stringify({
                        type: `0x${type}`, 
                        key: this.key,
                        complete,
                        chunk
                    });

                    this.updateValueCallback(
                        new Buffer(s)
                    );
                }    
                this.position += this.maxValueSize;

                if (!complete) {
                    this.onNotify();
                }
            },
            0
        );
    }
    public onSubscribe(maxValueSize: number, updateValueCallback: (value: Buffer) => void) {
//        console.log('subscribe');
        this.maxValueSize = maxValueSize - 150;
        this.updateValueCallback = updateValueCallback;
    }

    public onUnsubscribe() {
//        console.log('unsubscribe');
        this.updateValueCallback = null;
    }

    public onWriteRequest(data: Buffer, offset: number, withoutResponse: boolean, callback: (result: BlenoResult) => void) {
        try {
            if (offset !== 0) {
                callback(BlenoResult.RESULT_INVALID_OFFSET);
                return;
            }

            const action: (number|string)[] = JSON.parse(data.toString());
            switch (action[0]) {
                case EMConstants.EM_FROMCLIENT_GETPROFILES: {
                    this.position = 0;
                    this.key = action[1] as string;
                    this.onNotify();
                    break;
                }

                default: {
                    callback(BlenoResult.RESULT_UNLIKELY_ERROR);
                    return;
                }
            }
            callback(BlenoResult.RESULT_SUCCESS);
        } catch (e) {
            console.log(e);
        }
    }
}
