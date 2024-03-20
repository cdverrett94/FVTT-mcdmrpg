import { ABILITIES } from '../constants/abilities.js';
import { CHARACTERISTICS } from '../constants/characteristics.js';
import { DamageRollDialog, ResistanceRollDialog, TestRollDialog } from '../rolls/_index.js';

export class BaseActor extends Actor {
    get allowedAbilityTypes() {
        const allowedAbilityTypes = {};
        for (const [key, value] of Object.entries(ABILITIES.TYPES)) {
            if (value.appliesTo.includes(this.type)) allowedAbilityTypes[key] = value;
        }
        return allowedAbilityTypes;
    }

    get abilities() {
        let allAbilities = this.items.filter((item) => item.type === 'ability');
        const abilities = {};
        for (const type in this.allowedAbilityTypes) {
            abilities[type] = allAbilities.filter((ability) => ability.system.type === type);
        }
        return abilities;
    }

    // Add new craft/knowledge subskill
    async addSkill({ skill, subskill = 'New Skill', characteristic = 'reason', proficient = true } = {}) {
        if (skill !== 'craft' && skill !== 'knowledge') return ui.notifications.error('Skill must be "craft" or "knowledge".');
        if (!(characteristic in CHARACTERISTICS)) return ui.notifications.error('The used characteristic must be a valid one.');
        let skillArray = this.system.skills[skill];
        skillArray.push({
            subskill: subskill,
            characteristic: characteristic,
            proficient: proficient,
        });

        return await this.update({ [`system.skills.${skill}`]: skillArray });
    }

    // Delete craft/knowledge subskill
    async deleteSkill({ skill, subskill } = {}) {
        if (!skill || !subskill) return ui.notifications.error('Must provide a skill and subskill');
        if (skill !== 'craft' && skill !== 'knowledge') return ui.notifications.error('Skill must be "craft" or "knowledge".');
        let skillArray = this.system.skills[skill];
        let skillIndex = skillArray.findIndex((s) => s.subskill === subskill);
        if (skillIndex === -1) return ui.notifications.error(`No subskill ${subskill} found in ${skill}`);

        skillArray.splice(skillIndex, 1);
        return await this.update({ [`system.skills.${skill}`]: skillArray });
    }

    async toggleStatusEffect(statusId, { active, overlay = false } = {}) {
        const isSpecialStatus = ['ongoingdamage', 'taunted', 'frightened'].includes(statusId);
        const status = CONFIG.statusEffects.find((e) => e.id === statusId);
        if (!status) throw new Error(`Invalid status ID "${statusId}" provided to Actor#toggleStatusEffect`);
        const existing = [];

        // Find the effect with the static _id of the status effect
        if (status._id) {
            const effect = this.effects.get(status._id);
            if (effect) existing.push(effect.id);
        }

        // If no static _id, find all single-status effects that have this status
        else {
            for (const effect of this.effects) {
                const statuses = effect.statuses;
                if (statuses.size === 1 && statuses.has(status.id)) existing.push(effect.id);
            }
        }

        // Remove the existing effects unless the status effect is forced active
        if (existing.length && !isSpecialStatus) {
            if (active) return true;
            await this.deleteEmbeddedDocuments('ActiveEffect', existing);
            return false;
        } else if (existing.length && isSpecialStatus) {
            const effect = this.effects.get(existing[0]);
            effect.sheet.render(true);
            return effect;
        }

        // Create a new effect unless the status effect is forced inactive
        if (!active && active !== undefined) return;
        const effect = await ActiveEffect.implementation.fromStatusEffect(statusId);
        if (overlay) effect.updateSource({ 'flags.core.overlay': true });
        const createdEffect = await ActiveEffect.implementation.create(effect, { parent: this, keepId: true });
        if (isSpecialStatus) createdEffect.sheet.render(true);
        return createdEffect;
    }

    async rollCharacteristic(characteristic) {
        let modifier = this.system.characteristics[characteristic];
        let roll = await Roll.create(`2d6 + ${modifier}`).evaluate();
        roll.toMessage({
            flavor: `${characteristic} Roll`,
        });
    }

    async rollTest(data = {}) {
        let { baseFormula, banes, boons, characteristic, formula, skill, subskill, tn } = data;

        // set skill proficiency
        let proficient;
        if (['craft', 'knowledge'].includes(skill)) proficient = this.system.skills[skill].find((sub) => sub.subskill === subskill)?.proficient ?? false;
        else proficient = this.system.skills[skill].proficient;

        // set skill characteristic if there is none;
        if (!characteristic) {
            if (['craft', 'knowledge'].includes(skill)) characteristic = this.system.skills[skill].find((sub) => sub.subskill === subskill)?.characteristic;
            else characteristic = this.system.skills[skill].characteristic;
        }

        if (this.system.banes.tests) banes += Number(this.system.banes.tests);
        if (this.system.boons.tests) banes += Number(this.system.boons.tests);

        let context = {
            actor: this,
            baseFormula,
            banes,
            boons,
            characteristic,
            formula,
            proficient,
            skill,
            subskill,
            tn,
        };
        await new TestRollDialog(context).render(true);
    }

    async rollResistance(data = {}) {
        let { baseFormula, banes, boons, characteristic, formula, tn } = data;

        let context = {
            actor: this,
            baseFormula,
            banes,
            boons,
            characteristic,
            formula,
            tn,
        };
        await new ResistanceRollDialog(context).render(true);
    }

    async rollDamage(data = {}) {
        let { abilityName, applyExtraDamage, baseFormula, banes, boons, characteristic, damageType, formula, impacts } = data;

        const targets = game.user.targets;
        if (!targets.size) return ui.notifications.error('You must select a target');
        let targetsBoons = {};
        targets.forEach((target) => {
            targetsBoons[target.document.uuid] = this.#getTargetBoons(target);
        });

        const actorBoons = this.#getActorBoons();
        boons += actorBoons.boons;
        banes += actorBoons.banes;

        let context = {
            abilityName,
            actor: this,
            applyExtraDamage,
            baseFormula,
            banes,
            boons,
            characteristic,
            damageType,
            formula,
            impacts,
            targets: targetsBoons,
        };
        await new DamageRollDialog(context).render(true);
    }

    #getActorBoons() {
        let rollData = {
            boons: 0,
            banes: 0,
        };
        if (this.system.banes.attacker) rollData.banes += Number(this.system.banes.attacker);
        if (this.system.boons.attacker) rollData.boons += Number(this.system.boons.attacker);

        return rollData;
    }

    #getTargetBoons(target) {
        let rollData = {
            boons: 0,
            banes: 0,
            impacts: 0,
        };

        // Get Boons/Banes that apply when target is attacked
        if (target) {
            if (target.actor.system.boons.attacked) rollData.boons += target.actor.system.boons.attacked;
            if (target.actor.system.banes.attacked) rollData.banes += target.actor.system.banes.attacked;
        }

        // Get Banes if attacking a creature you are frightened by
        if (this.system.frightened.length && this.system.frightened.includes(target.actor.uuid)) rollData.banes += 1;

        // Get Boons if attacking a creature you have frightened
        if (target.actor.system.frightened.length && target.actor.system.frightened.includes(this.uuid)) rollData.boons += 1;

        // Get Banes if attacking a creature a creature other than one that has you taunted
        if (this.system.taunted.length && target && !this.system.taunted.includes(target.actor.uuid)) rollData.banes += 1;

        return rollData;
    }
}
