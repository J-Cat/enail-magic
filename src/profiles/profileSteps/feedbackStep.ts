import { Step } from './step';
import { Profile } from '..';
import Icons from '../../ui/icons';
import { IFeedbackStep } from '../../models';

export class FeedbackStep extends Step {
    private icon?: Uint8Array;

    constructor(step: IFeedbackStep, profile: Profile, index: number) {
        super(step, profile, index);

        if (!!step.icon) {
            this.icon = Icons.getIconByName(step.icon.icon);
        }
    }

    public get Step(): IFeedbackStep {
        return this.step as IFeedbackStep
    }

    public run = (afterFunc: () => void) => {
        if (!!this.Step.led) {
            this.profile.app.emitColor(this.Step.led.r, this.Step.led.g, this.Step.led.b, this.Step.led.flash);
        }
        if (!!this.icon) {
            this.profile.app.setIcon(this.icon, this.Step.icon!.flash);
        }  

        afterFunc();
    }
}
