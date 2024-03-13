import { BaseActorData } from './base-actor.js';

export class HeroData extends BaseActorData {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            victories: new fields.NumberField({
                required: true,
                initial: 0,
                min: 0,
                integer: true,
                nullable: false,
                label: 'system.sheets.actor.victories',
            }),
            xp: new fields.NumberField({
                required: true,
                initial: 0,
                min: 0,
                integer: true,
                nullable: false,
                label: 'system.sheets.actor.xp',
            }),
            recoveries: new fields.SchemaField({
                current: new fields.NumberField({
                    required: true,
                    initial: 0,
                    min: 0,
                    integer: true,
                    nullable: false,
                    label: 'system.sheets.actor.recoveries.current',
                }),
                max: new fields.NumberField({
                    required: true,
                    initial: 0,
                    min: 0,
                    integer: true,
                    nullable: false,
                    label: 'system.sheets.actor.recoveries.max',
                }),
            }),
            currentResources: new fields.ArrayField(
                new fields.SchemaField(
                    {
                        name: new fields.StringField(),
                        current: new fields.NumberField(),
                    },
                    {
                        label: 'system.sheets.actor.resources',
                    }
                )
            ),
        };
    }
}
