/*
 * File: c:\enail-magic\src\profiles\profileSteps\actionStep.ts
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
import { Step } from './step';
import { Profile } from '..';
import { IActionStep } from '../../models';

export class ActionStep extends Step {
    private _step: IActionStep;

    constructor(step: IActionStep, profile: Profile, index: number) {
        super(step, profile, index);
        this._step = step;
    }

    public get Step(): IActionStep {
        return this._step as IActionStep
    }

    public run = (afterFunc: () => void) => {
        this.profile.app.switchHeater(this.Step.onoff  === true ? 1 : 0);
        afterFunc();
    }
}