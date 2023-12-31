import { MCDMItemData } from '../base/data-model.js';

export class KitData extends MCDMItemData {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            type: new fields.StringField(),
            armor: new fields.StringField(),
            weapon: new fields.StringField(),
            area: new fields.StringField(),
            health: new fields.StringField(),
            damage: new fields.NumberField(),
            reach: new fields.StringField(),
            speed: new fields.StringField(),
            range: new fields.NumberField(),
            resistanceTN: new fields.NumberField(),
        };
    }
}
