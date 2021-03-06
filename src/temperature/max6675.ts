/*
 * File: c:\pi-nail\pi-nail-server\src\temperature\max6675.ts
 * Project: c:\pi-nail\pi-nail-server
 * Created Date: Sunday April 15th 2018
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
import * as spi from "spi-device";
import * as util from "util";
import { TemperatureSensor } from "./temperatureSensor";
import { SensorState } from "./sensorState";

export class Max6675 extends TemperatureSensor {
    private _max6675!: spi.SpiDevice;
    celcius: boolean = false;

    // interval is in seconds
    constructor(busNumber: number, deviceNumber: number, interval: number, celcius: boolean = false) {
        super(interval);
        this.celcius = celcius;
        this._connectionPromise = new Promise<void>((resolve, reject) => {
            this._max6675 = spi.open(busNumber, deviceNumber, (err: Error) => {
                if (err) {
                    reject(`Error connecting to thermocouple: ${err.message}`);
                    this._state = SensorState.Closed;
                }

                resolve();
                this._state = SensorState.Open;
            });
        });
    }

    close = (): void => {
        this._state = SensorState.Closed;
        Promise.resolve(this._connectionPromise)
        .then(() => {
            this._max6675.close((err: Error) => {
                throw err;
            });
        });
    }

    readtemp = (): Promise<number> => {
        return new Promise<number>((resolve, reject) => {
            let message: spi.IMessage[] = [{
                byteLength: 2,
                receiveBuffer: new Buffer(2),
                speedHz: 20000
            }];

            Promise.resolve(this._connectionPromise)
            .then(() => {
                this._max6675.transfer(message, (err: Error, message: spi.IMessage[]) => {
                    if (err) {
                        reject(`Error reading temperature: ${err.message}`);
                    }

                    if (util.isNullOrUndefined(message) || message.length < 1
                        || util.isNullOrUndefined(message[0].receiveBuffer)
                        || (message[0].receiveBuffer as Buffer).length < 2) {
//                        reject("Bad temperature reading.");
                        if (this._state === SensorState.Running) {
                            setTimeout(this.readtemp, this._interval);
                        }
                        return;
                    }

                    const buffer: Buffer = message[0].receiveBuffer as Buffer;

                    let rawValue: number = ((buffer[0] ? buffer[0] : 0) << 8) | (buffer[1] ? buffer[1] : 0);

                    if ((rawValue & 0x4) != 0) {
//                        reject("Bad temperature reading.");
                        if (this._state === SensorState.Running) {
                            setTimeout(this.readtemp, this._interval);
                        }
                        return;
                    }

                    rawValue = (rawValue >> 3) / 4;

                    this._temp = this.celcius ? rawValue : (rawValue * 9.0 / 5.0) + 32;
                    
                    this._onTemperatureRead.dispatch(this, this._temp);

                    resolve(this._temp);

                    if (this._state === SensorState.Running) {
                        setTimeout(this.readtemp, this._interval);
                    }
                });
            })
        });
    }
}