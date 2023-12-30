import { damageTypes } from '../../constants.js';
import { MCDMRoll } from './base-roll.js';

export class DamageRoll extends MCDMRoll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);

        this.damageType = damageTypes.includes(options.damageType) ? options.damageType : 'untyped';
        this.kitDamage = options.kitDamage;
    }

    static constructFinalFormula(formula, options) {
        formula = MCDMRoll.constructFinalFormula(formula, options);

        if (options.actor.system.kit?.system.damage && options.applyKitDamage) formula = `${formula} + ${options.actor.system.kit?.system.damage}`;

        return formula;
    }
}
