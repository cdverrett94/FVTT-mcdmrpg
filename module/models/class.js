import { BaseItemData } from './base-item.js';

export class ClassData extends BaseItemData {
    static LOCALIZATION_PREFIXES = [
        'system.items.class',
        'system.items.class.FIELDS',
        'system.items.class.FIELDS.element',
        'system.items.class.FIELDS.element.fields',
    ];
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            resources: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField(),
                    max: new fields.StringField(),
                })
            ),
            description: new fields.StringField(),
            victoryBenefits: new fields.StringField(),
            resourceGain: new fields.StringField(),
        };
    }
}
