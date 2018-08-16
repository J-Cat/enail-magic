export interface IProfile {
    readonly title: string;
    readonly steps: Array<IStep & (ITemperatureStep & ITimeStep & ISwitchStep & ILEDStep)>;
}

export interface IStep {
    readonly type: string;
}

export interface ITemperatureStep {
    readonly temperature: number;
    readonly direction: number;
    readonly timeout: number;
}

export interface ITimeStep {
    readonly delay: number;
}

export interface ISwitchStep {
    readonly onoff: number;
}

export interface ILEDStep {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly flashSpeed: number;
}