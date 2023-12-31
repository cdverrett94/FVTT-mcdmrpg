import { MCDMActorProxy } from './module/documents/actors/actor-proxy.js';
import { HeroData } from './module/documents/actors/hero/data-model.js';
import { HeroSheet } from './module/documents/actors/hero/sheet/sheet.js';
import { MonsterData } from './module/documents/actors/monster/data-model.js';
import { MonsterSheet } from './module/documents/actors/monster/sheet/sheet.js';
import { AbilityData } from './module/documents/items/ability/data-model.js';
import { AbilitySheet } from './module/documents/items/ability/sheet/sheet.js';
import { AncestryData } from './module/documents/items/ancestry/data-model.js';
import { AncestrySheet } from './module/documents/items/ancestry/sheet/sheet.js';
import { ClassSheet } from './module/documents/items/class/sheet/sheet.js';
import { MCDMItemProxy } from './module/documents/items/item-proxy.js';
import { KitData } from './module/documents/items/kit/data-model.js';
import { KitSheet } from './module/documents/items/kit/sheet/sheet.js';
import { DamageRoll } from './module/documents/rolls/damage/damage-roll.js';
import { ResistanceRoll } from './module/documents/rolls/resistance/resistance-roll.js';
import { TestRoll } from './module/documents/rolls/test/test-roll.js';
import { registerCustomEnrichers } from './module/enrichers.js';

Hooks.on('init', () => {
    // Set module Data Models
    CONFIG.Actor.dataModels.hero = HeroData;
    CONFIG.Actor.dataModels.monster = MonsterData;

    CONFIG.Item.dataModels.ability = AbilityData;
    CONFIG.Item.dataModels.kit = KitData;
    CONFIG.Item.dataModels.ancestry = AncestryData;

    // Set module Document Classes
    CONFIG.Actor.documentClass = MCDMActorProxy;
    CONFIG.Item.documentClass = MCDMItemProxy;

    // Load templates
    const templatePaths = [
        // Base
        'systems/mcdmrpg/module/documents/actors/base/sheet/partials/abilities.hbs',
        'systems/mcdmrpg/module/documents/actors/base/sheet/partials/abilities-filter.hbs',

        // Heroes
        'systems/mcdmrpg/module/documents/actors/hero/sheet/partials/skills.hbs',
        'systems/mcdmrpg/module/documents/actors/hero/sheet/partials/sidebar.hbs',
        'systems/mcdmrpg/module/documents/actors/hero/sheet/partials/header.hbs',
    ];
    loadTemplates(templatePaths);

    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('mcdmrpg', HeroSheet, {
        types: ['hero'],
        makeDefault: true,
        label: 'Hero Sheet',
    });
    Actors.registerSheet('mcdmrpg', MonsterSheet, {
        types: ['monster'],
        makeDefault: true,
        label: 'Monster Sheet',
    });

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('mcdmrpg', ClassSheet, {
        types: ['class'],
        makeDefault: true,
        label: 'Class Sheet',
    });
    Items.registerSheet('mcdmrpg', AbilitySheet, {
        types: ['ability'],
        makeDefault: true,
        label: 'Ability Sheet',
    });
    Items.registerSheet('mcdmrpg', KitSheet, {
        types: ['kit'],
        makeDefault: true,
        label: 'Kit Sheet',
    });
    Items.registerSheet('mcdmrpg', AncestrySheet, {
        types: ['ancestry'],
        makeDefault: true,
        label: 'Ancestry Sheet',
    });
    Handlebars.registerHelper('includes', function (array, value) {
        return array.includes(value);
    });

    registerCustomEnrichers();

    CONFIG.Dice.rolls.push(DamageRoll, ResistanceRoll, TestRoll);
});

Hooks.on('ready', async () => {
    game.actors.contents.find((actor) => actor.type === 'monster').sheet.render(true);
    // game.actors.contents.find((actor) => actor.type === 'hero').sheet.render(true);
    // game.items.contents.find((item) => item.type === 'class').sheet.render(true);
});
