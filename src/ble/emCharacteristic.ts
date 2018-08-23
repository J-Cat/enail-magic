/*
 * File: c:\enail-magic\src\ble\emCharacteristic.ts
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
import { SimpleEventDispatcher, ISimpleEvent } from 'ste-simple-events';

import { BlenoResult } from './BlenoResult';
import { App } from '../app';

import * as EMConstants from './constants';

export const UUID: string = "7475AB88-90C4-4A98-A95E-19D5CAB55EEB";

export class EMCharacteristic extends Characteristic {
    private updateValueCallback: ((value: Buffer) => void) | null = null;
    private app: App;
    private lastResult?: number[];

    protected _onChangeProfile: SimpleEventDispatcher<number> = new SimpleEventDispatcher<number>();
    get onChangeProfile(): ISimpleEvent<number> {
        return this._onChangeProfile.asEvent();
    }

    protected _onChangeStatus: SimpleEventDispatcher<boolean> = new SimpleEventDispatcher<boolean>();
    get onChangeStatus(): ISimpleEvent<boolean> {
        return this._onChangeStatus.asEvent();
    }

    constructor(app: App) {
        super({
            uuid: UUID,
            properties: ["read", "writeWithoutResponse", "notify"],
            value: null,
            descriptors: [
                new Descriptor({
                    uuid: "0x2901",
                    value: "eNail Magic Characteristic"
                }),
                new Descriptor({
                    uuid: UUID,
                    value: new Buffer("{}")
                })
            ]
        });        

        this.app = app;
    }

    private isChanged = (result: number[]): boolean => {
        let changed: boolean = false;
        if (!this.lastResult) {
            changed = true;
        } else if (result.length !== this.lastResult.length) {
            changed = true;
        } else {
            for (let i = 0; i < result.length; i++) {
                if (result[i] !== this.lastResult[i]) {
                    changed = true;
                    break;                    
                }
            }
        }

        if (changed) {
            this.lastResult = result;
        }

        return changed;
    }

    public onNotify() {
        setTimeout(() => 
            {
                if (this.updateValueCallback !== null) {            
                    const type: string = `0${EMConstants.EM_FROMSERVER_DATA.toString(16)}`.slice(-2);
                    const result: { type: string, data: number[] } = {
                        type: `0x${type}`,
                        data: [
                            this.app.temperature, 
                            this.app.currentProfile.running ? 1 : 0, 
                            this.app.profileIndex, 
                            this.app.currentProfile.currentIndex
                        ]
                    };  

                    if (this.isChanged(result.data)) {
                        console.log(JSON.stringify(result));
                        this.updateValueCallback(
                            new Buffer(JSON.stringify(result))
                        );
                    }
                }
            },
            0
        );
    }

    public onSubscribe(maxValueSize: number, updateValueCallback: (value: Buffer) => void) {
        this.updateValueCallback = updateValueCallback;
    }

    public onUnsubscribe() {
        this.updateValueCallback = null;
    }


    public onReadRequest(offset: number, callback: (result: BlenoResult, value?: Buffer) => void) {
        if (offset !== 0) {
            callback(BlenoResult.RESULT_INVALID_OFFSET);
            return;
        }

        const result: number[] = [
            this.app.temperature, 
            this.app.currentProfile.running ? 1 : 0, 
            this.app.profileIndex, 
            this.app.currentProfile.currentIndex
        ];  

        const type: string = `0${EMConstants.EM_FROMSERVER_DATA.toString(16)}`.slice(-2);
        callback(BlenoResult.RESULT_SUCCESS, new Buffer(JSON.stringify({
            type: `0x${type}`, 
            data: result
        })));
}

    public onWriteRequest(data: Buffer, offset: number, withoutResponse: boolean, callback: (result: BlenoResult) => void) {
        if (offset !== 0) {
            callback(BlenoResult.RESULT_INVALID_OFFSET);
            return;
        }

        const action: number[] = JSON.parse(data.toString());
        switch (action[0]) {
            case EMConstants.EM_FROMCLIENT_SETPROFILE: {
                this._onChangeProfile.dispatch(action[1] as number);
                break;
            }

            case EMConstants.EM_FROMCLIENT_SETSTATUS: {
                this._onChangeStatus.dispatch(action[1] === 1 ? true : false);
                break;
            }

            default: {
                callback(BlenoResult.RESULT_UNLIKELY_ERROR);
                return;
            }
        }
        callback(BlenoResult.RESULT_SUCCESS);
    }
}