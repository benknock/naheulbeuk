// Import document classes.
import { NaheulbeukActor } from "./documents/actor.mjs";
import { NaheulbeukItem } from "./documents/item.mjs";
// Import sheet classes.
import { NaheulbeukActorSheet } from "./sheets/actor-sheet.mjs";
import { NaheulbeukItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { NAHEULBEUK } from "./helpers/config.mjs";

//PCH
import { Macros } from "./documents/macro.mjs";
import { registerHandlebarsHelpers } from './documents/helpers.mjs';


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */


Hooks.once('init', async function () {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.

  game.naheulbeuk = {
    NaheulbeukActor,
    NaheulbeukItem,
    rollItemMacro,
    macros: Macros
  };

  // Add custom constants for configuration.
  CONFIG.NAHEULBEUK = NAHEULBEUK;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "@abilities.cou.value + @abilities.cou.bonus",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = NaheulbeukActor;
  CONFIG.Item.documentClass = NaheulbeukItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("naheulbeuk", NaheulbeukActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("naheulbeuk", NaheulbeukItemSheet, { makeDefault: true });

  Hooks.on("hotbarDrop", (bar, data, slot) => {
    if (["Item"].includes(data.type)) {
      Macros.createMacro(data, slot);
      return false;
    }
  })

  // Register Handlebars Helpers
	registerHandlebarsHelpers();
  
  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName,param) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  if (param==1){
    //Macro pour un sort
    if (item.type == "sort") {
      let d = new Dialog({
        title: item.name,
        content: `
        <label style="font-size: 15px;">Que souhaitez vous faire ?</label>
        <br/>
        `,
        buttons: {
          one: {
            label: "Voir l'objet",
            callback: (html) => {
              item.sheet.render(true);
            }
          },
          two: {
            label: "Utiliser l'objet",
            callback: (html) => {
              if (item.system.epreuvecustom == true) {
                var dataset = { "actor": actor, "dice1": item.system.jet1, "name1": item.system.name1, "diff1": item.system.epreuve1, "dice2": item.system.jet2, "name2": item.system.name2, "diff2": item.system.epreuve2, "dice3": item.system.jet3, "name3": item.system.name3, "diff3": item.system.epreuve3, "dice4": item.system.jet4, "name4": item.system.name4, "diff4": item.system.epreuve4, "dice5": item.system.jet5, "name5": item.system.name5, "diff5": item.system.epreuve5 };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                onRollCustomSpell(event)
              } else {
                if (item.system.degat == "") {
                  var dataset = { "actor": actor, "dice1": "d20", "name1": "Epreuve", "diff1": item.system.epreuve, "dice2": "", "name2": "", "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                } else {
                  var dataset = { "actor": actor, "dice1": "d20", "name1": "Epreuve", "diff1": item.system.epreuve, "dice2": item.system.degat, "name2": "Dégâts", "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                }
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                onRollCustomSpell(event)
              }
            }
          }
        }
      });
      d.render(true);

    //Macro pour une arme ou un bouclier (ignore les flèches et autre projectile/combustibles) sans épreuve custom
    } else if (item.type == "arme" && item.system.formula + item.system.prd != "-" && item.system.formula + item.system.prd != "--" && item.system.epreuvecustom == false) {
      let d = new Dialog({
        title: item.name,
        content: `
        <label style="font-size: 15px;">Que souhaitez vous faire ?</label>
        <br/>
        `,
        buttons: {
          one: {
            label: "Voir l'objet",
            callback: (html) => {
              item.sheet.render(true);
            }
          },
          two: {
            label: "Utiliser l'objet",
            callback: (html) => {
              if (item.system.equipe == false || item.system.enmain == false) {
                return ui.notifications.warn(`L'objet ${itemName} n'est pas équipé`);
              } else {
                if (item.system.prd == "-") {
                  var prd = "";
                  var prdname = "";
                } else {
                  var prd = "@prd+" + item.system.prd;
                  var prdname = "Parade";
                }
                if (item.system.formula == "-" || item.system.formula == "") {
                  var attaque = "";
                  var attname = "";
                  var degat = "";
                  var degatname = "";
                } else {
                  var attname = "Attaque";
                  var degatname = "Dégâts";
                  if (item.system.lancerarme != "-") { var attaque = "@att-distance" } else { var attaque = "@att+" + item.system.att }
                  var degat = item.system.formula;
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) > 12) {
                    degat = degat + "+" + Math.max(0, (actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) - 12)
                  };
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) < 9) {
                    degat = degat + "-1"
                  };
                  if (item.system.lancerarme != "-" && actor.system.attributes.lancerarme.degat != 0) {
                    degat = degat + actor.system.attributes.lancerarme.degat
                  };
                }

                var dataset = { "actor": actor, "dice1": "d20", "name1": attname, "diff1": attaque, "dice2": degat, "name2": degatname, "diff2": "", "dice3": "d20", "name3": prdname, "diff3": prd, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                onRollCustomSpell(event)
              }
            }
          }
        }
      });
      d.render(true);
    //Macro pour une arme ou un bouclier (ignore les flèches et autre projectile/combustibles) avec épreuve custom
    } else if (item.type == "arme" && item.system.formula + item.system.prd != "-" && item.system.formula + item.system.prd != "--" && item.system.epreuvecustom == true) {
      let d = new Dialog({
        title: item.name,
        content: `
        <label style="font-size: 15px;">Que souhaitez vous faire ?</label>
        <br/>
        `,
        buttons: {
          one: {
            label: "Voir l'objet",
            callback: (html) => {
              item.sheet.render(true);
            }
          },
          two: {
            label: "Utiliser l'objet",
            callback: (html) => {
              if (item.system.equipe == false || item.system.enmain == false) {
                return ui.notifications.warn(`L'objet ${itemName} n'est pas équipé`);
              } else {
                if (item.system.prd == "-") {
                  var prd = "";
                  var prdname = "";
                } else {
                  var prd = "@prd+" + item.system.prd;
                  var prdname = "Parade";
                }
                if (item.system.formula == "-" || item.system.formula == "") {
                  var attaque = "";
                  var attname = "";
                  var degat = "";
                  var degatname = "";
                } else {
                  var attname = "Attaque";
                  var degatname = "Dégâts";
                  if (item.system.lancerarme != "-") { var attaque = "@att-distance" } else { var attaque = "@att+" + item.system.att }
                  var degat = item.system.formula;
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) > 12) {
                    degat = degat + "+" + Math.max(0, (actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) - 12)
                  };
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) < 9) {
                    degat = degat + "-1"
                  };
                  if (item.system.lancerarme != "-" && actor.system.attributes.lancerarme.degat != 0) {
                    degat = degat + actor.system.attributes.lancerarme.degat
                  };
                }

                var dataset = { "actor": actor, "dice1": "d20", "name1": attname, "diff1": attaque, "dice2": degat, "name2": degatname, "diff2": "", "dice3": "d20", "name3": prdname, "diff3": prd, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                onRollCustomSpell(event)
              }
            }
          },
          three: {
            label: "Épreuve(s) custom",
            callback: (html) => {
              if (item.system.equipe == false || item.system.enmain == false) {
                return ui.notifications.warn(`L'objet ${itemName} n'est pas équipé`);
              }
              var dataset = { "actor": actor, "dice1": item.system.jet1, "name1": item.system.name1, "diff1": item.system.epreuve1, "dice2": item.system.jet2, "name2": item.system.name2, "diff2": item.system.epreuve2, "dice3": item.system.jet3, "name3": item.system.name3, "diff3": item.system.epreuve3, "dice4": item.system.jet4, "name4": item.system.name4, "diff4": item.system.epreuve4, "dice5": item.system.jet5, "name5": item.system.name5, "diff5": item.system.epreuve5 };
              var currentTarget = { "dataset": dataset };
              var event = { "currentTarget": currentTarget };
              onRollCustomSpell(event)
            }
          },
        }
      });
      d.render(true);
    //Macro pour une autre arme (sans dégâts donc) avec une épreuve custom (comme une arme à feu)
    } else if (item.type == "arme" && item.system.epreuvecustom == true) {
      let d = new Dialog({
        title: item.name,
        content: `
        <label style="font-size: 15px;">Que souhaitez vous faire ?</label>
        <br/>
        `,
        buttons: {
          one: {
            label: "Voir l'objet",
            callback: (html) => {
              item.sheet.render(true);
            }
          },
          three: {
            label: "Épreuve(s)",
            callback: (html) => {
              if (item.system.equipe == false || item.system.enmain == false) {
                return ui.notifications.warn(`L'objet ${itemName} n'est pas équipé`);
              }
              var dataset = { "actor": actor, "dice1": item.system.jet1, "name1": item.system.name1, "diff1": item.system.epreuve1, "dice2": item.system.jet2, "name2": item.system.name2, "diff2": item.system.epreuve2, "dice3": item.system.jet3, "name3": item.system.name3, "diff3": item.system.epreuve3, "dice4": item.system.jet4, "name4": item.system.name4, "diff4": item.system.epreuve4, "dice5": item.system.jet5, "name5": item.system.name5, "diff5": item.system.epreuve5, "dice6": item.system.jet6, "name6": item.system.name6, "diff6": item.system.epreuve6, "dice7": item.system.jet7, "name7": item.system.name7, "diff7": item.system.epreuve7 };
              var currentTarget = { "dataset": dataset };
              var event = { "currentTarget": currentTarget };
              onRollCustomSpell(event)
            }
          },
        }
      });
      d.render(true);
    //Macro pour un coup spécial - désactivé pour le moment
    /*} else if (item.type == "coup" && ((item.system.epreuve != "" && item.system.bourrepif == false) || item.system.bourrepif == true)) {
      let d = new Dialog({
        title: item.name,
        content: `
        <label style="font-size: 15px;">Que souhaitez vous faire ?</label>
        <br/>
        `,
        buttons: {
          one: {
            label: "Voir l'objet",
            callback: (html) => {
              item.sheet.render(true);
            }
          },
          two: {
            label: "Utiliser l'objet",
            callback: (html) => {
              if (item.system.bourrepif == false) {
                var name1 = "";
                var name2 = "";
                var diff1 = "";
                var dice1 = "";
                var dice2 = "";
                if (item.system.epreuve.substring(0, 1) != "*") {
                  name1 = "Epreuve"
                  diff1 = item.system.epreuve
                  dice1 = "d20"
                }
                if (item.system.degat.substring(0, 1) != "*") {
                  name2 = "Dégâts"
                  dice2 = item.system.degat
                }
                var dataset = { "actor": actor, "dice1": dice1, "name1": name1, "diff1": diff1, "dice2": dice2, "name2": name2, "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                onRollCustomSpell(event)
              } else {
                var name1 = "";
                var name2 = "";
                var name3 = "";
                var diff1 = "";
                var diff3 = "";
                var dice1 = "";
                var dice2 = "";
                var dice3 = "";
                if (item.system.epreuve != "" && item.system.epreuve != "-") {
                  name1 = "Epreuve d'attaque";
                  diff1 = item.system.epreuve;
                  dice1 = "d20";
                }
                if (item.system.degat != "" && item.system.degat != "-") {
                  name2 = "Dégâts";
                  dice2 = item.system.degat;
                }
                if (item.system.attaque != "" && item.system.attaque != "-") {
                  name3 = "Epreuve spéciale";
                  diff3 = item.system.attaque;
                  dice3 = "d20";
                }
                var dataset = { "actor": actor, "dice1": dice1, "name1": name1, "diff1": diff1, "dice2": dice2, "name2": name2, "diff2": "", "dice3": dice3, "name3": name3, "diff3": diff3, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                onRollCustomSpell(event)
              }
            }
          }
        }
      });
      d.render(true);*/
    } else {
      item.sheet.render(true);
    }
  }

  if (param==0){
    //sort
    if (item.type == "sort") {
      if (item.system.epreuvecustom == true) {
        var dataset = { "actor": actor, "dice1": item.system.jet1, "name1": item.system.name1, "diff1": item.system.epreuve1, "dice2": item.system.jet2, "name2": item.system.name2, "diff2": item.system.epreuve2, "dice3": item.system.jet3, "name3": item.system.name3, "diff3": item.system.epreuve3, "dice4": item.system.jet4, "name4": item.system.name4, "diff4": item.system.epreuve4, "dice5": item.system.jet5, "name5": item.system.name5, "diff5": item.system.epreuve5 };
        var currentTarget = { "dataset": dataset };
        var event = { "currentTarget": currentTarget };
        onRollCustomSpell(event)
      } else {
        if (item.system.degat == "") {
          var dataset = { "actor": actor, "dice1": "d20", "name1": "Epreuve", "diff1": item.system.epreuve, "dice2": "", "name2": "", "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
        } else {
          var dataset = { "actor": actor, "dice1": "d20", "name1": "Epreuve", "diff1": item.system.epreuve, "dice2": item.system.degat, "name2": "Dégâts", "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
        }
        var currentTarget = { "dataset": dataset };
        var event = { "currentTarget": currentTarget };
        onRollCustomSpell(event)
      }
    //arme sans épreuve custom
    } else if (item.type == "arme" && item.system.formula + item.system.prd != "-" && item.system.formula + item.system.prd != "--" && item.system.epreuvecustom == false) {
        if (item.system.equipe == false || item.system.enmain == false) {
          return ui.notifications.warn(`L'objet ${itemName} n'est pas équipé`);
        } else {
          if (item.system.prd == "-") {
            var prd = "";
            var prdname = "";
          } else {
            var prd = "@prd+" + item.system.prd;
            var prdname = "Parade";
          }
          if (item.system.formula == "-" || item.system.formula == "") {
            var attaque = "";
            var attname = "";
            var degat = "";
            var degatname = "";
          } else {
            var attname = "Attaque";
            var degatname = "Dégâts";
            if (item.system.lancerarme != "-") { var attaque = "@att-distance" } else { var attaque = "@att+" + item.system.att }
            var degat = item.system.formula;
            if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) > 12) {
              degat = degat + "+" + Math.max(0, (actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) - 12)
            };
            if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) < 9) {
              degat = degat + "-1"
            };
            if (item.system.lancerarme != "-" && actor.system.attributes.lancerarme.degat != 0) {
              degat = degat + actor.system.attributes.lancerarme.degat
            };
          }

          var dataset = { "actor": actor, "dice1": "d20", "name1": attname, "diff1": attaque, "dice2": degat, "name2": degatname, "diff2": "", "dice3": "d20", "name3": prdname, "diff3": prd, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
          var currentTarget = { "dataset": dataset };
          var event = { "currentTarget": currentTarget };
          onRollCustomSpell(event)
        }
    //arme avec épreuve custom
    } else if (item.type == "arme" && item.system.formula + item.system.prd != "-" && item.system.formula + item.system.prd != "--" && item.system.epreuvecustom == true) {
      let d = new Dialog({
        title: item.name,
        content: `
        <label style="font-size: 15px;">Que souhaitez vous faire ?</label>
        <br/>
        `,
        buttons: {
          two: {
            label: "Utiliser l'objet",
            callback: (html) => {
              if (item.system.equipe == false || item.system.enmain == false) {
                return ui.notifications.warn(`L'objet ${itemName} n'est pas équipé`);
              } else {
                if (item.system.prd == "-") {
                  var prd = "";
                  var prdname = "";
                } else {
                  var prd = "@prd+" + item.system.prd;
                  var prdname = "Parade";
                }
                if (item.system.formula == "-" || item.system.formula == "") {
                  var attaque = "";
                  var attname = "";
                  var degat = "";
                  var degatname = "";
                } else {
                  var attname = "Attaque";
                  var degatname = "Dégâts";
                  if (item.system.lancerarme != "-") { var attaque = "@att-distance" } else { var attaque = "@att+" + item.system.att }
                  var degat = item.system.formula;
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) > 12) {
                    degat = degat + "+" + Math.max(0, (actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) - 12)
                  };
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus) < 9) {
                    degat = degat + "-1"
                  };
                  if (item.system.lancerarme != "-" && actor.system.attributes.lancerarme.degat != 0) {
                    degat = degat + actor.system.attributes.lancerarme.degat
                  };
                }

                var dataset = { "actor": actor, "dice1": "d20", "name1": attname, "diff1": attaque, "dice2": degat, "name2": degatname, "diff2": "", "dice3": "d20", "name3": prdname, "diff3": prd, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                onRollCustomSpell(event)
              }
            }
          },
          three: {
            label: "Épreuve(s) custom",
            callback: (html) => {
              if (item.system.equipe == false || item.system.enmain == false) {
                return ui.notifications.warn(`L'objet ${itemName} n'est pas équipé`);
              }
              var dataset = { "actor": actor, "dice1": item.system.jet1, "name1": item.system.name1, "diff1": item.system.epreuve1, "dice2": item.system.jet2, "name2": item.system.name2, "diff2": item.system.epreuve2, "dice3": item.system.jet3, "name3": item.system.name3, "diff3": item.system.epreuve3, "dice4": item.system.jet4, "name4": item.system.name4, "diff4": item.system.epreuve4, "dice5": item.system.jet5, "name5": item.system.name5, "diff5": item.system.epreuve5 };
              var currentTarget = { "dataset": dataset };
              var event = { "currentTarget": currentTarget };
              onRollCustomSpell(event)
            }
          },
        }
      });
      d.render(true);
    //arme sans dégâts, juste avec épreuve custom
    } else if (item.type == "arme" && item.system.epreuvecustom == true) {
        if (item.system.equipe == false || item.system.enmain == false) {
          return ui.notifications.warn(`L'objet ${itemName} n'est pas équipé`);
        }
        var dataset = { "actor": actor, "dice1": item.system.jet1, "name1": item.system.name1, "diff1": item.system.epreuve1, "dice2": item.system.jet2, "name2": item.system.name2, "diff2": item.system.epreuve2, "dice3": item.system.jet3, "name3": item.system.name3, "diff3": item.system.epreuve3, "dice4": item.system.jet4, "name4": item.system.name4, "diff4": item.system.epreuve4, "dice5": item.system.jet5, "name5": item.system.name5, "diff5": item.system.epreuve5, "dice6": item.system.jet6, "name6": item.system.name6, "diff6": item.system.epreuve6, "dice7": item.system.jet7, "name7": item.system.name7, "diff7": item.system.epreuve7 };
        var currentTarget = { "dataset": dataset };
        var event = { "currentTarget": currentTarget };
        onRollCustomSpell(event)
    //coup spécial, désactivé pour le moment
    /*
    } else if (item.type == "coup" && ((item.system.epreuve != "" && item.system.bourrepif == false) || item.system.bourrepif == true)) {
        if (item.system.bourrepif == false) {
          var name1 = "";
          var name2 = "";
          var diff1 = "";
          var dice1 = "";
          var dice2 = "";
          if (item.system.epreuve.substring(0, 1) != "*") {
            name1 = "Epreuve"
            diff1 = item.system.epreuve
            dice1 = "d20"
          }
          if (item.system.degat.substring(0, 1) != "*") {
            name2 = "Dégâts"
            dice2 = item.system.degat
          }
          var dataset = { "actor": actor, "dice1": dice1, "name1": name1, "diff1": diff1, "dice2": dice2, "name2": name2, "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
          var currentTarget = { "dataset": dataset };
          var event = { "currentTarget": currentTarget };
          onRollCustomSpell(event)
        } else {
          var name1 = "";
          var name2 = "";
          var name3 = "";
          var diff1 = "";
          var diff3 = "";
          var dice1 = "";
          var dice2 = "";
          var dice3 = "";
          if (item.system.epreuve != "" && item.system.epreuve != "-") {
            name1 = "Epreuve d'attaque";
            diff1 = item.system.epreuve;
            dice1 = "d20";
          }
          if (item.system.degat != "" && item.system.degat != "-") {
            name2 = "Dégâts";
            dice2 = item.system.degat;
          }
          if (item.system.attaque != "" && item.system.attaque != "-") {
            name3 = "Epreuve spéciale";
            diff3 = item.system.attaque;
            dice3 = "d20";
          }
          var dataset = { "actor": actor, "dice1": dice1, "name1": name1, "diff1": diff1, "dice2": dice2, "name2": name2, "diff2": "", "dice3": dice3, "name3": name3, "diff3": diff3, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
          var currentTarget = { "dataset": dataset };
          var event = { "currentTarget": currentTarget };
          onRollCustomSpell(event)
        }*/
    } else {
      item.sheet.render(true);
    }
  }
}

//*PCH roll custom avec formulaire pour les sorts 
async function onRollCustomSpell(event) {
  const element = event.currentTarget;
  const dataset = element.dataset;
  var dice1 = "";
  var dice2 = "";
  var dice3 = "";
  var dice4 = "";
  var dice5 = "";
  var dice6 = "";
  var dice7 = "";
  var name1 = "";
  var name2 = "";
  var name3 = "";
  var name4 = "";
  var name5 = "";
  var name6 = "";
  var name7 = "";
  var diff1 = "";
  var diff2 = "";
  var diff3 = "";
  var diff4 = "";
  var diff5 = "";
  var diff6 = "";
  var diff7 = "";
  if (dataset.dice1!=undefined) {dice1 = dataset.dice1;}
  if (dataset.dice2!=undefined) {dice2 = dataset.dice2;}
  if (dataset.dice3!=undefined) {dice3 = dataset.dice3;}
  if (dataset.dice4!=undefined) {dice4 = dataset.dice4;}
  if (dataset.dice5!=undefined) {dice5 = dataset.dice5;}
  if (dataset.dice6!=undefined) {dice6 = dataset.dice6;}
  if (dataset.dice7!=undefined) {dice7 = dataset.dice7;}
  if (dataset.name1!=undefined) {name1 = dataset.name1;}
  if (dataset.name2!=undefined) {name2 = dataset.name2;}
  if (dataset.name3!=undefined) {name3 = dataset.name3;}
  if (dataset.name4!=undefined) {name4 = dataset.name4;}
  if (dataset.name5!=undefined) {name5 = dataset.name5;}
  if (dataset.name6!=undefined) {name6 = dataset.name6;}
  if (dataset.name7!=undefined) {name7 = dataset.name7;}
  if (dataset.diff1!=undefined) {diff1 = dataset.diff1;}
  if (dataset.diff2!=undefined) {diff2 = dataset.diff2;}
  if (dataset.diff3!=undefined) {diff3 = dataset.diff3;}
  if (dataset.diff4!=undefined) {diff4 = dataset.diff4;}
  if (dataset.diff5!=undefined) {diff5 = dataset.diff5;}
  if (dataset.diff6!=undefined) {diff6 = dataset.diff6;}
  if (dataset.diff7!=undefined) {diff7 = dataset.diff7;}

  const actorCible = dataset.actor

  dice1 = dice1.replace(/ /g, "");
  dice2 = dice2.replace(/ /g, "");
  dice3 = dice3.replace(/ /g, "");
  dice4 = dice4.replace(/ /g, "");
  dice5 = dice5.replace(/ /g, "");
  dice6 = dice6.replace(/ /g, "");
  dice7 = dice7.replace(/ /g, "");
  diff1 = diff1.replace(/ /g, "");
  diff2 = diff2.replace(/ /g, "");
  diff3 = diff3.replace(/ /g, "");
  diff4 = diff4.replace(/ /g, "");
  diff5 = diff5.replace(/ /g, "");
  diff6 = diff6.replace(/ /g, "");
  diff7 = diff7.replace(/ /g, "");

  var content = `
  <em style="font-size: 15px;">Raccourcis :</em>
  <br/>
  <em style="font-size: 15px;">@cou @int @cha @ad @fo @att @prd @lvl @pr @prm @esq @rm @mphy @mpsy @att-distance @bonusint</em>
  <hr>
  `
  if (name1 != "") {
    content = content + `
    <div style="display: flex;">
      <label style="font-size: 15px; flex:1;">`+ name1 + `</label>
      <div style="flex:0.1;"></div>
      <label style="font-size: 15px; flex:1;">Difficulté</label>
      <div style="flex:0.1;"></div>
    </div>
    <div style="display: flex;">
      <input style="font-size: 15px; flex:1;" type="text" name="inputFormule1" value="`+ dice1 + `">
      <div style="flex:0.1;"></div>
      <input style="font-size: 15px; flex:1;" type="text" name="inputDiff1" value=`+ diff1 + `></li>
      <div style="flex:0.1;"></div>
    </div>
    <br/>
    `
  }
  if (name2 != "") {
    content = content + `
    <div style="display: flex;">
      <label style="font-size: 15px; flex:1;">`+ name2 + `</label>
      <div style="flex:0.1;"></div>
      <label style="font-size: 15px; flex:1;">Difficulté</label>
      <div style="flex:0.1;"></div>
    </div>
    <div style="display: flex;">
      <input style="font-size: 15px; flex:1;" type="text" name="inputFormule2" value="`+ dice2 + `">
      <div style="flex:0.1;"></div>
      <input style="font-size: 15px; flex:1;" type="text" name="inputDiff2" value=`+ diff2 + `></li>
      <div style="flex:0.1;"></div>
    </div>
    <br/>
    `
  }
  if (name3 != "") {
    content = content + `
    <div style="display: flex;">
      <label style="font-size: 15px; flex:1;">`+ name3 + `</label>
      <div style="flex:0.1;"></div>
      <label style="font-size: 15px; flex:1;">Difficulté</label>
      <div style="flex:0.1;"></div>
    </div>
    <div style="display: flex;">
      <input style="font-size: 15px; flex:1;" type="text" name="inputFormule3" value="`+ dice3 + `">
      <div style="flex:0.1;"></div>
      <input style="font-size: 15px; flex:1;" type="text" name="inputDiff3" value=`+ diff3 + `></li>
      <div style="flex:0.1;"></div>
    </div>
    <br/>
    `
  }
  if (name4 != "") {
    content = content + `
    <div style="display: flex;">
      <label style="font-size: 15px; flex:1;">`+ name4 + `</label>
      <div style="flex:0.1;"></div>
      <label style="font-size: 15px; flex:1;">Difficulté</label>
      <div style="flex:0.1;"></div>
    </div>
    <div style="display: flex;">
      <input style="font-size: 15px; flex:1;" type="text" name="inputFormule4" value="`+ dice4 + `">
      <div style="flex:0.1;"></div>
      <input style="font-size: 15px; flex:1;" type="text" name="inputDiff4" value=`+ diff4 + `></li>
      <div style="flex:0.1;"></div>
    </div>
    <br/>
    `
  }
  if (name5 != "") {
    content = content + `
    <div style="display: flex;">
      <label style="font-size: 15px; flex:1;">`+ name5 + `</label>
      <div style="flex:0.1;"></div>
      <label style="font-size: 15px; flex:1;">Difficulté</label>
      <div style="flex:0.1;"></div>
    </div>
    <div style="display: flex;">
      <input style="font-size: 15px; flex:1;" type="text" name="inputFormule5" value="`+ dice5 + `">
      <div style="flex:0.1;"></div>
      <input style="font-size: 15px; flex:1;" type="text" name="inputDiff5" value=`+ diff5 + `></li>
      <div style="flex:0.1;"></div>
    </div>
    <br/>
    `
  }
  if (name6 != "") {
    content = content + `
    <div style="display: flex;">
      <label style="font-size: 15px; flex:1;">`+ name6 + `</label>
      <div style="flex:0.1;"></div>
      <label style="font-size: 15px; flex:1;">Difficulté</label>
      <div style="flex:0.1;"></div>
    </div>
    <div style="display: flex;">
      <input style="font-size: 15px; flex:1;" type="text" name="inputFormule6" value="`+ dice6 + `">
      <div style="flex:0.1;"></div>
      <input style="font-size: 15px; flex:1;" type="text" name="inputDiff6" value=`+ diff6 + `></li>
      <div style="flex:0.1;"></div>
    </div>
    <br/>
    `
  }
  if (name7 != "") {
    content = content + `
    <div style="display: flex;">
      <label style="font-size: 15px; flex:1;">`+ name7 + `</label>
      <div style="flex:0.1;"></div>
      <label style="font-size: 15px; flex:1;">Difficulté</label>
      <div style="flex:0.1;"></div>
    </div>
    <div style="display: flex;">
      <input style="font-size: 15px; flex:1;" type="text" name="inputFormule7" value="`+ dice7 + `">
      <div style="flex:0.1;"></div>
      <input style="font-size: 15px; flex:1;" type="text" name="inputDiff7" value=`+ diff7 + `></li>
      <div style="flex:0.1;"></div>
    </div>
    <br/><br/>
    `
  }
  var buttons = []
  var one = {
    label: '<span style="font-size: 12px;">'+name1+'</span>',
    callback: (html) => {
      let dice = html.find('input[name="inputFormule1"').val();
      let diff = html.find('input[name="inputDiff1"').val();
      const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
      //dice=game.naheulbeuk.macros.replaceAttr(dice,this.actor);
      //diff=game.naheulbeuk.macros.replaceAttr(diff,this.actor);
      if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
        if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
      }
      if (dice.substr(0, 6) == "cible:") {
        dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        dice = game.naheulbeuk.macros.replaceAttr(dice, actorCible);
      }
      if (diff.substr(0, 6) == "cible:") {
        diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        diff = game.naheulbeuk.macros.replaceAttr(diff, actorCible);
      }
      if (dice != "") {
        let r = new Roll(dice);
        //await r.roll({"async": true});
        r.roll({ "async": true }).then(r => {
          var result = 0;
          var tplData = {};
          var reussite = "Réussite !   ";
          if (diff == "") {
            tplData = {
              diff: "",
              name: name1 
            }
            renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
              r.toMessage({
                user: game.user.id,
                flavor: msgFlavor,
                speaker: ChatMessage.getSpeaker({ actor: actorCible })
              });
            });
          } else {
            diff = new Roll(diff);
            diff.roll({ "async": true }).then(diff => {
              result = Math.abs(diff.total - r.total);
              if (r.total > diff.total) { reussite = "Echec !   " };
              tplData = {
                diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                name: name1 
              };
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: actorCible })
                });
              });
            });
          };
        });
      }
      return false;
    }
  }
  var two = {
    label: '<span style="font-size: 12px;">'+name2+'</span>',
    callback: (html) => {
      let dice = html.find('input[name="inputFormule2"').val();
      let diff = html.find('input[name="inputDiff2"').val();
      const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
      //dice=game.naheulbeuk.macros.replaceAttr(dice,actorCible);
      //diff=game.naheulbeuk.macros.replaceAttr(diff,actorCible);
      if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
        if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
      }
      if (dice.substr(0, 6) == "cible:") {
        dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        dice = game.naheulbeuk.macros.replaceAttr(dice, actorCible);
      }
      if (diff.substr(0, 6) == "cible:") {
        diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        diff = game.naheulbeuk.macros.replaceAttr(diff, actorCible);
      }
      if (dice != "") {
        let r = new Roll(dice);
        //await r.roll({"async": true});
        r.roll({ "async": true }).then(r => {
          var result = 0;
          var tplData = {};
          var reussite = "Réussite !   ";
          if (diff == "") {
            tplData = {
              diff: "",
              name: name2 
            }
            renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
              r.toMessage({
                user: game.user.id,
                flavor: msgFlavor,
                speaker: ChatMessage.getSpeaker({ actor: actorCible })
              });
            });
          } else {
            diff = new Roll(diff);
            diff.roll({ "async": true }).then(diff => {
              result = Math.abs(diff.total - r.total);
              if (r.total > diff.total) { reussite = "Echec !   " };
              tplData = {
                diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                name: name2 
              };
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: actorCible })
                });
              });
            });
          };
        });
      }
      return false;
    }
  }
  var three = {
    label: '<span style="font-size: 12px;">'+name3+'</span>',
    callback: (html) => {
      let dice = html.find('input[name="inputFormule3"').val();
      let diff = html.find('input[name="inputDiff3"').val();
      const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
      //dice=game.naheulbeuk.macros.replaceAttr(dice,actorCible);
      //diff=game.naheulbeuk.macros.replaceAttr(diff,actorCible);
      if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
        if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
      }
      if (dice.substr(0, 6) == "cible:") {
        dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        dice = game.naheulbeuk.macros.replaceAttr(dice, actorCible);
      }
      if (diff.substr(0, 6) == "cible:") {
        diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        diff = game.naheulbeuk.macros.replaceAttr(diff, actorCible);
      }
      if (dice != "") {
        let r = new Roll(dice);
        //await r.roll({"async": true});
        r.roll({ "async": true }).then(r => {
          var result = 0;
          var tplData = {};
          var reussite = "Réussite !   ";
          if (diff == "") {
            tplData = {
              diff: "",
              name: name3 
            }
            renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
              r.toMessage({
                user: game.user.id,
                flavor: msgFlavor,
                speaker: ChatMessage.getSpeaker({ actor: actorCible })
              });
            });
          } else {
            diff = new Roll(diff);
            diff.roll({ "async": true }).then(diff => {
              result = Math.abs(diff.total - r.total);
              if (r.total > diff.total) { reussite = "Echec !   " };
              tplData = {
                diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                name: name3 
              };
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: actorCible })
                });
              });
            });
          };
        });
      }
      return false;
    }
  }
  var four = {
    label: '<span style="font-size: 12px;">'+name4+'</span>',
    callback: (html) => {
      let dice = html.find('input[name="inputFormule4"').val();
      let diff = html.find('input[name="inputDiff4"').val();
      const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
      //dice=game.naheulbeuk.macros.replaceAttr(dice,actorCible);
      //diff=game.naheulbeuk.macros.replaceAttr(diff,actorCible);
      if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
        if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
      }
      if (dice.substr(0, 6) == "cible:") {
        dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        dice = game.naheulbeuk.macros.replaceAttr(dice, actorCible);
      }
      if (diff.substr(0, 6) == "cible:") {
        diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        diff = game.naheulbeuk.macros.replaceAttr(diff, actorCible);
      }
      if (dice != "") {
        let r = new Roll(dice);
        //await r.roll({"async": true});
        r.roll({ "async": true }).then(r => {
          var result = 0;
          var tplData = {};
          var reussite = "Réussite !   ";
          if (diff == "") {
            tplData = {
              diff: "",
              name: name4 
            }
            renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
              r.toMessage({
                user: game.user.id,
                flavor: msgFlavor,
                speaker: ChatMessage.getSpeaker({ actor: actorCible })
              });
            });
          } else {
            diff = new Roll(diff);
            diff.roll({ "async": true }).then(diff => {
              result = Math.abs(diff.total - r.total);
              if (r.total > diff.total) { reussite = "Echec !   " };
              tplData = {
                diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                name: name4 
              };
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: actorCible })
                });
              });
            });
          };
        });
      }
      return false;
    }
  }
  var five = {
    label: '<span style="font-size: 12px;">'+name5+'</span>',
    callback: (html) => {
      let dice = html.find('input[name="inputFormule5"').val();
      let diff = html.find('input[name="inputDiff5"').val();
      const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
      //dice=game.naheulbeuk.macros.replaceAttr(dice,actorCible);
      //diff=game.naheulbeuk.macros.replaceAttr(diff,actorCible);
      if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
        if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
      }
      if (dice.substr(0, 6) == "cible:") {
        dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        dice = game.naheulbeuk.macros.replaceAttr(dice, actorCible);
      }
      if (diff.substr(0, 6) == "cible:") {
        diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        diff = game.naheulbeuk.macros.replaceAttr(diff, actorCible);
      }
      if (dice != "") {
        let r = new Roll(dice);
        //await r.roll({"async": true});
        r.roll({ "async": true }).then(r => {
          var result = 0;
          var tplData = {};
          var reussite = "Réussite !   ";
          if (diff == "") {
            tplData = {
              diff: "",
              name: name5 
            }
            renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
              r.toMessage({
                user: game.user.id,
                flavor: msgFlavor,
                speaker: ChatMessage.getSpeaker({ actor: actorCible })
              });
            });
          } else {
            diff = new Roll(diff);
            diff.roll({ "async": true }).then(diff => {
              result = Math.abs(diff.total - r.total);
              if (r.total > diff.total) { reussite = "Echec !   " };
              tplData = {
                diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                name: name5 
              };
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: actorCible })
                });
              });
            });
          };
        });
      }
      return false;
    }
  }
  var six = {
    label: '<span style="font-size: 12px;">'+name6+'</span>',
    callback: (html) => {
      let dice = html.find('input[name="inputFormule6"').val();
      let diff = html.find('input[name="inputDiff6"').val();
      const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
      //dice=game.naheulbeuk.macros.replaceAttr(dice,actorCible);
      //diff=game.naheulbeuk.macros.replaceAttr(diff,actorCible);
      if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
        if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
      }
      if (dice.substr(0, 6) == "cible:") {
        dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        dice = game.naheulbeuk.macros.replaceAttr(dice, actorCible);
      }
      if (diff.substr(0, 6) == "cible:") {
        diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        diff = game.naheulbeuk.macros.replaceAttr(diff, actorCible);
      }
      if (dice != "") {
        let r = new Roll(dice);
        //await r.roll({"async": true});
        r.roll({ "async": true }).then(r => {
          var result = 0;
          var tplData = {};
          var reussite = "Réussite !   ";
          if (diff == "") {
            tplData = {
              diff: "",
              name: name6 
            }
            renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
              r.toMessage({
                user: game.user.id,
                flavor: msgFlavor,
                speaker: ChatMessage.getSpeaker({ actor: actorCible })
              });
            });
          } else {
            diff = new Roll(diff);
            diff.roll({ "async": true }).then(diff => {
              result = Math.abs(diff.total - r.total);
              if (r.total > diff.total) { reussite = "Echec !   " };
              tplData = {
                diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                name: name6 
              };
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: actorCible })
                });
              });
            });
          };
        });
      }
      return false;
    }
  }
  var seven = {
    label: '<span style="font-size: 12px;">'+name7+'</span>',
    callback: (html) => {
      let dice = html.find('input[name="inputFormule5"').val();
      let diff = html.find('input[name="inputDiff5"').val();
      const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
      //dice=game.naheulbeuk.macros.replaceAttr(dice,actorCible);
      //diff=game.naheulbeuk.macros.replaceAttr(diff,actorCible);
      if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
        if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
      }
      if (dice.substr(0, 6) == "cible:") {
        dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        dice = game.naheulbeuk.macros.replaceAttr(dice, actorCible);
      }
      if (diff.substr(0, 6) == "cible:") {
        diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
      } else {
        diff = game.naheulbeuk.macros.replaceAttr(diff, actorCible);
      }
      if (dice != "") {
        let r = new Roll(dice);
        //await r.roll({"async": true});
        r.roll({ "async": true }).then(r => {
          var result = 0;
          var tplData = {};
          var reussite = "Réussite !   ";
          if (diff == "") {
            tplData = {
              diff: "",
              name: name7 
            }
            renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
              r.toMessage({
                user: game.user.id,
                flavor: msgFlavor,
                speaker: ChatMessage.getSpeaker({ actor: actorCible })
              });
            });
          } else {
            diff = new Roll(diff);
            diff.roll({ "async": true }).then(diff => {
              result = Math.abs(diff.total - r.total);
              if (r.total > diff.total) { reussite = "Echec !   " };
              tplData = {
                diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                name: name7 
              };
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: actorCible })
                });
              });
            });
          };
        });
      }
      return false;
    }
  }
  if (name1 != "") { buttons.push(one) }
  if (name2 != "") { buttons.push(two) }
  if (name3 != "") { buttons.push(three) }
  if (name4 != "") { buttons.push(four) }
  if (name5 != "") { buttons.push(five) }
  if (name6 != "") { buttons.push(six) }
  if (name7 != "") { buttons.push(seven) }
  const myDialogOptions = {
    width: 700
  };
  let d = new CustomDialog({
    title: "Avancé",
    content: content,
    buttons: buttons
  }, myDialogOptions);
  d.render(true);
}

export class CustomDialog extends Dialog {
  submit(button) {
    try {
      if (button.callback && button.callback(this.options.jQuery ? this.element : this.element[0]) !== false) this.close();
    } catch (err) {
      ui.notifications.error(err);
      throw new Error(err);
    }
  }
}