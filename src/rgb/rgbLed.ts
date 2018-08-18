import { init } from "raspi";
import { SoftPWM } from "raspi-soft-pwm"
import { DigitalOutput } from "raspi-gpio";
import { PULL_DOWN } from "raspi-gpio";

export class RgbLed {
    ledR: SoftPWM | undefined;
    ledG: SoftPWM | undefined;
    ledB: SoftPWM | undefined;
    r: number = 0;
    g: number = 0;
    b: number = 0;
    flashSpeed: number = 0;
    _timeout: NodeJS.Timer | undefined;
    _initPromise: Promise<void>;

    constructor(pinR: string, pinG: string, pinB: string) {
        this._initPromise = new Promise((resolve, reject) => {
            init(() => {
                new DigitalOutput({
                    pin: pinR,
                    pullResistor: PULL_DOWN
                });
                new DigitalOutput({
                    pin: pinG,
                    pullResistor: PULL_DOWN
                });
                new DigitalOutput({
                    pin: pinB,
                    pullResistor: PULL_DOWN
                });
                this.ledR = new SoftPWM(pinR);
                this.ledG = new SoftPWM(pinG);
                this.ledB = new SoftPWM(pinB);
                resolve();
            });
        });
    }

    flash = (count: number = 0, pos: number = 0) => {
        this._initPromise.then(() => {
            if (!!this._timeout) {
                clearTimeout(this._timeout);
                this._timeout = undefined;
            }

            if (this.flashSpeed !== 0) {
                if (count === 0 || pos < count) {                    
                    this.ledR!.write(Math.round(this.r/255 * 100) / 100);
                    this.ledG!.write(Math.round(this.g/255 * 100) / 100);
                    this.ledB!.write(Math.round(this.b/255 * 100) / 100);
                    this._timeout = setTimeout(() => {
                        this.ledR!.write(0);
                        this.ledG!.write(0);
                        this.ledB!.write(0);
                        this._timeout = setTimeout(() => {
                            this.flash(count, pos+1);
                        }, this.flashSpeed * 1000)
                    }, this.flashSpeed * 1000)
                }
            } else {
                this.ledR!.write(Math.round(this.r/255 * 100) / 100);
                this.ledG!.write(Math.round(this.g/255 * 100) / 100);
                this.ledB!.write(Math.round(this.b/255 * 100) / 100);
            }
        });        
    }

    on = (r: number, g: number, b: number, flashSpeed: number) => {
        this.r = r;
        this.g = g;
        this.b = b;
        this.flashSpeed = flashSpeed;
        this.flash();
    }

    flashOn = (r: number, g: number, b: number, flashSpeed: number, count: number) => {
        this.r = r;
        this.g = g;
        this.b = b;
        this.flashSpeed = flashSpeed;
        this.flash(count, 0);
    }

    off = () => {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.flashSpeed = 0;
        this.flash();
    }
}