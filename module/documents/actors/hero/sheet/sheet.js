export class HeroSheet extends ActorSheet {
    constructor(...args) {
        super(...args);
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            classes: ['mcdmrpg', 'sheet', 'actor', 'hero'],
            template: `/systems/mcdmrpg/module/documents/actors/hero/sheet/hero-sheet.hbs`,
            tabs: [
                /*{
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'skills',
                },*/
            ],
            scrollY: ['.skill-list', '.tabbed-content'],
            width: 1230,
            height: 930,
            resizable: false,
        };

        return foundry.utils.mergeObject(defaults, overrides);
    }

    async getData() {
        let { abilities } = this.actor.system;
        const data = {
            name: this.actor.name,
            img: this.actor.img,
            ...this.actor.system,
        };

        // Enrich Content
        let enrichContext = {
            async: true,
            actor: this.actor,
            replaceCharacteristic: true,
            applyKitDamage: true,
        };

        for (const [group, abilities] of Object.entries(data.abilities)) {
            for (const [index, ability] of abilities.entries()) {
                data.abilities[group][index].system.enrichedDamage = await TextEditor.enrichHTML(ability.system.damage, enrichContext);
                data.abilities[group][index].system.enrichedEffect = await TextEditor.enrichHTML(ability.system.effect, enrichContext);
            }
        }

        data.chanceHit = await TextEditor.enrichHTML(data.chanceHit, enrichContext);

        return data;
    }

    activateListeners($html) {
        super.activateListeners($html);
        const html = $html[0];

        // Roll Characteristic
        html.querySelectorAll('.characteristic .mcdmrpg-subheader').forEach((element) => {
            element.addEventListener('click', (event) => {
                let characteristic = element.closest('.characteristic').dataset.characteristic;
                this.actor.rollCharacteristic(characteristic);
            });
        });

        // Roll Skill
        html.querySelectorAll('.roll-skill').forEach((element) => {
            element.addEventListener('click', (event) => {
                let skill = element.dataset.skill;
                let subskill = element.dataset.subskill;
                this.actor.rollSkill({ skill, subskill });
            });
        });

        // Add Crafting & Knowledge Skills
        html.querySelectorAll('.add-skill').forEach((element) => {
            element.addEventListener('click', (event) => {
                let skill = element.dataset.skill;
                this.actor.addSkill({ skill, subskill: 'New ' + game.i18n.localize(`skills.${skill}.label`) + ' Skill' });
            });
        });

        // Delete Crafting & Knowledge Skills
        html.querySelectorAll('.delete-skill > i').forEach((element) => {
            element.addEventListener('click', (event) => {
                let skill = element.dataset.skill;
                let subskill = element.dataset.subskill;
                this.actor.deleteSkill({ skill, subskill });
            });
        });

        // Edit Ability Item
        html.querySelectorAll('.edit-ability').forEach((element) => {
            element.addEventListener('click', (event) => {
                let abilityId = element.dataset.abilityId;
                this.actor.items.find((item) => item.id === abilityId).sheet.render(true);
            });
        });

        // Delete Ability Item
        html.querySelectorAll('.delete-ability').forEach((element) => {
            element.addEventListener('click', (event) => {
                let abilityId = element.dataset.abilityId;
                this.actor.deleteEmbeddedDocuments('Item', [abilityId]);
            });
        });

        html.querySelectorAll('.kit, .class').forEach((element) => {
            element.addEventListener('click', (event) => {
                let type = element.classList.contains('kit') ? 'kit' : 'class';
                this.actor.system[type].sheet.render(true);
            });
        });
    }
}
