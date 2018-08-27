import { IActionStep } from "./IActionStep";
import { IConditionalStep } from "./IConditionalStep";
import { IFeedbackStep } from "./IFeedbackStep";
import { IStep } from "./IStep";

export interface IProfile {
    readonly key?: number;
    readonly title: string;
    readonly steps: Array<IActionStep | IConditionalStep | IFeedbackStep | IStep>;
}