import { abilityTimes } from '../../constants.js';
import { mcdmConditions } from '../../hooks/init/register-status-effects.js';
import { SkillConfig } from '../skill-config.js';

export class BaseActorSheet extends ActorSheet {
    constructor(...args) {
        super(...args);

        this.activeTypeFilter = null;
        this.activeTimeFilter = null;
    }

    static get defaultOptions() {
        return super.defaultOptions;
    }

    async getData() {
        const data = {
            name: this.actor.name,
            img: this.actor.img,
            actor: this.actor,
            ...this.actor.system,
            activeTimeFilter: this.activeTimeFilter,
            activeTypeFilter: this.activeTypeFilter,
            abilityTimes,
            conditionsList: mcdmConditions,
        };

        // Enrich Content
        let enrichContext = {
            async: true,
            actor: this.actor,
        };

        for (const [group, abilities] of Object.entries(data.abilities)) {
            for (const [index, ability] of abilities.entries()) {
                let damageText;
                if (ability.system.damage.doesDamage) {
                    let { baseFormula, characteristic, boons, banes, impacts, type, applyExtraDamage } = ability.system.damage;
                    damageText = `@Damage[${baseFormula}|characteristic=${characteristic}|boons=${boons}|banes=${banes}|impacts=${impacts}|type=${type}|applyExtraDamage=${applyExtraDamage}]`;
                }

                data.abilities[group][index].system.enrichedDamage = await TextEditor.enrichHTML(damageText, { ...enrichContext, item: ability });
                data.abilities[group][index].system.enrichedEffect = await TextEditor.enrichHTML(ability.system.effect, { ...enrichContext, item: ability });

                let isCurrentTypeFilter = ability.system.type === this.activeTypeFilter;
                let isCurrentTimeFilter = ability.system.time === this.activeTimeFilter;
                let noFilters = !this.activeTypeFilter && !this.activeTimeFilter;
                if (isCurrentTypeFilter || isCurrentTimeFilter || noFilters) ability.show = true;
                else ability.show = false;
            }
        }

        data.chanceHit = await TextEditor.enrichHTML(data.chanceHit, enrichContext);

        return data;
    }

    activateListeners($html) {
        super.activateListeners($html);
        const html = $html[0];

        // Add Ability
        const addAbilityButton = html.querySelector('.add-ability');
        addAbilityButton.addEventListener('click', async (event) => {
            let item = await this.actor.createEmbeddedDocuments('Item', [{ type: 'ability', name: 'New Ability' }]);
            item[0].sheet.render(true);
            this.render(true);
        });

        // Ability Type Filter
        html.querySelectorAll('.ability-type-filter').forEach((element) => {
            element.addEventListener('click', (event) => {
                let abilityType = element.dataset.abilityType;
                this.activeTypeFilter = abilityType === 'clear' ? null : abilityType;
                this.activeTimeFilter = null;
                this.render(true);
            });
        });

        // Ability Time Filter
        html.querySelectorAll('.ability-time-filter').forEach((element) => {
            element.addEventListener('click', (event) => {
                let abilityTime = element.dataset.abilityTime;
                this.activeTimeFilter = abilityTime === 'clear' ? null : abilityTime;
                this.activeTypeFilter = null;
                this.render(true);
            });
        });

        // Edit Skills
        const editSkillButton = html.querySelector('.edit-skills');
        editSkillButton.addEventListener('click', (event) => {
            new SkillConfig({ actor: this.actor }).render(true);
        });

        // Edit Ability
        html.querySelectorAll('.ability-edit').forEach((element) => {
            element.addEventListener('click', (event) => {
                let abilityData = element.closest('.ability').dataset;
                let ability = this.actor.items.find((item) => item._id === abilityData.abilityId);

                ability?.sheet.render(true);
            });
        });

        // Delete Ability
        html.querySelectorAll('.ability-delete').forEach((element) => {
            element.addEventListener('click', (event) => {
                let abilityData = element.closest('.ability').dataset;
                let ability = this.actor.items.find((item) => item._id === abilityData.abilityId);

                this.actor.deleteEmbeddedDocuments('Item', [ability._id]);
            });
        });

        // Toggle Conditions
        html.querySelectorAll('.toggle-condition').forEach(async (element) => {
            element.addEventListener('click', async (event) => {
                const conditionId = element.dataset.conditionId;
                this.actor.toggleStatusEffect(conditionId);
            });
        });
    }
}