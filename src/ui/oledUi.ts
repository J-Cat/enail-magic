/*
 * File: c:\enail-magic\src\ui\oled.ts
 * Project: c:\enail-magic
 * Created Date: Monday August 20th 2018
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
import { display, Font, Color, Layer } from 'ssd1306-i2c-js';
import { App } from '../app';
import Icons from './icons';

export class OledUi {
    private app: App;
    private lastUpdate: number = 0;
    private flashStatus: boolean = true;
    private flashRate: number = 0;
    private _icon: Uint8Array = Icons.home;

    constructor(address: number, app: App) {
        this.app = app;
        display.init(1, address);
        display.turnOn();           // Turn on display module
        display.setFont(Font.UbuntuMono_8ptFontInfo);
        this.setIcon(this._icon, 0);
    }

    setIcon(icon: Uint8Array, flashRate: number = 0) {
        this._icon = icon;
        this.flashRate = flashRate;
        this.flashStatus = true;
        this.drawIcon();
    }

    flash = () => {
        setTimeout(() => {
            if (this.flashRate === 0) {
                return;
            }

            if (Date.now() - this.lastUpdate > this.flashRate) {
                this.flashStatus = !this.flashStatus;
                this.lastUpdate = Date.now();
                this.render();
                this.flash();
            }
        }, this.flashRate);
    }

    stop = () => {
        display.clearScreen();
        display.turnOff();
        display.dispose();
    }

    drawIcon = () => {
        this.drawBitmap(this._icon, 97, 40);
        this.flash();
    }

    drawBitmap = (data: Uint8Array, xPos: number, yPos: number) => {
        let s: string = '';
        for (let pos = 0; pos < 72; pos++) {
            for (let c = 0; c < 8; c++) {
                if (((data[pos] >> (7 - c)) & 0b1) === 0b1) {
                    s += 'X';
                    display.drawPixel(
                        ((((pos % 3) * 8) + c) * 1) + xPos, 
                        (Math.floor(pos / 3) * 1) + yPos, 
                        Color.White, 
                        Layer.Layer0);
                } else {
                    s += ' ';
                }
            }
            if (pos % 3 === 1) {
                s += '\n';
            }
        }
        //console.log(s);
    }

    render() {
        // Clear display buffer
        display.clearScreen();
        
        if (!!this.app.currentProfile) {
            display.drawString(0, 0, `${this.app.currentProfile.profileIndex}`, 2, Color.White, Layer.Layer0);

            const s: string = this.app.currentProfile.title;
            let s1: string = s;
            let s2: string = "";
            if (s.length > 17) {
                s1 = s1.substr(0, 17).trim();
                if (s1.length >= 17) {
                    const lastSpace: number = s1.lastIndexOf(' ');
                    if (lastSpace >= 9) {
                        s1 = s1.substr(0, lastSpace);
                    }
                }                         
                s2 = s.substr(s1.length, 17).trim();
                if (s1.length + s2.length < s.length) {
                    s2 = `${s2.substr(0, 13)} ...`;
                }
            }
            display.drawString(22, 0, s1, s2.length === 0 && s1.length <= 9 ? 2 : 1, Color.White, Layer.Layer0);
            if (s2.length > 0) {
                display.drawString(22, 19, s2, 1.75, Color.White, Layer.Layer0);    
            }
        }
        if (this.app.temperature !== 0) {
            display.drawString(0, 48, 
                `${this.app.temperature}`,
                2, Color.White, Layer.Layer0
            );
        }

        if (this.flashStatus) {
            this.drawIcon();
        }

        display.refresh();       
    }
}

