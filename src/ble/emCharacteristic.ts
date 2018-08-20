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

    public onNotify() {
        setTimeout(() => 
            {
                if (this.updateValueCallback !== null) {            
                    this.updateValueCallback(
                        new Buffer(
                            JSON.stringify({
                                type: EMConstants.EM_FROMSERVER_DATA, 
                                data: {
                                    temperature: this.app.temperature,
                                    status: this.app.currentProfile.running,
                                    profileIndex: this.app.profileIndex,
                                    stepIndex: this.app.currentProfile.running ? this.app.currentProfile.currentIndex : 0
                                }
                            })
                        )
                    );
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

        callback(BlenoResult.RESULT_SUCCESS, new Buffer(JSON.stringify({
            temperature: this.app.temperature,
            status: this.app.currentProfile.running,
            profileIndex: this.app.profileIndex,
            stepIndex: this.app.currentProfile.running ? this.app.currentProfile.currentIndex : 0
        })));
    }

    public onWriteRequest(data: Buffer, offset: number, withoutResponse: boolean, callback: (result: BlenoResult) => void) {
        if (offset !== 0) {
            callback(BlenoResult.RESULT_INVALID_OFFSET);
            return;
        }

        const action: { type: string, value: number | boolean } = JSON.parse(data.toString());
        switch (action.type) {
            case EMConstants.EM_FROMCLIENT_SETPROFILE: {
                this._onChangeProfile.dispatch(action.value as number);
                break;
            }

            case EMConstants.EM_FROMCLIENT_SETSTATUS: {
                this._onChangeStatus.dispatch(action.value as boolean);
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