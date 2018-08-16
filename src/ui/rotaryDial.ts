import { init } from "raspi";
import { DigitalInput, DigitalOutput, PULL_UP } from "raspi-gpio";
import { SimpleEventDispatcher, ISimpleEvent } from "strongly-typed-events";

export class RotaryDial {
    private lastA: number = 0;
    private lastB: number = 0;
    private inputA: DigitalInput | undefined;
    private inputB: DigitalInput | undefined;

    protected _onClockwise: SimpleEventDispatcher<RotaryDial> = new SimpleEventDispatcher<RotaryDial>();
    get onClockwise(): ISimpleEvent<RotaryDial> {
        return this._onClockwise.asEvent();
    }

    protected _onCounterClockwise: SimpleEventDispatcher<RotaryDial> = new SimpleEventDispatcher<RotaryDial>();
    get onCounterClockwise(): ISimpleEvent<RotaryDial> {
        return this._onCounterClockwise.asEvent();
    }

    protected _onButton: SimpleEventDispatcher<RotaryDial> = new SimpleEventDispatcher<RotaryDial>();
    get onButton(): ISimpleEvent<RotaryDial> {
        return this._onButton.asEvent();
    }

    rotaryInterupt = (isA: boolean) => {
        const newA: number = this.inputA!.read();
        const newB: number = this.inputB!.read();
        if (newA === this.lastA && newB === this.lastB) {
            return;
        }

        this.lastA = newA;
        this.lastB = newB;

        if (newA === 1 && newB === 1) {
            if (isA) {
                this._onCounterClockwise.dispatch(this);
            } else {
                this._onClockwise.dispatch(this);
            }
        }
    }

    constructor(pinA: string, pinB: string, buttonPin: string) {   
        init(() => {
            this.inputA = new DigitalInput({
                pin: pinA,
                pullResistor: PULL_UP
            });

            this.inputB = new DigitalInput({
                pin: pinB,
                pullResistor: PULL_UP
            });

            this.inputA.on('change', (value: number) => {
                if (value === 1) {
                    this.rotaryInterupt(true);
                }
            });

            this.inputB.on('change', (value: number) => {
                if (value === 1) {
                    this.rotaryInterupt(false);
                }
            });

            const button: DigitalInput = new DigitalInput({
                pin: buttonPin,
                pullResistor: PULL_UP
            });

            button.on('change', (value: number) => {
                if (value === 1) {
                    this._onButton.dispatch(this);
                }
            });
        });
    }
}