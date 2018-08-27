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

    protected _onEnd: SimpleEventDispatcher<Step> = new SimpleEventDispatcher<Step>();
    get onEnd(): ISimpleEvent<Step> {
        return this._onEnd.asEvent();
    }

    constructor(step: IStep, profile: Profile, index: number) {
        this.step = step;
        this.profile = profile;
        this.key = step.key || index;
    }

    public getText = (): string => {
        return this.profile.title;
    }

    abstract run: (afterFunc: () => void) => void;

    public beforeRun = (runFunc: (afterFunc: () => void) => void) => {
        this.startTime = Date.now();
        this.running = true;
        this.state = 0;

        if (!!this.step.sounds && !!this.step.sounds.start) {
            this.profile.app.soundPlayer.play(this.step.sounds.start);
        }

        // if timeout timer set that one up to
        // check timer
        if (!!this.step.delays && !!this.step.delays.timeout) {
            if (this.step.delays.timeout > 0) {
                this.timeout = true;
                new Promise((resolve, reject) => {
                    setTimeout(resolve.bind(null), this.step.delays!.timeout! * 1000);
                }).then(() => {
                    if (this.state < 1 && this.running) {
                        this.state = 1;
                        console.log("TIMED OUT!!!!!!!!!!!!!!!!!!!!");
                        this.afterRun();;
                    }
                });
            }
        }

        // check start timer
        if (!!this.step.delays && !!this.step.delays.start) {
            if (this.step.delays.start > 0) {
//                console.log(`START TIMER - ${this.step.delays.start}`);
                new Promise((resolve, reject) => {
                    setTimeout(resolve.bind(null), this.step.delays!.start! * 1000);
                }).then(() => {
//                    console.log(`START TIMER DONE!`);
                    this.run(this.afterRun);
                });
                return;
            } 
        } 

        this.run(this.afterRun);
    }

    public afterRun = () => {
        this.state = 2;
        
        if (!!this.step.sounds && !!this.step.sounds.end) {
            this.profile.app.soundPlayer.play(this.step.sounds.end);
        }

        // check end timer
        if (!!this.step.delays && !!this.step.delays.end) {
            if (this.step.delays.end > 0) {
//                console.log(`END TIMER - ${this.step.delays.end}`);
                new Promise((resolve, reject) => {
                    setTimeout(resolve.bind(null), this.step.delays!.end! * 1000);
                }).then(() => {
//                    console.log('END TIMER! (MAYBE?)');
                    if (this.state < 3) {
                        this.state = 3;
                        this.complete();
                    }
                })
                return;
            } 
        } 
    
        this.complete();
    }

    public complete = () => {
        this.state = 3;
        this.running = false;
        this.timeout = false;
        this.endTime = Date.now();

//        console.log('complete!');
        this._onEnd.dispatch(this);
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

