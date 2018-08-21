import { Step, TemperatureStep, TimeStep, SwitchStep, LEDStep, IconStep } from "./steps";
import { IProfile, ISwitchStep, ITimeStep, ITemperatureStep, ILEDStep, IIconStep } from "./IProfile";
import { EventDispatcher, IEvent } from "ste-events";
import { SimpleEventDispatcher, ISimpleEvent } from "strongly-typed-events";
import { App } from "../app";

export class Profile {
    private _temperature: number = 0;
    
    app: App;
    title: string;
    steps: Array<Step>;
    currentIndex: number = 0;
    startTemp: number = 0;
    running: boolean = false;
    profileIndex: number;

    protected _onTemperatureChange: EventDispatcher<Profile, number> = new EventDispatcher<Profile, number>();

    get onTemperatureChange(): IEvent<Profile, number> {
        return this._onTemperatureChange.asEvent();
    }

    protected _onEnd: SimpleEventDispatcher<Profile> = new SimpleEventDispatcher<Profile>();

    get onEnd(): ISimpleEvent<Profile> {
        return this._onEnd.asEvent();
    }

    protected _onNextStep: SimpleEventDispatcher<Profile> = new SimpleEventDispatcher<Profile>();

    get onNextStep(): ISimpleEvent<Profile> {
        return this._onNextStep.asEvent();
    }

    constructor(app: App, profile: IProfile, index: number) {
        this.app = app;
        this.title = profile.title;
        this.profileIndex = index;
        this.steps = profile.steps.map(value => {
            switch (value.type.toLowerCase()) {
                case "switch": {
                    return new SwitchStep(this, (value as ISwitchStep).onoff);
                }

                case "time": {
                    return new TimeStep(this, (value as ITimeStep).delay);
                }

                case "temperature": {
                    const tempStepValue: ITemperatureStep = value as ITemperatureStep;
                    return new TemperatureStep(this, tempStepValue.temperature, tempStepValue.direction);
                }

                case "led": {
                    const ledStepValue: ILEDStep = value as ILEDStep;
                    return new LEDStep(this, ledStepValue.r, ledStepValue.g, ledStepValue.b, ledStepValue.flashSpeed);
                }

                case "icon": {
                    const iconStepValue: IIconStep = value as IIconStep;
                    return new IconStep(this, iconStepValue.icon, iconStepValue.flashRate);
                }

                default: {
                    throw new Error(`Invalid step type specified in profile! ${JSON.stringify(value)}`);
                }
            }
        });
    }

    private get currentStep(): Step {
        if (this.currentIndex < this.steps.length) {
            return this.steps[this.currentIndex];
        } else {
            throw new Error("The current step index exceeds the # of steps!");
        }
    }

    set temperature(value: number) {
        if (value !== this._temperature) {
            this._temperature = value;
            this._onTemperatureChange.dispatch(this, value);
        }
    }

    get temperature(): number {
        return this._temperature;
    }

    run = () => {
        if (this.steps.length === 0) {
            throw new Error("No steps defined!");
        }

        this.currentIndex = 0;
        this.running = true;
        this.startTemp = this.temperature;
        this.steps[0].onEnd.subscribe(this.nextStep);
        this.steps[0].run();
    }

    abort = () => {
        if (this.running) {
            this.currentIndex = 0;
            this.running = false;
            this._onEnd.dispatch(this);
        }
    }

    nextStep = (step: Step) => {
        if (!this.running) {
            return;
        }
        
        this._onNextStep.dispatch(this);
        this.steps[this.currentIndex].onEnd.unsubscribe(this.nextStep);
        this.currentIndex = this.currentIndex + 1;
        if (this.currentIndex < this.steps.length) {
            this.steps[this.currentIndex].onEnd.subscribe(this.nextStep);
            this.steps[this.currentIndex].run();
        } else {
            this.currentIndex = 0;
            this.running = false;
            this._onEnd.dispatch(this);
        }
    }
}
