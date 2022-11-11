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
    formula: "@abilities.cou.value + @abilities.cou.bonus + @abilities.cou.bonus_man",
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
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }            }
          },
          two: {
            label: "Utiliser l'objet",
            callback: (html) => {
              if (item.system.epreuvecustom == true) {
                var dataset = { "actor": actor, "dice1": item.system.jet1, "name1": item.system.name1, "diff1": item.system.epreuve1, "dice2": item.system.jet2, "name2": item.system.name2, "diff2": item.system.epreuve2, "dice3": item.system.jet3, "name3": item.system.name3, "diff3": item.system.epreuve3, "dice4": item.system.jet4, "name4": item.system.name4, "diff4": item.system.epreuve4, "dice5": item.system.jet5, "name5": item.system.name5, "diff5": item.system.epreuve5 };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
              } else {
                if (item.system.degat == "") {
                  var dataset = { "actor": actor, "dice1": "d20", "name1": "Epreuve", "diff1": item.system.epreuve, "dice2": "", "name2": "", "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                } else {
                  var dataset = { "actor": actor, "dice1": "d20", "name1": "Epreuve", "diff1": item.system.epreuve, "dice2": item.system.degat, "name2": "Dégâts", "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                }
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }            }
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
                  if (item.system.att_arme_jet != "-") { var attaque = "@att-distance" } else { var attaque = "@att+" + item.system.att }
                  var degat = item.system.formula;
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) > 12) {
                    degat = degat + "+" + Math.max(0, (actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) - 12)
                  };
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) < 9) {
                    degat = degat + "-1"
                  };
                  if (item.system.att_arme_jet != "-" && actor.system.attributes.att_arme_jet.degat != 0) {
                    degat = degat + actor.system.attributes.att_arme_jet.degat
                  };
                }

                var dataset = { "actor": actor, "dice1": "d20", "name1": attname, "diff1": attaque, "dice2": degat, "name2": degatname, "diff2": "", "dice3": "d20", "name3": prdname, "diff3": prd, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }            }
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
                  if (item.system.att_arme_jet != "-") { var attaque = "@att-distance" } else { var attaque = "@att+" + item.system.att }
                  var degat = item.system.formula;
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus  + actor.system.abilities.fo.bonus_man) > 12) {
                    degat = degat + "+" + Math.max(0, (actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) - 12)
                  };
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) < 9) {
                    degat = degat + "-1"
                  };
                  if (item.system.att_arme_jet != "-" && actor.system.attributes.att_arme_jet.degat != 0) {
                    degat = degat + actor.system.attributes.att_arme_jet.degat
                  };
                }

                var dataset = { "actor": actor, "dice1": "d20", "name1": attname, "diff1": attaque, "dice2": degat, "name2": degatname, "diff2": "", "dice3": "d20", "name3": prdname, "diff3": prd, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
              game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }            }
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
              game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }            }
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
                game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
                game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
              }
            }
          }
        }
      });
      d.render(true);*/
    } else {
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }    }
  }

  if (param==0){
    //sort
    if (item.type == "sort") {
      if (item.system.epreuvecustom == true) {
        var dataset = { "actor": actor, "dice1": item.system.jet1, "name1": item.system.name1, "diff1": item.system.epreuve1, "dice2": item.system.jet2, "name2": item.system.name2, "diff2": item.system.epreuve2, "dice3": item.system.jet3, "name3": item.system.name3, "diff3": item.system.epreuve3, "dice4": item.system.jet4, "name4": item.system.name4, "diff4": item.system.epreuve4, "dice5": item.system.jet5, "name5": item.system.name5, "diff5": item.system.epreuve5 };
        var currentTarget = { "dataset": dataset };
        var event = { "currentTarget": currentTarget };
        game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
      } else {
        if (item.system.degat == "") {
          var dataset = { "actor": actor, "dice1": "d20", "name1": "Epreuve", "diff1": item.system.epreuve, "dice2": "", "name2": "", "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
        } else {
          var dataset = { "actor": actor, "dice1": "d20", "name1": "Epreuve", "diff1": item.system.epreuve, "dice2": item.system.degat, "name2": "Dégâts", "diff2": "", "dice3": "", "name3": "", "diff3": "", "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
        }
        var currentTarget = { "dataset": dataset };
        var event = { "currentTarget": currentTarget };
        game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
            if (item.system.att_arme_jet != "-") { var attaque = "@att-distance" } else { var attaque = "@att+" + item.system.att }
            var degat = item.system.formula;
            if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) > 12) {
              degat = degat + "+" + Math.max(0, (actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) - 12)
            };
            if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) < 9) {
              degat = degat + "-1"
            };
            if (item.system.att_arme_jet != "-" && actor.system.attributes.att_arme_jet.degat != 0) {
              degat = degat + actor.system.attributes.att_arme_jet.degat
            };
          }

          var dataset = { "actor": actor, "dice1": "d20", "name1": attname, "diff1": attaque, "dice2": degat, "name2": degatname, "diff2": "", "dice3": "d20", "name3": prdname, "diff3": prd, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
          var currentTarget = { "dataset": dataset };
          var event = { "currentTarget": currentTarget };
          game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
                  if (item.system.att_arme_jet != "-") { var attaque = "@att-distance" } else { var attaque = "@att+" + item.system.att }
                  var degat = item.system.formula;
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) > 12) {
                    degat = degat + "+" + Math.max(0, (actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) - 12)
                  };
                  if ((actor.system.abilities.fo.value + actor.system.abilities.fo.bonus + actor.system.abilities.fo.bonus_man) < 9) {
                    degat = degat + "-1"
                  };
                  if (item.system.att_arme_jet != "-" && actor.system.attributes.att_arme_jet.degat != 0) {
                    degat = degat + actor.system.attributes.att_arme_jet.degat
                  };
                }

                var dataset = { "actor": actor, "dice1": "d20", "name1": attname, "diff1": attaque, "dice2": degat, "name2": degatname, "diff2": "", "dice3": "d20", "name3": prdname, "diff3": prd, "dice4": "", "name4": "", "diff4": "", "dice5": "", "name5": "", "diff5": "" };
                var currentTarget = { "dataset": dataset };
                var event = { "currentTarget": currentTarget };
                game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
              game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
        game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
          game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
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
          game.naheulbeuk.macros.onRollCustom(actor,item,dataset)
        }*/
    } else {
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }    }
  }
}