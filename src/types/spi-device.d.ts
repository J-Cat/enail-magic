/*
 * File: c:\pi-nail\pi-nail-server\src\types\spi-device.d.ts
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
declare module 'spi-device' {
    export interface IMessage {
        byteLength: number;
        sendBuffer?: Buffer;
        receiveBuffer?: Buffer;
        speedHz?: number;
        microSecondDelay?: number;
        bitsPerWord?: number;
        chipSelectChange?: boolean;
    }
    
    export interface IConfigurationOptions {
        mode: number;
        chipSelectHigh: boolean;
        lsbFirst: boolean;
        threeWire: boolean;
        loopback: boolean;
        noChipSelect: boolean;
        ready: boolean;
        bitsPerWord: number;
        maxSpeedHz: number;
    }

    export function open(busNumber: number, deviceNumber: number, callback: (err: Error) => void): SpiDevice;

    export class SpiDevice {
        transfer(message: IMessage[], callback: (err: Error, message: IMessage[]) => void): void;
        getOptions(callback: (err: Error, options: IConfigurationOptions) => void): void;
        setOptions(options: IConfigurationOptions, callback: (err: Error) => void): void;
        close(callback: (err: Error) => void): void;
    }

    export const MODE0: number;
    export const MODE1: number;
    export const MODE2: number;
    export const MODE3: number;
}