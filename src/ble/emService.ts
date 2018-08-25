/*
 * File: c:\enail-magic\src\ble\emService.ts
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
import * as util from "util";
import { throttle } from "lodash";
import * as Bleno from "bleno";
import { PrimaryService } from "bleno";
import { ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";
import { EMCharacteristic } from "./emCharacteristic";
import { ProfilesCharacteristic } from "./profilesCharacteristic";
import { App } from "../app";

const UUID: string = "2477D9DA-1DA8-4561-AB28-F12007D0499B";

export class EMService {
    private emCh: EMCharacteristic | undefined;
    private profilesCh: ProfilesCharacteristic | undefined;
    private app: App;

    protected _onChangeProfile: SimpleEventDispatcher<number> = new SimpleEventDispatcher<number>();
    get onChangeProfile(): ISimpleEvent<number> {
        return this._onChangeProfile.asEvent();
    }

    protected _onRunProfile: SimpleEventDispatcher<number> = new SimpleEventDispatcher<number>();
    get onRunProfile(): ISimpleEvent<number> {
        return this._onRunProfile.asEvent();
    }

    constructor(app: App) {
        this.app = app;
        Bleno.on("stateChange", (state: string) => {
            if (state === 'poweredOn') {
                Bleno.startAdvertising("eNailMagic", [UUID], this.init.bind(this));
            } else {
                Bleno.stopAdvertising(() => {
                    console.log(`Error stopping advertising Bluetooth service.`);
                });
            }
        });

    }

    init(error: string) {
        if (error) {
            console.log(`Error starting Bluetooth: ${error}`);
            return;
        }

        this.emCh = new EMCharacteristic(this.app);
        this.emCh.onChangeProfile.subscribe((value: number) => {
            this._onChangeProfile.dispatch(value);
        });
        this.emCh.onRunProfile.subscribe((value: number) => {
            this._onRunProfile.dispatch(value);
        });

        this.profilesCh = new ProfilesCharacteristic();

        Bleno.setServices([new PrimaryService({
            uuid: UUID,
            characteristics: [this.emCh, this.profilesCh]
        })], (serviceError) => {
            if (serviceError) {
                console.log(`Error starting Bluetooth service: ${serviceError.message}`);
            }
        });
    }

    sendData = (): void => {
        if (!!this.emCh) {
            this.emCh.onNotify();
        }
    }

    start = (): void => {
    }
}