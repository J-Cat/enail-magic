/*
 * File: c:\enail-magic\src\statistics\statistics.ts
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
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { IStatistics, IStatisticData, IProfileStatistic } from 'src/statistics/IStatistics';

const filename = path.join(os.homedir(), `.enailmagic.statistics`);

class Statistics {
    constructor() {
        this.load();
    }

    public Statistics: IStatistics = {};

    load = () => {

        // load the data if it exists
        fs.exists(filename, exists => {
            fs.readFile(filename, (error, data) => {
                if (!!error) {
                    console.log(error.message);
                } else {
                    this.Statistics = JSON.parse(data.toString('utf8'));
                }
            });
        });        
    }

    public save = () => {
        fs.writeFile(filename, JSON.stringify(this.Statistics), {
            encoding: 'utf8'
        }, err => {
            if (!!err) {
                console.log(err.message);
            }
        });;
    }

    public getEstimate = (key: number): number => {
        const statistic: IProfileStatistic = statistics.Statistics[key];
        if (!statistic) {
            return 0;
        } else {
            const sum: number = statistic.data.runtimes.reduce((previousValue: number, currentValue: number) => (previousValue + currentValue));
            return Math.round(sum / statistic.data.runtimes.length);
        }
    }

    public getStepEstimate = (profileKey: number, stepKey: number) => {
        const statistic: IProfileStatistic = statistics.Statistics[profileKey];
        if (!statistic) {
            return 0;
        } else {
            const stepStat: IStatisticData = statistic.steps[stepKey];
            if (!stepStat) {
                return 0;
            } else {
                const sum: number = stepStat.runtimes.reduce((previousValue: number, currentValue: number) => (previousValue + currentValue));
                return Math.round(sum / stepStat.runtimes.length);
            }
        }
    }
}

const statistics: Statistics = new Statistics();
export default statistics;