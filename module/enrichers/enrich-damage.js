import { _getEnrichedOptions, createRollLink, getRollContextData } from '../enrichers/helpers.js';

async function enrichDamage(match, options) {
    /* Currently accounted for  config options

    type = damage type
    edges = # of edges to apply to roll
    banes = number of banes to apply to roll
    characteristic = charcteristic to add to the roll
    */
    let data = await _getEnrichedOptions(match, options);

    let label = game.i18n.format('system.rolls.damage.linkLabel', {
        amount: data.damage.amount,
        type: data.damage.type !== 'untyped' ? ' ' + game.i18n.localize(`system.damage.types.${data.damage.type}.label`) : '',
    });

    let link = createRollLink({
        enrichType: data.enrichType,
        label,
        data,
        postToChat: false,
    });

    return link;
}

async function rollDamage(event) {
    const eventTarget = event.target.closest('.roll-link.roll-damage');
    let data = await getRollContextData(eventTarget.dataset);

    if (!data.actor) return ui.notifications.error('No valid actor selected');
    data.actor.rollDamage(data);
}

function postDamageToChat({ dataset }) {
    let options = '';
    for (const [key, value] of Object.entries(dataset)) {
        if (!['baseFormula', 'formula', 'actorId', 'replaceCharacteristic'].includes(key)) options = `${options}|${key}=${value}`;
    }
    options = `${options}|replaceCharacteristic=false`;

    let baseFormula = target.dataset.baseFormula ?? 0;
    let rollMessage = `@Damage[${baseFormula}${options}]`;
    ChatMessage.create({ content: rollMessage });
}

export { enrichDamage, postDamageToChat, rollDamage };
