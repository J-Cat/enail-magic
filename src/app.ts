import * as util from "util";
import * as fs from 'fs';
import * as path from 'path';
import { init } from "raspi";
import { DigitalInput, DigitalOutput, PULL_UP } from "raspi-gpio";

import { TemperatureSensor, Max6675 } from "./temperature";
import { Profile, Profiles } from "./profiles";
import { ConsoleUi } from "./ui/consoleUi";
import { RotaryDial } from "./ui/rotaryDial";
import { RgbLed } from "./rgb";

import { EMService } from "./ble/emService";
import { OledUi } from "./ui/oledUi";
import Icons from "./ui/icons";

const isHeaterNC: boolean = true;

export class App {
    private consoleUi: { render: () => void };
    private oledUi: OledUi;
    private dial: RotaryDial;
    private heater: DigitalOutput | undefined;
    private profiles: Profiles = new Profiles(this);
    private rgbLed: RgbLed;
    private emService: EMService;
    profileIndex: number = 0;
    temperature: number = 0;
    temperatureDecimals: number = 0;
    temperatureShift: number = 0;

    get currentProfile(): Profile {
        if (this.profileIndex < this.profiles.items.length) {
            return this.profiles.items[this.profileIndex];
        } else {
            throw new Error("Profile index is out of range!");
        }
    }

    setProfile(index: number) {
        if (index >= 0 && index < this.profiles.items.length) {
            this.profileIndex = index;

            fs.writeFile(path.resolve('~/.enailmagic'), this.profileIndex, (error) => {});
            //this.rgbLed.flashOn(0, 0, 25, 0.25, this.profileIndex + 1);
            this.render();
        }
    }


    onTemperatureRead: (source: TemperatureSensor, value: number) => void = (source: TemperatureSensor, value: number) => {
        if (!util.isNumber(value)) {
            return;
        }

        // store temperature to 1 decimal place
        const roundingNumber: number = Math.pow(10, this.temperatureDecimals);
        this.temperature = (Math.round(value * roundingNumber) / roundingNumber) + this.temperatureShift;
        this.profiles.items.forEach((profile) => {
            profile.temperature = this.temperature;
        });

        this.render();
    };

    onClockwise: (source: RotaryDial) => void = (source: RotaryDial) => {
        if (this.currentProfile.running) {
            return;
        }

        let newIndex: number = this.profileIndex + 1;
        if (newIndex >= this.profiles.items.length) {
            newIndex = 0;
        }

        this.setProfile(newIndex);
    }

    onCounterClockwise: (source: RotaryDial) => void = (source: RotaryDial) => {
        if (this.currentProfile.running) {
            return;
        }

        let newIndex: number = this.profileIndex - 1;
        if (newIndex < 0) {
            newIndex = this.profiles.items.length - 1;
        }

        this.setProfile(newIndex);
    }

    onButton: (source: RotaryDial) => void = (source: RotaryDial) => {
        if (!this.currentProfile.running) {
            this.currentProfile.onEnd.one((profile: Profile) => {
                this.currentProfile.onNextStep.unsubscribe(this.onNextStep);
                this.oledUi.setIcon(Icons.home, 0);
                this.rgbLed.off();
                this.switchHeater(1);
            });

            this.currentProfile.onNextStep.subscribe(this.onNextStep);

            this.currentProfile.run();

            this.render();
        } else {
            this.currentProfile.abort();

            this.render();
        }
    }

    onNextStep: (profile: Profile) => void = (profile: Profile) => {
        this.render();
    }

    onBleChangeProfile: (index: number) => void = (index: number) => {
        if (this.currentProfile.running || index === this.profileIndex) {
            return;
        }

        this.setProfile(index);
    }

    switchHeater: (onoff: number) => void = (onoff: number) => {
        if (!!this.heater) {
            this.heater.write(isHeaterNC ? onoff === 0 ? 1 : 0: onoff);
        }
    }

    emitColor: (r: number, g: number, b: number, flashSpeed:number) => void = (r: number, g: number, b: number, flashSpeed:number) => {
        this.rgbLed.on(r, g, b, flashSpeed);
    }

    setIcon: (icon: Uint8Array, flashSpeed: number) => void = (icon: Uint8Array, flashSpeed: number) => {
        this.oledUi.setIcon(icon, flashSpeed);
    }

    // cleanup
    cleanup: () => void = () => {
        fs.writeFile(path.resolve('~/.enailmagic'), this.profileIndex, (error) => {});
        this.switchHeater(1);
        this.oledUi.stop();
    };

    render() {
        this.emService.sendData();
        this.oledUi.render();
        this.consoleUi.render();
    }

    constructor() {      
        // capture process termination to ensure cleanup
        process.on("exit", code => {
            this.cleanup();
        });

        process.on("uncaughtException", err => {
            this.cleanup();
            console.log(err);
            process.exit();
        });

        const tempSensor: TemperatureSensor = new Max6675(1, 2, 0.5);
        tempSensor.onTemperatureRead.subscribe(this.onTemperatureRead);
        tempSensor.start();

        this.dial = new RotaryDial('GPIO23', 'GPIO24', 'GPIO22');
        this.dial.onClockwise.subscribe(this.onClockwise);
        this.dial.onCounterClockwise.subscribe(this.onCounterClockwise);
        this.dial.onButton.subscribe(this.onButton);

        this.rgbLed = new RgbLed('GPIO18', 'GPIO15', 'GPIO14');
        this.rgbLed.off();        

        fs.readFile(path.resolve('./settings.txt'), (error, data) => {
            if (!!error) {
                console.log(error.message);
            } else {
                try {
                    this.profileIndex = parseInt(data.toString(), 10);
                } catch (e) {
                    this.profileIndex = 0;
                }
            }
        });

        init(() => {
            this.heater = new DigitalOutput({
                pin: 'GPIO12'
            });
            this.switchHeater(1);
        });

        this.emService = new EMService(this);
        this.emService.onChangeProfile.subscribe(this.onBleChangeProfile);
        this.emService.sendData();

        this.oledUi = new OledUi(0x3C, this);

//        this.consoleUi = new ConsoleUi(this);
        this.consoleUi = {
            render: () => {}
        };
    }
}

const app: App = new App();
