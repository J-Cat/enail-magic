import * as  Blessed from "blessed";
import { Profile } from "../profiles/profile";
import { App } from "../app";
import { TemperatureStep } from "../profiles";
export class ConsoleUi {
    private screen: Blessed.Widgets.Screen;
    private box: Blessed.Widgets.BoxElement;
    private _app: App;

    constructor(app: App) {
        this._app = app;

        this.screen = Blessed.screen({
            smartCSR: true,
            fullUnicode: true
        });
        this.screen.enableInput();    

        this.box = Blessed.box({
            top: 'center',
            left: 'center',
            width: 18,
            height: 4,            
            tags: true,
            border: {
              type: 'line'
            }
        });

        this.screen.append(this.box);

        // Quit on Escape, q, or Control-C.
        this.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
            return process.exit(0);
        });
        
        // Focus our element.
        this.box.focus();

        this.render();
    }

    getStepString: () => string = () => {
        const s: string = this._app.currentProfile.steps[this._app.currentProfile.currentIndex].getText();
        if (s !== "") {
            return s;
        } else {
            return `${this._app.currentProfile.currentIndex}`;
        }
    };

    render: () => void = () => {
        this.box.setContent(
            `${this._app.currentProfile.running ? '{red-fg}' : ''}`
            + `${this._app.currentProfile.profileIndex} - ${this._app.currentProfile.title}`.substr(0, 16)
            + `${this._app.currentProfile.running ? '{/red-fg}\n' : '\n'}`
            + `${!!this._app.temperature ? this._app.temperature : ''}`
            + (this._app.currentProfile.running 
                ? '{|}{red-fg}' + this.getStepString() + '{/red-fg}' 
                : ''
            )
        );

        this.screen.render();
    }
}