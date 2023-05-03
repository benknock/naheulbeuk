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
    //formula: "@abilities.cou.value + @abilities.cou.bonus + @abilities.cou.bonus_man",
    formula: "@attributes.init.total",
    decimals: 0
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

//Hook ready utilisé pour faire des patchs suite à des MAJ qui cassent le système
Hooks.once('ready', async function () {
  //Gestion message de bienvenue + compteur sur nouvelle version
  //Creation du setting si non existant
  try {
    await game.settings.register("core", "naheulbeuk.version", { scope: 'world', type: String })
  } catch (e) {
    await game.settings.register("core", "naheulbeuk.version", { scope: 'world', type: String })
    await game.settings.set("core", "naheulbeuk.version", "10.0.9")
  }
  //Comparaison du setting avec la version actuelle et sinon on affiche un message et on comptabilise puis maj setting
  if (game.system.version != game.settings.get("core", "naheulbeuk.version")) {
    //--------Envoie message aux GM
    // Get GM's
    const gms = ChatMessage.getWhisperRecipients("GM");
    // Build Chat Messages
    const content = [`
<h1>Bienvenue dans le système Naheulbeuk</h1>
Si vous avez des questions, vous pouvez consulter 
<a href="https://foundryvtt.wiki/fr/systemes/Naheulbeuk">la documentation</a>.<br/>
Vous pouvez également rejoindre la communauté <strong>Naheulbeuk</strong> sur le Discord <strong>La Fonderie</strong>.<br/><br/>
<strong><u>Notes de la mise à jour 10.1.2</u></strong><br/>
- Si un PJ/MJ cibles des personnages lorsqu'il fait un jet de dés, ces cibles apparaissent dans le message du chat. Le but est d'aider le MJ à s'avoir qui est conscerné par les actions<br/>
- Refonte du système de drag and drop et du combat rapide, <a href="https://foundryvtt.wiki/fr/systemes/Naheulbeuk#titre9">plus d'infos ici</a>.<br/>
- Ajout de compendiums PJ prétirés et Soldats prétirés
`];
    const chatData = content.map(c => {
      return {
        whisper: gms,
        speaker: { alias: game.i18n.localize("Naheulbeuk") },
        flags: { core: { nue: true, canPopout: true } },
        content: c
      };
    });
    ChatMessage.implementation.createDocuments(chatData);
    //---------Comptabilisation
    let ip
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      ip = await response.json();
    } catch (error) {
      ip={'ip':'?'}
    }
    const data = { 'version' : ip.ip+"---"+game.system.version };
    try {
      const response = await fetch('http://162.19.76.240:5000/add_data', {
      //const response = await fetch('http://127.0.0.1:5000/add_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer FOUNDRY_dipes_5'
        },
        body: JSON.stringify(data),
        mode: 'cors'
      });
    } catch (error) {
      // TypeError: Failed to fetch
      console.log('There was an error', error);
    }

    //Patch nouveau system d'initiative 10.0.9, a retirer dans quelques version
    /*for (let actor of game.actors) {
      //Si la valeur d'initiative est différente de son équivalent en courage ou que le courage vaut 0
      if (actor.system.attributes.init.value != actor.system.abilities.cou.value + actor.system.abilities.cou.bonus + actor.system.abilities.cou.bonus_man || actor.system.abilities.cou.value + actor.system.abilities.cou.bonus + actor.system.abilities.cou.bonus_man == 0) {
        const actorData = {
          "system.attributes.init.value": actor.system.abilities.cou.value + actor.system.abilities.cou.bonus + actor.system.abilities.cou.bonus_man,
          "system.attributes.init.total": actor.system.attributes.init.noises + actor.system.attributes.init.bonus_man + actor.system.attributes.init.bonus + actor.system.abilities.cou.value + actor.system.abilities.cou.bonus + actor.system.abilities.cou.bonus_man
        };
        await actor.update(actorData);

      } else { return }
    }*/
    CONFIG.Combat.initiative = {
      formula: "@attributes.init.total",
      decimals: 0
    };
    //FIN -- Patch nouveau system d'initiative
    
    //--------Maj setting
    await game.settings.set("core", "naheulbeuk.version", game.system.version)
  }
});

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */

//Fonction pas terrible à améliorer à l'occasion
function rollItemMacro(itemName, param) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Tu ne possédes pas l'objet ` + itemName + ``);
  //taille de la fenêtre de dialogue
  var myDialogOptions = {
    width: 500
  };
  //on prépare les boutons
  let buttons = {}
  //si l'objet est un sort
  if (item.type=="sort") {
    buttons = {
      one: {
        label: "Voir le sort",
        callback: (html) => {
          if (item.system.equipe == true) {
            item.sheet.render(true, { editable: false });
          } else {
            item.sheet.render(true)
          }
        }
      }
    }
    if ((item.system.epreuve!="" && item.system.epreuve!="-") || (item.system.degat!="" && item.system.degat!="-") || item.system.epreuvecustom){
      buttons.two = {
        label: "Lancer le sort",
        callback: (html) => {
          callbackSort(actor, item)
        }
      }
    }
  }
  //SI l'objet est une arme
  if (item.type=="arme"){
    buttons= {
      one: {
        label: "Voir l'objet",
        callback: (html) => {
          if (item.system.equipe == true) {
            item.sheet.render(true, { editable: false });
          } else {
            item.sheet.render(true)
          }
        }
      }
    }
    if ((item.system.formula!="" && item.system.formula!="-") || (item.system.prd!="" && item.system.prd!="-")){
      buttons.two= {
        label: "Utiliser l'objet",
        callback: (html) => {
          callbackArme(actor, item)
        }
      }
      if (item.system.arme_cac && (param==3 || param==4)){
        myDialogOptions.width = 550
        buttons.three= {
          label: "Attaque rapide",
          callback: (html) => {
            callbackAttaqueRapide(actor, item)
          }
        }
      }
    }
    if (item.system.epreuvecustom) {
      buttons.four= {
        label: "Épreuve(s) custom",
        callback: (html) => {
          callbackCustom(actor, item)
        }
      }
    }
  }
  //SI l'objet est une attaque
  if (item.type=="attaque"){
    buttons= {
      one: {
        label: "Voir l'attaque",
        callback: (html) => {
          if (item.system.equipe == true) {
            item.sheet.render(true, { editable: false });
          } else {
            item.sheet.render(true)
          }
        }
      }
    }
    if ((item.system.epreuvecustom == false)){
      buttons.two= {
        label: "Attaque standard",
        callback: (html) => {
          callbackAttaque(actor, item)
        }
      }
      if (param==3 || param==4) {
        buttons.three= {
          label: "Attaque rapide",
          callback: (html) => {
            callbackAttaqueRapide(actor, item)
          }
        }
      }
    }
    if (item.system.epreuvecustom) {
      buttons.four= {
        label: "Épreuve(s) custom",
        callback: (html) => {
          callbackAttaqueCust(actor, item)
        }
      }
    }
  }
  //Si l'objet est un coup spécial
  if (item.type=="coup"){
    buttons = {}
    buttons.one= {
      label: "Voir le coup spécial",
      callback: (html) => {
        if (item.system.equipe == true) {
          item.sheet.render(true, { editable: false });
        } else {
          item.sheet.render(true)
        }
      }
    }
    let tabl = []
    let btn2 = false
    tabl.push(item.system.epreuve)
    tabl.push(item.system.degat)
    if (item.system.bourrepif){
      tabl.push(item.system.attaque)
    }
    for (let bp of tabl){
      if (bp != "" && bp != "-" && bp.slice(0, 1)!="*"){btn2=true}
    }
    if (btn2){
      buttons.two= {
        label: "Utiliser le coup spécial",
        callback: (html) => {
          callbackCoup(actor, item)
        }
      }
    }
  } 
  

  //On ajuste les valeurs incohérentes
  //attaque rapide non éligible
  if (param==3 && (item.system.epreuvecustom!=false || (item.type!="arme" && item.type!="attaque") || (item.type=="arme" && item.system.arme_cac!=true))){
    param=2
  }
  //Arme cac+distance --> il faut choisir attaque rapide ou normal
  if (param==3 && item.system.arme_cac && item.system.arme_distance){
    param=1
  }
  //sort sans aucun jet de dés --> il faut uniquement voir le sort
  if (item.type=="sort" && item.system.epreuvecustom==false && (item.system.epreuve =="" || item.system.epreuve=="-") && (item.system.degat=="" || item.system.degat=="-")){
    param=5
  }
  //arme avec une épreuve custom + une épreuve d'attaque ou de def --> il faut choisir attaque ou épreuve custom
  if (param==2 && item.type=="arme" && item.system.epreuvecustom && ((item.system.formula!="" && item.system.formula!="-") || (item.system.prd!="" && item.system.prd!="-"))){
    param=1
  }
  //Si param=4 (interface avec attaque rapide), les boutons ont été rajouté, je repasse à param=1
  if(param==4){param=1}
  //coup spécial sans jets de dés
  if (item.type=="coup"){
    let tabl=[]
    let btn2 = false
    tabl.push(item.system.epreuve)
    tabl.push(item.system.degat)
    if (item.system.bourrepif){
      tabl.push(item.system.attaque)
    }
    for (let bp of tabl){
      if (bp != "" && bp != "-" && bp.slice(0, 1)!="*"){btn2=true}
    }
    if (btn2==false){param=5}
  }

  //Si on n'est pas en lancement directe on génère le dialogue pour demander quoi faire
  if (param==1 && (item.type=="sort" || item.type=="arme" || item.type=="attaque" || item.type=="coup")) {
    let d = new Dialog({
      title: item.name,
      content: `
      <label style="font-size: 15px;">Que souhaitez vous faire ?</label>
      <br/>
      `,
      buttons: buttons
    },myDialogOptions);
    d.render(true);
  //sinon on lance l'action
  } else if ((param==2 && (item.type=="sort" || item.type=="arme" || item.type=="attaque" || item.type=="coup"))) {
    if (item.type=="sort") {callbackSort(actor, item)}
    if (item.type=="coup") {callbackCoup(actor,item)}
    if (item.type=="arme") {
      if ((item.system.formula!="" && item.system.formula!="-") || (item.system.prd!="" && item.system.prd!="-")){
        callbackArme(actor, item)
      } else if (item.system.epreuvecustom) {
        callbackCustom(actor,item)
      }
    }
    if (item.type=="attaque"){
      if (item.system.epreuvecustom){
        callbackAttaqueCust(actor,item)
      } else {
        callbackAttaque(actor,item)
      }
    }
  //SI c'est une attaque rapide (param2 attaque rapide)
  } else if (param==3){
    callbackAttaqueRapide(actor,item)
  //Enfin dans les autres cas on affiche l'objet
  } else {
    if (item.system.equipe == true) {
      item.sheet.render(true, { editable: false });
    } else {
      item.sheet.render(true)
    }
  }
}

//Actions pour un sort drag and drop dans la barre de macro
function callbackSort(actor, item) {
  if (item.system.epreuvecustom == true) {
    var dataset = { 
      "actor": actor,
      "dice1": item.system.jet1,
      "name1": item.system.name1,
      "diff1": item.system.epreuve1,
      "dice2": item.system.jet2,
      "name2": item.system.name2,
      "diff2": item.system.epreuve2,
      "dice3": item.system.jet3,
      "name3": item.system.name3,
      "diff3": item.system.epreuve3,
      "dice4": item.system.jet4,
      "name4": item.system.name4,
      "diff4": item.system.epreuve4,
      "dice5": item.system.jet5,
      "name5": item.system.name5,
      "diff5": item.system.epreuve5
    };
    game.naheulbeuk.macros.onRollCustom(actor, item, dataset, item.name)
  } else {
    var dataset = {}
    if (item.system.epreuve!="" && item.system.epreuve!="-"){
      dataset = {
        "actor": actor,
        "dice1": "d20",
        "name1": "Épreuve",
        "diff1": item.system.epreuve
      };
    }
    if (item.system.degat != "" && item.system.degat != "-") {
      dataset.dice2=item.system.degat;
      dataset.name2="Dégâts";
    }
    game.naheulbeuk.macros.onRollCustom(actor, item, dataset, item.name)
  }
}

//Actions pour une arme drag and drop dans la barre de macro
function callbackArme(actor, item) {
  if (item.system.equipe == false) {
    return ui.notifications.warn(`L'objet ` + item.name + ` n'est pas équipé`);
  } else if (item.type=="arme") {
    var dataset = { 
      "actor": actor
    };
    //dataset pour une arme de cac
    if (item.system.arme_cac){
      dataset.name1 = "Attaque au contact";
      dataset.dice1 = "d20";
      dataset.diff1 = game.naheulbeuk.macros.replaceAttr("@att+" + item.system.att, actor);
      dataset.name2 = "Dégâts au contact";
      let nain = 0
      for (let itemActor of actor.items){
        if (itemActor.type=="origine" && itemActor.name=="Nain"){
          if (item.system.deuxmains) {nain=1}
        }
      }
      let degat2ndpart = game.naheulbeuk.macros.replaceAttr(item.system.degat_arme_cac + "+" + nain + "+@degat-contact+@bonusfo", actor)
      dataset.dice2=game.naheulbeuk.macros.replaceAttr(item.system.formula + "+" +degat2ndpart, actor)
    }
    //dataset pour une arme à distance
    if (item.system.arme_distance){
      dataset.name3 = "Attaque à distance";
      dataset.dice3 = "d20"
      dataset.diff3= game.naheulbeuk.macros.replaceAttr("@att-distance+" + item.system.att_arme_jet,actor);
      dataset.name4 = "Dégâts à distance";
      let degat2ndpart = game.naheulbeuk.macros.replaceAttr(item.system.degat_arme_jet + "+@degat-contact+@bonusfo", actor)
      dataset.dice4=game.naheulbeuk.macros.replaceAttr(item.system.formula + "+" +degat2ndpart, actor)
    }
    //dataset pour la parade
    if (item.system.prd != "-") {
      dataset.name5 = "Parade";
      dataset.dice5 = "d20";
      dataset.diff5 = game.naheulbeuk.macros.replaceAttr("@prd+" + item.system.prd, actor);
    }

    game.naheulbeuk.macros.onRollCustom(actor, item, dataset, item.name)
  }
}

//Actions pour une arme avec des jets custom
function callbackCustom(actor, item) {
  if (item.system.equipe == false) {
    return ui.notifications.warn(`L'objet ` + item.name + ` n'est pas équipé`);
  }
  var dataset = { 
    "actor": actor,
    "dice1": item.system.jet1,
    "name1": item.system.name1,
    "diff1": item.system.epreuve1,
    "dice2": item.system.jet2,
    "name2": item.system.name2,
    "diff2": item.system.epreuve2,
    "dice3": item.system.jet3,
    "name3": item.system.name3,
    "diff3": item.system.epreuve3,
    "dice4": item.system.jet4,
    "name4": item.system.name4,
    "diff4": item.system.epreuve4,
    "dice5": item.system.jet5,
    "name5": item.system.name5,
    "diff5": item.system.epreuve5,
    "dice6": item.system.jet6,
    "name6": item.system.name6,
    "diff6": item.system.epreuve6,
    "dice7": item.system.jet7,
    "name7": item.system.name7,
    "diff7": item.system.epreuve7
  };
  game.naheulbeuk.macros.onRollCustom(actor, item, dataset, item.name)
}

//Action pour une attaque (pnj)
function callbackAttaque(actor,item){
  var dataset = { 
    "actor": actor
  };
  if (item.system.attaque!="" && item.system.attaque!="-"){
    dataset.name1="Attaque"
    dataset.dice1="d20"
    dataset.diff1=item.system.attaque
  }
  if (item.system.formula!="" && item.system.formula!="-"){
    dataset.name2="Dégâts"
    dataset.dice2=item.system.formula
  }
  game.naheulbeuk.macros.onRollCustom(actor, item, dataset, item.name)
}

//Action pour une attaque custom(pnj)
function callbackAttaqueCust(actor,item){
  var dataset = { 
    "actor": actor,
    "dice1": item.system.jet1,
    "name1": item.system.name1,
    "diff1": item.system.epreuve1,
    "dice2": item.system.jet2,
    "name2": item.system.name2,
    "diff2": item.system.epreuve2,
    "dice3": item.system.jet3,
    "name3": item.system.name3,
    "diff3": item.system.epreuve3,
    "dice4": item.system.jet4,
    "name4": item.system.name4,
    "diff4": item.system.epreuve4,
    "dice5": item.system.jet5,
    "name5": item.system.name5,
    "diff5": item.system.epreuve5,
    "dice6": item.system.jet6,
    "name6": item.system.name6,
    "diff6": item.system.epreuve6,
    "dice7": item.system.jet7,
    "name7": item.system.name7,
    "diff7": item.system.epreuve7,
  };
  game.naheulbeuk.macros.onRollCustom(actor, item, dataset, item.name)
}

//Actions pour une arme avec des jets custom
function callbackCoup(actor, item) {
  if (item.system.equipe == false) {
    return ui.notifications.warn(`L'objet ` + item.name + ` n'est pas équipé`);
  }
  var dataset = {};
  if (item.system.epreuve != "" && item.system.epreuve != "-" && item.system.epreuve.slice(0, 1)!="*"){
    dataset.name1="Épreuve"
    dataset.dice1="d20"
    dataset.diff1=item.system.epreuve
  }
  if (item.system.degat != "" && item.system.degat != "-" && item.system.degat.slice(0, 1)!="*"){
    dataset.name2="Dégâts"
    dataset.dice2=item.system.degat
  }
  if (item.system.bourrepif==true && item.system.attaque != "" && item.system.attaque != "-" && item.system.attaque.slice(0, 1)!="*"){
    dataset.name3="Épreuve spéciale"
    dataset.dice3=item.system.attaque
  }
  game.naheulbeuk.macros.onRollCustom(actor, item, dataset, item.name)
}

function callbackAttaqueRapide(actor,item) {
  if (game.naheulbeuk.macros.getSpeakersTarget()==null){return}
  const source = actor;
  const cible = game.naheulbeuk.macros.getSpeakersTarget();
  if (actor.type=="character") {
    var att_arme = game.naheulbeuk.macros.replaceAttr("@att+" + item.system.att, actor)
    let nain = 0
    for (let itemActor of actor.items){
      if (itemActor.type=="origine" && itemActor.name=="Nain"){
        if (item.system.deuxmains) {nain=1}
      }
    }
    let degat2ndpart = game.naheulbeuk.macros.replaceAttr(item.system.degat_arme_cac + "+" + nain + "+@degat-contact+@bonusfo", actor)
    var deg_arme=game.naheulbeuk.macros.replaceAttr(item.system.formula + "+" +degat2ndpart, actor)
  } else {
    var att_arme = game.naheulbeuk.macros.replaceAttr("@att+" + item.system.attaque, actor)
    var deg_arme = game.naheulbeuk.macros.replaceAttr(item.system.formula +"+@degat-contact", actor)
  }
  
  //on récupère la valeur d'esquive de la cible
  var cible_esq = parseInt(game.naheulbeuk.macros.replaceAttr("@esq", cible));
  //on récupère la valeur de parade de la cible
  var cible_prd = parseInt(game.naheulbeuk.macros.replaceAttr("@prd", cible));


  //on fait une nouvelle interface
  //prise en compte de la position et autres bonus/malus
  var txt = `
  <div>
    <label style="font-size: 15px;">Positionnement :</label>
    <input type="radio" id="face" name="pos" value=0 checked>&nbsp;Face
    <input type="radio" id="flc" name="pos" value=2>&nbsp;Flanc
    <input type="radio" id="arr" name="pos" value=5>&nbsp;Arrière
  </div>
  <div style="padding-top: 8px;"></div>
  <div style="display:flex;">
    <label style="font-size: 15px;flex: 1">Bonus/Malus : <output id="value"></output></label>
    <input id="pi_input" name="inputSeuil" type="range" min="-10" max="10" step="1" style="font-size: 15px;flex:1.9"/>
    <label style="flex:0.9"></label>
  </div>
  <em>+1/allié en soutien, -1/ennemi en soutien, -5 pour la 2ème attaque d'ambidextrie</em><br/>
  <em>+3 attaquant Puissant+, +6 Puissant++, +6 Puissant+++ et parade impossible</em>
  <script>
    document.querySelector("#value").textContent = document.querySelector("#pi_input").value
    document.querySelector("#pi_input").addEventListener("input", (event) => {
      document.querySelector("#value").textContent = event.target.value
    })
  </script>
  `;
  //sélection de la parade ou l'esquive
  txt += `
  <hr>
  <label style="font-size: 15px;">Que fait la cible ?</label>
  <select name="inputDiff2" id="inputDiff2" `

  if (cible.type=="npc" && cible_esq>cible_prd){
    txt+=`>
      <option value="esq">Esquive</option>
      <option value="prd">Parade</option>
      <option value="fat">Ne pas se défendre</option>
    </select>
    <div style="padding-top: 8px;"></div>
    `
  }
  if (cible.type=="npc" && cible_esq<=cible_prd){
    txt+=`>
      <option value="prd">Parade</option>
      <option value="esq">Esquive</option>
      <option value="fat">Ne pas se défendre</option>
    </select>
    <div style="padding-top: 8px;"></div>
    `
  }

  //prise en compte de l'arme de la cible pour la parade si c'est un pj
  let prd_armes = []
  let prd_item = []
  if (cible.type == "character") {
    //pour chaque objet de la cible
    for (let itemF of cible.items) {
        //si l'objet est en mains et a une formule = c'est une arme éligible à l'attaque rapide
        if (itemF.system.equipe == true && itemF.type == "arme") {
          if (itemF.system.prd != "-") {
            if (prd_item.length==0){
              prd_item.push(itemF)
              prd_armes.push(cible_prd + parseInt(itemF.system.prd))
            } else {
              if (itemF.system.prd>prd_item[0].system.prd){
                prd_item.unshift(itemF)
                prd_armes.unshift(cible_prd + parseInt(itemF.system.prd))
              } else {
                prd_item.push(itemF)
                prd_armes.push(cible_prd + parseInt(itemF.system.prd))
              }
            }
          }
        }
    }
    if (cible_esq<=prd_armes[0]){
      txt+=`onchange="show(this)">
        <option value="prd">Parade</option>
        <option value="esq">Esquive</option>
        <option value="fat">Ne pas se défendre</option>
      </select>
      <div style="padding-top: 8px;"></div>
      <div id="amasquer" style="display:none;height:44px"></div>
      <div id="arme_prd">
        <label style="font-size: 15px;">Arme de parade :</label>
        <select name="inputDiff3" id="inputDiff3">
      `
    } else {
      txt+=`onchange="show(this)">
      <option value="esq">Esquive</option>
      <option value="prd">Parade</option>
      <option value="fat">Ne pas se défendre</option>
    </select>
    <div style="padding-top: 8px;"></div>
    <div id="amasquer" style="display:block;height:44px"></div>
    <div id="arme_prd" style="display:none">
        <label style="font-size: 15px;">Arme de parade :</label>
        <select name="inputDiff3" id="inputDiff3">
    `
    }

    //ajout au menu déroulant
    for (var i = 0; i < prd_armes.length; i++) {
        txt += '<option value="' + i + '">' + prd_item[i].name + '</option>'
    }
    txt += `</select>
    <br/><br/>
    </div>
    <script>
      function show(prd_esq) {
        if (prd_esq.value != "prd") {
          document.getElementById('arme_prd').style.display = 'none';
          document.getElementById('amasquer').style.display = 'block';
        } else {
          document.getElementById('arme_prd').style.display = 'block';
          document.getElementById('amasquer').style.display = 'none';
        } 
      }
    </script>`;
  }

  let buttons = {};
  buttons.one= {
    label: "Attaque",
    callback: (html) => {
      var attaque = att_arme

      //Calcul de valeur de la defense
      var def
      var prd_esq = html.find('select[name="inputDiff2"').val();
      if (prd_esq == "prd") {
        //si pj prise en compte des bonus/malus de l'objet en main
        if (cible.type == "character") {
            //la cible n'a pas d'arme avec laquelle parer
            if (prd_armes.length == 0) {
                def = 1;
            } else {
                var index_prd = parseInt(html.find('select[name="inputDiff3"').val());
                def = prd_armes[index_prd];
            }
        } else {
            def = cible_prd;
        }
        var textdef = " tente une parade.";
      }
      if (prd_esq == "esq") {
          def = cible_esq;
          var textdef = " tente une esquive.";
      }
      if (prd_esq == "fat") {
          def = 1;
          var textdef = " ne se défend pas.";
      }
      if (def <= 0) {
        def = 1;
      }
      if (def > 22) {
          def = 22;
      }

      //Bonus Malus position
      var mod_pos = parseInt(html.find('input[name="pos"]:checked').val());

      //bonus/malus potentiel sur l'attaque
      var mod_seuil = parseInt(html.find('input[name="inputSeuil"').val())

      //on initie la tableau de seuil
      const table = [['PR-AT', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
      [1, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      [2, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      [3, 1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 18, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      [4, 1, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 18, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20],
      [5, 1, 1, 2, 4, 5, 7, 9, 11, 13, 15, 17, 18, 18, 19, 19, 20, 20, 20, 20, 20, 20, 20],
      [6, 1, 1, 1, 3, 5, 6, 8, 10, 12, 14, 16, 17, 18, 18, 19, 19, 20, 20, 20, 20, 20, 20],
      [7, 1, 1, 1, 3, 4, 6, 7, 9, 11, 13, 15, 17, 17, 18, 18, 19, 19, 20, 20, 20, 20, 20],
      [8, 1, 1, 1, 2, 4, 5, 7, 8, 10, 12, 14, 16, 17, 17, 18, 18, 19, 19, 20, 20, 20, 20],
      [9, 1, 1, 1, 2, 3, 5, 7, 8, 9, 11, 13, 15, 15, 17, 17, 18, 18, 19, 19, 20, 20, 20],
      [10, 1, 1, 1, 1, 3, 4, 6, 8, 8, 10, 12, 14, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20],
      [11, 1, 1, 1, 1, 2, 4, 6, 7, 8, 9, 11, 13, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20],
      [12, 1, 1, 1, 1, 2, 3, 5, 7, 7, 9, 11, 11, 13, 14, 15, 15, 16, 16, 17, 17, 18, 18],
      [13, 1, 1, 1, 1, 1, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 15, 16, 16, 17, 17, 18],
      [14, 1, 1, 1, 1, 1, 2, 4, 6, 6, 8, 10, 10, 12, 12, 13, 14, 14, 15, 15, 16, 16, 17],
      [15, 1, 1, 1, 1, 1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 14, 15, 15, 16, 16, 17],
      [16, 1, 1, 1, 1, 1, 1, 3, 5, 5, 7, 9, 9, 10, 11, 13, 13, 14, 14, 15, 15, 16, 16],
      [17, 1, 1, 1, 1, 1, 1, 3, 4, 5, 6, 8, 8, 9, 10, 12, 13, 14, 14, 15, 15, 16, 16],
      [18, 1, 1, 1, 1, 1, 1, 2, 4, 4, 6, 8, 8, 9, 10, 11, 12, 14, 14, 15, 15, 16, 16],
      [19, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 7, 7, 8, 9, 11, 11, 13, 14, 15, 15, 16, 16],
      [20, 1, 1, 1, 1, 1, 1, 1, 3, 3, 5, 6, 7, 7, 8, 10, 11, 12, 13, 15, 15, 16, 16],
      [21, 1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17],
      [22, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 16, 17]];
      //on calcule le seuil avec les bonus/malus éventuel
      var eval_seuil = parseInt(attaque) + mod_pos + mod_seuil;
      if (eval_seuil > 22) {
          eval_seuil = 22;
      }
      if (eval_seuil < 1) {
          eval_seuil = 1;
      }
      var seuil = table[def][eval_seuil];

      //On prépare le lancer de dés d'attaque
      let dataset={}
      dataset.name = source.name+" attaque avec "+item.name+".";
      dataset.name2 = cible.name+textdef
      dataset.dice = "d20";
      dataset.diff = seuil.toString();
      game.naheulbeuk.macros.onRoll(actor, item, dataset, item.name).then(r=>{
        //Si ça réussie on lance les dés de dégâts
        if (r._total<=seuil){
          dataset={}
          dataset.name = "Dégâts "+ item.name;
          dataset.dice = deg_arme;
          dataset.diff = "";
          game.naheulbeuk.macros.onRoll(actor, item, dataset, item.name)
        }
      })
    }
  }

  let d = new Dialog({
    title: "Attaque avec "+item.name,
    content: txt,
    buttons: buttons
  },{width: 500});
  d.render(true);
}