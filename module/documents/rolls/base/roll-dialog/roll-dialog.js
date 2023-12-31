export class BaseRollDialog extends Application {
    constructor(options) {
        super(options);
        this.options.title = this.actor?.name ?? '';
        this.context.replaceCharacteristic = true;
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            classes: ['mcdmrpg', 'roll-dialog'],
            template: `/systems/mcdmrpg/module/documents/rolls/base/roll-dialog/sheet/roll-dialog-sheet.hbs`,
            height: 210,
            width: 315,
        };

        return foundry.utils.mergeObject(defaults, overrides);
    }

    get context() {
        return this.options;
    }

    get actor() {
        return this.context.actor;
    }
    get baseFormula() {
        return this.context.baseFormula;
    }

    get formula() {
        let formula = this.sheetRoller.constructFinalFormula(this.baseFormula, this.context);
        return formula;
    }

    async getData() {
        this.context.actorId = this.actor?.uuid;

        let data = {
            ...this.context,
            formula: this.formula,
        };

        return data;
    }

    activateListeners($html) {
        super.activateListeners($html);
        const html = $html[0];

        html.querySelectorAll('.adjust-dice')?.forEach((element) => {
            let { type, adjustment } = element.dataset;

            element.addEventListener('click', (event) => {
                if (adjustment === 'add') this.context[type] += 1;
                else this.context[type] -= 1;

                this.context[type] = Math.max(this.context[type], 0);

                this.render(true);
            });
        });

        html.querySelectorAll('.roll-button')?.forEach((element) => {
            element.addEventListener('click', async (event) => {
                let roll = await new this.sheetRoller(this.formula, this.actor, this.context).evaluate();
                roll.toMessage();
                this.close();
            });
        });
    }
}
