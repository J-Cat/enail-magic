/*
 * File: c:\enail-magic\src\profiles\profileSteps\step.ts
 * Project: c:\enail-magic
 * Created Date: Saturday August 25th 2018
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
import { ISimpleEvent, SimpleEventDispatcher } from 'strongly-typed-events';
import { Profile } from '../profile';
import { IStep, IActionStep, IConditionalStep, IFeedbackStep } from '../../models';
import statistics from '../../statistics/statistics';
import { IProfileStatistic, IStatisticData } from "../../statistics/IStatistics";

export abstract class Step {
    key: number;
    startTime: number = 0;
    endTime: number = 0;
    state: number = 0;
    profile: Profile;
    step: IStep | IActionStep | IConditionalStep | IFeedbackStep;
    running: boolean = false;
    timeout: boolean = false;
    timeoutTimer?: NodeJS.Timer;

    protected _onTimeout: SimpleEventDispatcher<Step> = new SimpleEventDispatcher<Step>();
    get onTimeout(): ISimpleEvent<Step> {
        return this._onTimeout.asEvent();
    }

    constructor(step: IStep, profile: Profile, index: number) {
        this.step = step;
        this.profile = profile;
        this.key = step.key || index;
    }

    public getText = (): string => {
        return this.profile.title;
    }

    abstract run: (step: Step) => Promise<Step>;

    public start = (): Promise<Step> => {
        // if timeout timer set that one up to
        // check timer
        if (!!this.step.delays && !!this.step.delays.timeout) {
            if (this.step.delays.timeout > 0) {
                setTimeout((step) => {
                    if (step.state < 1 && step.running) {
                        step.timeout = true;
                        step.state = 1;
                        // this needs to be intercepted in each individual run method
                        // of the steps to cancel out
                        step._onTimeout.dispatch(step);
                    }
                }, this.step.delays!.timeout! * 1000, this);
            }
        }

        return new Promise((resolve, reject) => {
            this.startTime = Date.now();
            this.running = true;
            this.state = 0;

            if (!!this.step.sounds && !!this.step.sounds.start) {
                this.profile.app.soundPlayer.play(this.step.sounds.start);
            }

            // check start timer
            if (!!this.step.delays && !!this.step.delays.start) {
                if (this.step.delays.start > 0) {
                    setTimeout((step) => {
                        resolve(step);
                    }, this.step.delays!.start! * 1000, this);
                } else {
                    resolve(this);    
                }
            } else {
                resolve(this);    
            }
        });
    }

    public afterRun = (step: Step): Promise<Step> => {
        // got here so no more timeout which is only for main loop
        // cancel timeout
        if (!!this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            delete(this.timeoutTimer);
        }
        return new Promise((resolve, reject) => {
            this.state = 2;
            
            // check end timer
            if (!!this.step.delays && !!this.step.delays.end) {
                if (this.step.delays.end > 0) {
                    setTimeout((step) => {
                        if (step.state < 3) {
                            step.state = 3;
                            resolve(step)
                        }
                    }, this.step.delays!.end! * 1000, this);
                    return;
                } 
            } 
        
            resolve(this);
        });
    }

    public complete = (step: Step): Promise<Step> => {
        return new Promise((resolve, reject) => {
            if (!!this.step.sounds && !!this.step.sounds.end && this.running) {
                this.profile.app.soundPlayer.play(this.step.sounds.end);
            }

            if (!!this.timeoutTimer) {
                this.timeoutTimer.unref();
            }
            this.state = 3;
            this.running = false;
            this.timeout = false;
            this.endTime = Date.now();

            resolve(this);
        });
    }

    // by default just return 100% complete for immediate steps, they are done when they start!
    get percentComplete(): number {
        const estimate: number = statistics.getStepEstimate(this.profile.key, this.key);
        if (estimate !== 0) {
            return estimate;
        } else {
            return this.running ? 0 : 1;
        }
    }
}

