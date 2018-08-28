import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as os from 'os';
import Icons from './ui/icons';
import SoundPlayer from './aplay';
import { ConsoleUi } from './ui/consoleUi';
import { DigitalOutput, PULL_DOWN } from 'raspi-gpio';
import { EMService } from './ble/emService';
import { init } from 'raspi';
import { Max6675, TemperatureSensor } from './temperature';
import { OledUi } from './ui/oledUi';
import { Profile, Profiles } from './profiles';
import { RgbLed } from './rgb';
import { RotaryDial } from './ui/rotaryDial';
import onExit = require('signal-exit');
// import Sound, { ISound } from 'aplay';

//const aplay: (options?: SoundOptions) => Sound = require('aplay');

const isHeaterNC: boolean = true;

export class App {
    private consoleUi: { render: () => void };
    public oledUi: OledUi;
    private dial: RotaryDial;
    private heater: DigitalOutput | undefined;
    private profiles: Profiles = new Profiles(this);
    private rgbLed: RgbLed;
    private emService: EMService;
    soundPlayer: SoundPlayer;
    profileIndex: number = 0;
    temperature: number = 0;
    temperatureDecimals: number = 0;
    temperatureShift: number = 0;

    get currentProfile(): Profile {
        if (this.profileIndex < this.profiles.items.length && this.profileIndex >= 0) {
            return this.profiles.items[this.profileIndex];
        } else {
            throw new Error("Profile index is out of range!");
        }
    }

    setProfile(index: number) {
        if (this.currentProfile.running) {
            return;
        }

        if (index >= 0 && index < this.profiles.items.length) {
            this.profileIndex = index;

            fs.writeFile(path.join(os.homedir(), '.enailmagic'), this.profileIndex.toString(), (error) => {
                if (error) {
                    console.log(error.message);
                }
            });

            this.oledUi.resetPosition();
            
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
        this.runProfile(this.profileIndex);
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

    onBleRunProfile: (index: number) => void = (index: number) => {
        this.runProfile(index);
    }

    private runProfile = (index: number) => {
        if (!this.currentProfile.running) {
            this.currentProfile.onEnd.one((profile: Profile) => {
                this.currentProfile.onNextStep.unsubscribe(this.onNextStep);
                this.oledUi.setIcon(Icons.home, 0);
                this.rgbLed.off();
                this.soundPlayer.play('complete');
                this.switchHeater(1);
            });

            this.setProfile(index);

            this.currentProfile.onNextStep.subscribe(this.onNextStep);

            this.currentProfile.run();

            this.render();
        } else {
            this.soundPlayer.play('disconnected');
            this.currentProfile.abort();

            this.setProfile(index);

            this.render();
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

    setIcon: (icon: Uint8Array, flashSpeed: number) => void = (icon: Uint8Array, flashSpeed: number) => {
        this.oledUi.setIcon(icon, flashSpeed);
    }

    render() {
        this.emService.sendData();
        //this.oledUi.render();
        this.consoleUi.render();
    }

    private loadConfig = () => {
        fs.readFile(path.join(os.homedir(), `.enailmagic`), (error, data) => {
            if (!!error) {
                console.log(error.message);
            } else {
                try {
                    this.profileIndex = parseInt(data.toString(), 10);
                    if (isNaN(this.profileIndex) || this.profileIndex < 0 || this.profileIndex >= this.profiles.items.length) {
                        this.profileIndex = 0;
                    }
                } catch (e) {
                    this.profileIndex = 0;
                }
            }
        });
    }

    constructor() {      
        this.loadConfig();

        const tempSensor: TemperatureSensor = new Max6675(0, 0, 0.5);
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
                pin: 'GPIO12',
                pullResistor: PULL_DOWN
            });
            this.switchHeater(1);
        });

        this.emService = new EMService(this);
        this.emService.onChangeProfile.subscribe(this.onBleChangeProfile);
        this.emService.onRunProfile.subscribe(this.onBleRunProfile);
        this.emService.sendData();

        this.soundPlayer = new SoundPlayer({
            basePath: `${__dirname}/assets/sounds/`
        });
        this.soundPlayer.play(`appear`);

        this.oledUi = new OledUi(0x3C, this);
        this.oledUi.render();

        if (process.argv.length > 2 && process.argv[2].toLowerCase() === 'debug')
        {
            this.consoleUi = {
                render: () => {}
            };                
        } else {
            this.consoleUi = new ConsoleUi(this);
        }

        this.render();
    }
}

const app: App = new App();

onExit((exitCode, signal) => { 
    console.log('Closing eNail Magic ...');
    console.log('  Saving configuration ...');
    fs.writeFile(path.join(os.homedir(), `.enailmagic`), app.profileIndex.toString(), (error) => {
        if (error) {
            console.log(`  Error saving configuration: ${error.message}`);
        } else {
            console.log('  Configuration saved.');
        }
    });
    console.log('  Turning off heater ...');
    app.switchHeater(1);
    console.log('  Clearing display ...');
    if (!!app.oledUi) {
        app.oledUi.stop();
        console.log('  Display cleared.');
    }
    console.log('Done.');
});