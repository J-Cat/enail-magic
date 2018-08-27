import { EventDispatcher, IEvent } from "ste-events";
import { SimpleEventDispatcher, ISimpleEvent } from "strongly-typed-events";

import { App } from "../app";
import { IProfile, IActionStep, IConditionalStep, IFeedbackStep } from "../models";
import { Step } from "./profileSteps/step";
import { ActionStep } from "./profileSteps/actionStep";
import { ConditionalStep } from "./profileSteps/conditionalStep";
import { FeedbackStep } from "./profileSteps";

import statistics from '../statistics/statistics';
import { IProfileStatistic, IStatisticData } from "../statistics/IStatistics";

export class Profile {
    private _temperature: number = 0;
    
    app: App;
    key: number;
    title: string;
    steps: Array<Step>;
    currentIndex: number = 0;
    startTemp: number = 0;
    startTime: number = 0;
    endTime: number = 0;
    running: boolean = false;
    aborted: boolean = false;
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
        this.key = profile.key || index;
        this.title = profile.title;
        this.profileIndex = index;
        this.steps = profile.steps.map((value, stepIndex) => {
            switch (value.type.toLowerCase()) {
                case "action": {
                    return new ActionStep(value as IActionStep, this, stepIndex);
                }

                case "conditional": {
                    return new ConditionalStep(value as IConditionalStep, this, stepIndex);
                }

                case "feedback": {
                    return new FeedbackStep(value as IFeedbackStep, this, stepIndex);
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
        this.aborted = false;
        this.startTemp = this.temperature;
        this.startTime = Date.now();
        this.steps[0].onEnd.subscribe(this.nextStep);
        this.steps[0].beforeRun(this.steps[0].run.bind(this.steps[0].afterRun));
    }

    abort = () => {
        if (this.running) {
            this.currentIndex = 0;
            this.aborted = true;
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
            this.steps[this.currentIndex].beforeRun(
                this.steps[this.currentIndex].run.bind(
                    this.steps[this.currentIndex].afterRun
                )
            );
        } else {
            this.currentIndex = 0;
            this.running = false;
            this.endTime = Date.now();
            this.saveStatistics();
            this._onEnd.dispatch(this);
        }
    }

    public percentComplete = (): number => {
        const estimate: number = statistics.getEstimate(this.key);
        if (estimate !== 0) {
            return estimate;
        } else {
            return Math.round(this.currentIndex / this.steps.length * 100) / 100;
        }
    }

    private saveStatistics = () => {
        const profileTime: number = Math.max(this.endTime - this.startTime, 0);
        if (profileTime === 0) { // don't save 0's !
            return;
        }

        const state: IProfileStatistic = statistics.Statistics[this.key] || {
            key: this.profileIndex,
            data: {
            },
            steps: {}
        };
        state.data = {
            lastRunTime: profileTime,
            runtimes: [...(state.data.runtimes || []), profileTime].slice(0, 10)
        };

        this.steps.forEach((step, index) => {
            const stepTime: number = Math.max(step.endTime - step.startTime, 0);
            if (stepTime !== 0) {
                const stepData: IStatisticData = state.steps[step.key] || { 
                    lastRunTime: 0, runtimes: [] 
                };
                state.steps[step.key] ={
                    lastRunTime: stepTime,
                    runtimes: [...(stepData.runtimes || []), stepTime].slice(0, 10)
                };
            }
        });
        
        statistics.Statistics[this.key] = state;
        statistics.save();
    }
}
