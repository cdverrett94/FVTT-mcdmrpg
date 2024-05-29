function createTargetButton(document, dataset = {}, classes = [], text = '', disabled = false, registerListeners) {
    const targetButton = globalThis.document.createElement('button');

    Object.assign(targetButton.dataset, dataset);
    targetButton.classList.add(...classes);
    targetButton.innerText = text;

    if (disabled) {
        targetButton.disabled = true;
        targetButton.classList.add('disabled');
    } else {
        registerListeners(targetButton, document, index);
    }

    return targetButton;
}

async function addButtonsToTargets(document, html) {
    if (document.type !== 'ability') return false;
    html.querySelectorAll('.target-roll .target-buttons').forEach(async (element) => {
        const hasPermissions = document.isAuthor || document.testUserPermission(game.user, 3);
        if (!hasPermissions) return;

        const { targetUuid, targetId, tokenUuid } = element.dataset;
        let targetTier = document.system?.targets?.[targetId]?.tier;

        if (targetTier === 1) targetTier = 'one';
        else if (targetTier === 2) targetTier = 'two';
        else if (targetTier === 3) targetTier = 'three';
        else if (targetTier === 4) targetTier = 'four';

        document.system.targets[targetId].appliedEffects?.forEach((effect, index) => {
            const isActionableType = ['damage', 'knockback'].includes(effect.type);
            if (!isActionableType) return;

            const classes = [`apply-${effect.type}-button`];
            const disabled = effect.applied;
            const dataset = { targetId, targetUuid, tokenUuid, index };
            let text;
            let registerListeners;

            if (effect.type === 'damage') {
                const localizationPath = disabled ? 'system.rolls.damage.chatDamageButton.applied' : 'system.rolls.damage.chatDamageButton.apply';
                const damageTypeText = dataset.damageType !== 'untyped' ? ' ' + game.i18n.localize(`system.damage.types.${dataset.damageType}.label`) : '';

                text = game.i18n.format(localizationPath, { amount: dataset.damageAmount, type: damageTypeText });
                dataset.damageAmount = effect.amount ?? 0;
                dataset.damageType = effect.dType ?? 'untyped';
                registerListeners = registerDamageTargetListeners;
            } else if (effect.type === 'knockback') {
                const localizationPath = disabled ? 'system.terms.knockback.applied' : 'system.terms.knockback.label';

                text = `${game.i18n.localize(localizationPath)} ${dataset.knockbackDistance}`;
                dataset.knockbackDistance = effect.distance;
            }

            const button = createTargetButton(document, dataset, classes, text, disabled, registerListeners);
            element.appendChild(button);
        });
    });
}

function registerDamageTargetListeners(element, document, index) {
    element.addEventListener('click', async (event) => {
        const { targetUuid, targetId, damageAmount, damageType } = element.dataset;
        if (!targetUuid) return ui.notifications.error('No target selected');
        const actor = await fromUuid(targetUuid);
        await actor.applyDamage({ amount: damageAmount, type: damageType });

        const updateData = {
            system: {
                targets: {},
            },
        };

        let appliedEffects = foundry.utils.duplicate(document.system.targets[targetId].appliedEffects);
        appliedEffects[index].applied = true;
        updateData.system.targets[targetId] = {
            appliedEffects,
        };
        await document.update(updateData);
    });
}

async function registerKnockbackTargetListeners(element, document, index) {
    element.addEventListener('click', async (event) => {
        const { targetUuid, targetId, tokenUuid, knockbackDistance } = element.dataset;
        if (!targetUuid) return ui.notifications.error('No target selected');
        const actor = await fromUuid(targetUuid);
        const token = await fromUuid(tokenUuid);
        if (!token.parent._view) return ui.notifications.error(`Target token's scene is not viewed. Please view scene ${token.parent.name}`);
        const actionTaken = await game.mcdmrpg.actions.knockback({ token: token, distance: knockbackDistance }).request();

        if (actionTaken) {
            const updateData = {
                system: {
                    targets: {},
                },
            };

            let appliedEffects = foundry.utils.duplicate(document.system.targets[targetId].appliedEffects);
            appliedEffects[index].applied = true;
            updateData.system.targets[targetId] = {
                appliedEffects,
            };
            await document.update(updateData);
        }
    });
}

export { addButtonsToTargets };
