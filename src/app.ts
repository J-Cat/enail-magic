import * as util from "util";
import { init } from "raspi";
import { DigitalInput, DigitalOutput, PULL_UP } from "raspi-gpio";

import { TemperatureSensor, Max6675 } from "./temperature";
import { Profile, Profiles } from "./profiles";
import { ConsoleUi } from "./ui/consoleUi";
import { RotaryDial } from "./ui/rotaryDial";
import { RgbLed } from "./rgb";

import { EMService } from "./ble/emService";

const isHeaterNC: boolean = true;

export class App {
    private consoleUi: { render: () => void };
    private dial: RotaryDial;
    private heater: DigitalOutput | undefined;
    private profiles: Profiles = new Profiles(this);
    private rgbLed: RgbLed;
    private emService: EMService;
    profileIndex: number = 0;
    temperature: number = 0;

    get currentProfile(): Profile {
        if (this.profileIndex < this.profiles.items.length) {
            return this.profiles.items[this.profileIndex];
        } else {
            throw new Error("Profile index is out of range!");
        }
    }


    onTemperatureRead: (source: TemperatureSensor, value: number) => void = (source: TemperatureSensor, value: number) => {
        if (!util.isNumber(value)) {
            return;
        }

        // store temperature to 1 decimal place
        this.temperature = Math.round(value * 10) / 10;
        this.profiles.items.forEach((profile) => {
            profile.temperature = this.temperature;
        });

        this.emService.sendData();
        this.consoleUi.render();
    };

    onClockwise: (source: RotaryDial) => void = (source: RotaryDial) => {
        if (this.currentProfile.running) {
            return;
        }

        this.profileIndex += 1;
        if (this.profileIndex >= this.profiles.items.length) {
            this.profileIndex = 0;
        }

        this.rgbLed.flashOn(0, 0, 25, 0.25, this.profileIndex + 1);

        this.emService.sendData();
        this.consoleUi.render();
    }

    onCounterClockwise: (source: RotaryDial) => void = (source: RotaryDial) => {
        if (this.currentProfile.running) {
            return;
        }

        this.profileIndex -= 1;
        if (this.profileIndex < 0) {
            this.profileIndex = this.profiles.items.length - 1;
        }

        this.rgbLed.flashOn(0, 0, 25, 0.25, this.profileIndex + 1);

        this.emService.sendData();
        this.consoleUi.render();
    }

    onButton: (source: RotaryDial) => void = (source: RotaryDial) => {
        if (!this.currentProfile.running) {
            this.currentProfile.onEnd.one((profile: Profile) => {
                this.currentProfile.onNextStep.unsubscribe(this.onNextStep);
                this.rgbLed.off();
                this.switchHeater(1);
            });

            this.currentProfile.onNextStep.subscribe(this.onNextStep);

            this.currentProfile.run();

            this.emService.sendData();
            this.consoleUi.render();
        } else {
            this.currentProfile.abort();

            this.emService.sendData();
            this.consoleUi.render();
        }
    }

    onNextStep: (profile: Profile) => void = (profile: Profile) => {
        this.emService.sendData();
        this.consoleUi.render();
    }

    onBleChangeProfile: (index: number) => void = (index: number) => {
        if (this.currentProfile.running || index === this.profileIndex) {
            return;
        }

        if (index >= 0 && index < this.profiles.items.length) {
            this.profileIndex = index;

            this.rgbLed.flashOn(0, 0, 25, 0.25, this.profileIndex + 1);
            this.consoleUi.render();
        }
    }

    switchHeater: (onoff: number) => void = (onoff: number) => {
        if (!!this.heater) {
            this.heater.write(isHeaterNC ? onoff === 0 ? 1 : 0: onoff);
        }
    }

    emitColor: (r: number, g: number, b: number, flashSpeed:number) => void = (r: number, g: number, b: number, flashSpeed:number) => {
        this.rgbLed.on(r, g, b, flashSpeed);
    }

    // cleanup
    cleanup: () => void = () => {
        this.switchHeater(1);
    };

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

        init(() => {
            this.heater = new DigitalOutput({
                pin: 'GPIO12'
            });
            this.switchHeater(1);
        });

        this.emService = new EMService(this);
        this.emService.onChangeProfile.subscribe(this.onBleChangeProfile);
        this.emService.sendData();

        this.consoleUi = new ConsoleUi(this);
        // this.consoleUi = {
        //     render: () => {}
        // };
        this.consoleUi.render();
    }
}

const app: App = new App();
