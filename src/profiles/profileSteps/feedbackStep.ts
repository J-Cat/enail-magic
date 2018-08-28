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

    public run = (step: Step): Promise<Step> => {
        return new Promise((resolve, reject) => {
            const feedbackStep: IFeedbackStep = step.step;
            if (!!feedbackStep.led) {
                this.profile.app.emitColor(feedbackStep.led.r, feedbackStep.led.g, feedbackStep.led.b, feedbackStep.led.flash);
            }
            if (!!this.icon && !!feedbackStep.icon) {
                this.profile.app.setIcon(this.icon, feedbackStep.icon!.flash);
            } 
            resolve(this);
        });
    }
}
