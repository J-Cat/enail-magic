export interface IProfile {
    readonly title: string;
    readonly steps: Array<ITemperatureStep | ITimeStep | ISwitchStep | ILEDStep | IIconStep | ISoundStep>;
}

export interface IStep {
    readonly type: string;
}

export interface ITemperatureStep extends IStep {
    readonly temperature: number;
    readonly direction: number;
    readonly timeout: number;
}

export interface ITimeStep extends IStep {
    readonly delay: number;
}

export interface ISwitchStep extends IStep {
    readonly onoff: number;
}

export interface ILEDStep extends IStep {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly flashSpeed: number;
}

export interface IIconStep extends IStep {
    readonly icon: string;
    readonly flashRate: number;
}

export interface ISoundStep extends IStep {
    readonly sound: string;
}