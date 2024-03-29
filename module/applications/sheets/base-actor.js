import { ABILITIES, CONDITIONS, DAMAGE } from '../../constants/_index.js';
import { SkillConfig } from '../_index.js';

const { HandlebarsApplicationMixin, DocumentSheetV2 } = foundry.applications.api;
export class BaseActorSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
    constructor(...args) {
        super(...args);
        this.filters = {
            time: null,
            type: null,
        };
    }
    static additionalOptions = {
        window: {
            icon: 'fas fa-user',
            positioned: true,
        },
        classes: ['mcdmrpg', 'sheet', 'actor'],
        form: {
            closeOnSubmit: false,
            submitOnChange: true,
        },
        actions: {
            rollCharacteristic: this.#rollCharacteristic,
            editSkills: this.#editSkills,
            addAbility: this.#addAbilty,
            editAbility: this.#editAbility,
            deleteAbility: this.#deleteAbility,
            filterAbilities: this.#filterAbilities,
            toggleCondition: this.#toggleCondition,
        },
    };

    get actor() {
        return this.document;
    }

    async _prepareContext(options) {
        const context = {
            actor: this.actor,
            source: this.actor.toObject(),
            fields: this.actor.system.schema.fields,
            filters: this.filters,
            abilities: ABILITIES,
            conditions: CONDITIONS,
            damages: DAMAGE.TYPES,
        };
        // Enrich Content
        let enrichContext = {
            async: true,
            actor: this.actor,
        };
        for (const [group, abilities] of Object.entries(context.actor.abilities)) {
            for (const [index, ability] of abilities.entries()) {
                let damageText;
                if (ability.system.damage.doesDamage) {
                    let { baseFormula, characteristic, boons, banes, impacts, type, applyExtraDamage } = ability.system.damage;
                    damageText = `@Damage[${baseFormula}|characteristic=${characteristic}|boons=${boons}|banes=${banes}|impacts=${impacts}|type=${type}|applyExtraDamage=${applyExtraDamage}]`;
                }
                context.actor.abilities[group][index].system.enrichedDamage = await TextEditor.enrichHTML(damageText, { ...enrichContext, item: ability });
                context.actor.abilities[group][index].system.enrichedEffect = await TextEditor.enrichHTML(ability.system.effect, {
                    ...enrichContext,
                    item: ability,
                });
                let isCurrentTypeFilter = ability.system.type === this.filters.type;
                let isCurrentTimeFilter = ability.system.time === this.filters.time;
                let noFilters = !this.filters.type && !this.filters.time;
                if (isCurrentTypeFilter || isCurrentTimeFilter || noFilters) ability.show = true;
                else ability.show = false;
            }
        }
        context.actor.system.chanceHit = await TextEditor.enrichHTML(context.actor.system.chanceHit, enrichContext);
        return context;
    }

    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, BaseActorSheet.additionalOptions, { inplace: false });

    static PARTS = {};

    static #rollCharacteristic(event, target) {
        const characteristic = target.dataset.characteristic;
        this.actor.rollCharacteristic(characteristic);
    }

    static async #editSkills(event, target) {
        new SkillConfig({ actor: this.actor }).render(true);
        this.minimize();
    }

    static async #addAbilty(event, target) {
        let item = await this.actor.createEmbeddedDocuments('Item', [{ type: 'ability', name: 'New Ability' }]);
        item[0].sheet.render(true);
        this.render(true);
    }
    static #editAbility(event, target) {
        const abilityId = target.dataset.abilityId;
        const abilityItem = this.actor.items.find((item) => item._id === abilityId);

        abilityItem?.sheet.render(true);
    }
    static #deleteAbility(event, target) {
        const abilityId = target.dataset.abilityId;
        const abilityItem = this.actor.items.find((item) => item._id === abilityId);

        this.actor.deleteEmbeddedDocuments('Item', [abilityItem._id]);
    }

    static async #filterAbilities(event, target) {
        const { filter, selection } = target.dataset;
        if (selection === 'clear') {
            this.filters = {
                type: null,
                time: null,
            };
        } else {
            const secondaryFilter = filter === 'type' ? 'time' : 'type';
            this.filters[filter] = selection === 'clear' ? null : selection;
            this.filters[secondaryFilter] = null;
        }

        this.render({ parts: ['abilities'] });
    }

    static #toggleCondition(event, target) {
        const conditionId = target.dataset.conditionId;
        this.actor.toggleStatusEffect(conditionId);
    }
}
