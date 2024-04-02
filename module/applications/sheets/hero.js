import { BaseActorSheet } from './base-actor.js';

export class HeroSheet extends BaseActorSheet {
    static additionalOptions = {
        classes: ['hero'],
        position: {
            width: 1202,
            height: 1100,
        },
        actions: {
            rollSkill: this.#rollSkill,
            openACKSheet: this.#openACKSheet,
            editEffect: this.#editEffect,
            deleteEffect: this.#deleteEffect,
        },
    };

    tabGroups = {
        main: null,
    };

    /** @inheritDoc */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, HeroSheet.additionalOptions, { inplace: false });

    /** @override */
    static PARTS = foundry.utils.mergeObject(
        super.PARTS,
        {
            header: {
                id: 'header',
                template: 'systems/mcdmrpg/templates/documents/hero/header.hbs',
            },
            sidebar: {
                id: 'sidebar',
                template: 'systems/mcdmrpg/templates/documents/hero/sidebar.hbs',
            },
            skills: {
                id: 'skill',
                template: 'systems/mcdmrpg/templates/documents/hero/skills.hbs',
                scrollable: ['.skill-list'],
            },
            tabs: {
                id: 'tabs',
                template: 'systems/mcdmrpg/templates/documents/partials/actor-tabs.hbs',
            },
            abilities: {
                id: 'abilities',
                template: 'systems/mcdmrpg/templates/documents/partials/actor-abilities-container.hbs',
                scrollable: ['.abilities-list'],
            },
            notes: {
                id: 'notes',
                template: 'systems/mcdmrpg/templates/documents/hero/notes.hbs',
            },
            effects: {
                id: 'effects',
                template: 'systems/mcdmrpg/templates/documents/hero/effects.hbs',
            },
        },
        { inplace: false }
    );

    static #rollSkill(event, target) {
        let { skill, subskill } = target.dataset;
        this.actor.rollTest({ skill, subskill });
    }

    static #openACKSheet(event, target) {
        let sheetType = target.dataset.type;
        this.actor[sheetType].sheet.render(true);
    }

    static async #editEffect(event, target) {
        let effect = await fromUuid(element.dataset.effectId);
        effect.sheet.render(true);
    }

    static async #deleteEffect(event, target) {
        let effect = await fromUuid(element.dataset.effectId);
        await this.actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id]);
    }
}
