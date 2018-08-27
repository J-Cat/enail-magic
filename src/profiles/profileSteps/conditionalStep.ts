/*
 * File: c:\enail-magic\src\profiles\profileSteps\conditionalStep.ts
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
import { ISimpleEvent, SimpleEventDispatcher } from 'ste-simple-events';

import { Direction, IConditionalStep } from '../../models';
import { Step } from './step';
import { Profile } from '..';
import { IStatisticData } from '../../statistics/IStatistics';

export class ConditionalStep extends Step {    
    resolveFunc?: () => void;

    protected _onTempReached: SimpleEventDispatcher<Step> = new SimpleEventDispatcher<Step>();
    get onTempReached(): ISimpleEvent<Step> {
        return this._onTempReached.asEvent()
    }

    constructor(step: IConditionalStep, profile: Profile, index: number) {
        super(step, profile, index);
    }

    public run = (afterFunc: () => void) => {
        this.profile.onTemperatureChange.subscribe(this.onTemperatureChange);
        this.onTempReached.subscribe(() => {
            this.profile.onTemperatureChange.unsubscribe(this.onTemperatureChange);
            afterFunc();
        });
    }

    public onTemperatureChange = (profile: Profile, value: number) => {
        if (!this.running) { return; }

        const conditionalStep: IConditionalStep = this.step as IConditionalStep;
        const checkTemp: number = profile.startTemp + conditionalStep.temperature;
        switch (conditionalStep.direction) {
            case Direction.DOWN: {
                if (value <= checkTemp) {
                    this._onTempReached.dispatch(this);
                }
                break;
            }

            case Direction.UP: {
                if (value >= checkTemp) {
                    this._onTempReached.dispatch(this);
                }    
                break;
            }

            default: {
                console.log('NO DIRECTION');
            }
        }        
    }
}