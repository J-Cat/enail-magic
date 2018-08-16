import { IEvent, SimpleEventDispatcher, ISimpleEvent } from "strongly-typed-events";
import { Profile } from "./profile";
import { RgbLed } from "../rgb";

export abstract class Step {
    _profile: Profile;

    constructor(profile: Profile) {
        this._profile = profile;
    }

    protected _onEnd: SimpleEventDispatcher<Step> = new SimpleEventDispatcher<Step>();

    abstract run: () => void;

    get onEnd(): ISimpleEvent<Step> {
        return this._onEnd.asEvent();
    }

}

export class TimeStep extends Step {
    private _delay: number;
    
    // delay in seconds
    constructor(profile: Profile, delay: number = 5) {
        super(profile);

        this._delay = delay;
    }

    run = () => {
        setTimeout(() => {
            this._onEnd.dispatch(this);
        }, this._delay * 1000);
    }
}

export class TemperatureStep extends Step {
    _temperature: number;
    _direction: number; // 0 = dropping, 1 = climbing
    private _timeout: number;
    private _timer: NodeJS.Timer | undefined;

    constructor(profile: Profile, temperature: number, direction: number = 0, timeout: number = 60) {
        super(profile);

        this._temperature = temperature;
        this._direction = direction;
        this._timeout = timeout;
    }

    run = () => {
        this._profile.onTemperatureChange.subscribe(this.onTemperatureChange);

        this._timer = setTimeout(() => {
            this._onEnd.dispatch(this);
        }, this._timeout * 1000);
    }

    onTemperatureChange = (profile: Profile, value: number) => {
        try {
            const checkTemp: number = profile.startTemp + this._temperature;

            switch (this._direction) {
                case 0: {
                    if (value <= checkTemp) {
                        profile.onTemperatureChange.unsubscribe(this.onTemperatureChange);
                        if (!!this._timer) {
                            clearTimeout(this._timer);
                        }
                        this._onEnd.dispatch(this);
                    }
                    break;
                }

                case 1: {
                    if (value >= checkTemp) {
                        profile.onTemperatureChange.unsubscribe(this.onTemperatureChange);
                        if (!!this._timer) {
                            clearTimeout(this._timer);
                        }
                        this._onEnd.dispatch(this);
                    }
                    break;
                }
            }
        } catch (e) {
            console.debug(e.message);
        }
    }
}

export class SwitchStep extends Step {
    private _onoff: number;

    run = () => {
        this._profile.app.switchHeater(this._onoff);
        this._onEnd.dispatch(this);
    }

    constructor(profile: Profile, onoff: number) {
        super(profile);

        this._onoff = onoff;
    }
}

export class LEDStep extends Step {
    r: number;
    g: number;
    b: number;
    flashSpeed: number;
    
    constructor(profile: Profile, r: number, g: number, b: number, flashSpeed: number) {
        super(profile);

        this.r = r;
        this.g = g;
        this.b = b;
        this.flashSpeed = flashSpeed;
    }

    run = () => {
        this._profile.app.emitColor(this.r, this.g, this.b, this.flashSpeed);
        this._onEnd.dispatch(this);
    }
}