/*
 * File: c:\enail-magic\src\statistics\IStatistics.ts
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
import { IProfile } from "../models";

export interface IStatistics {
    [profileKey: number]: IProfileStatistic;
}

export interface IProfileStatistic {
    key: number;
    data: IStatisticData;
    steps: {
        [stepKey: number]: IStatisticData;
    }
}

export interface IStatisticData {
    runtimes: number[];
    lastRunTime: number;
}