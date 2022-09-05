import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
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

export class NaheulbeukActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["naheulbeuk", "sheet", "actor"],
      template: "systems/naheulbeuk/templates/actor/actor-sheet.html",
      width: 750,
      height: 750,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "carac" }, { navSelector: ".sheet-tabs-spell", contentSelector: ".sheet-body-spell", initial: "magie" }]
    });
  }

  /** @override */
  get template() {
    return `systems/naheulbeuk/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.data.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context, this.actor);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      this._prepareCharacterData(context, this.actor);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context, actor) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.data.abilities)) {
      v.label = game.i18n.localize(CONFIG.NAHEULBEUK.abilities[k]) ?? k;
    }
    //PCH maj actor (PJ)
    if (actor.data.type == "character") {
      const actorData = {
        "data.attributes.level.value": this._level(),
        "data.attributes.rm.value": this._rm(),
        "data.attributes.esq.value": this._esq(),
        "data.attributes.mphy.value": this._mphy(),
        "data.attributes.mpsy.value": this._mpsy()
      };
      actor.update(actorData);
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const trucs = [];
    const armes = [];
    const armures = [];
    const sacs = [];
    const skillsNonchoisis = [];
    const skillsChoisis = [];
    const skillsGagnes = [];
    const skillsBases = [];
    const metiers = [];
    const origines = [];
    const spells = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
      10: [],
      11: [],
      12: [],
      13: [],
      14: [],
      15: []
    };
    const etats = [];
    var poid = 0;
    var charge = 0;
    var compteurMetier = 0;
    var compteurOrigine = 0;
    var flagTrucDeMauviette = 0;
    var flagTirerCorrectement = 1;
    var attaques = [];
    var traits = [];
    var regions = [];
    var coups = [];
    var apes = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to trucs.
      if (i.type === 'truc') {
        trucs.push(i);
        if (i.data.ignorePoidSac != true) { poid = poid + i.data.weight * i.data.quantity * 100 }
        charge = charge + i.data.weight * i.data.quantity
      }
      // Append to armes --> si pas équipée, on la considère comme un truc
      else if (i.type === 'arme') {
        if (i.data.equipe == true) { armes.push(i) }
        else {
          trucs.push(i);
          if (i.data.ignorePoidSac != true) { poid = poid + i.data.weight * i.data.quantity * 100 }
        };
        charge = charge + i.data.weight * i.data.quantity
      }
      // Append to armures --> si pas équipée, on la considère comme un truc
      else if (i.type === 'armure') {
        if (i.data.equipe == true) { armures.push(i) }
        else {
          trucs.push(i);
          if (i.data.ignorePoidSac != true) { poid = poid + i.data.weight * i.data.quantity * 100 }
        };
        charge = charge + i.data.weight * i.data.quantity
      }
      // Append to sacs --> si pas équipé, on la considère comme un truc
      else if (i.type === 'sac') {
        if (i.data.equipe == true) { sacs.push(i) }
        else {
          trucs.push(i);
          if (i.data.ignorePoidSac != true) { poid = poid + i.data.weight * i.data.quantity * 100 }
        };
        charge = charge + i.data.weight * i.data.quantity
      }
      // Append to skills  --> on définit si le skill est appris ou hérité
      else if (i.type === 'competence') {
        if (i.data.gagne == true) { skillsGagnes.push(i) }
        else if (i.data.choix == true) { skillsChoisis.push(i) }
        else if (i.data.base == true) { skillsBases.push(i) }
        else { skillsNonchoisis.push(i) };
        //PCH maj actor TRUC DE MAUVIETTE
        if (i.name == "TRUC DE MAUVIETTE") { flagTrucDeMauviette = 1 }
        if (i.name == "TIRER CORRECTEMENT") { flagTirerCorrectement = 0 }
      }
      // Append to metier.
      else if (i.type === 'metier') {
        compteurMetier++
        if (compteurMetier == 1) {
          metiers.push(i);
          this.actor.update({ "data.attributes.magie.value": i.data.magie })
        } else {
          ui.notifications.error("Vous avez déjà un métier !");
          let item = this.actor.items.get(i._id)
          item.delete();
        }
      }
      // Append to origine.
      else if (i.type === 'origine') {
        compteurOrigine++
        if (compteurOrigine == 1) {
          origines.push(i);
        } else {
          ui.notifications.error("Vous avez déjà une origine !");
          let item = this.actor.items.get(i._id)
          item.delete();
        }
      }
      // Append to spells.
      else if (i.type === 'sort') {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i);
        }
      }
      // Append to etats.
      else if (i.type === 'etat') {
        etats.push(i);
      }
      else if (i.type === 'attaque') {
        attaques.push(i);
      }
      else if (i.type === 'trait') {
        traits.push(i);
      }
      else if (i.type === 'region') {
        regions.push(i);
      }
      else if (i.type === 'coup') {
        coups.push(i);
      }
      else if (i.type === 'ape') {
        apes.push(i);
      }
      else if (i.type === 'gemme') {
        trucs.push(i);
        if (i.data.ignorePoidSac != true) { poid = poid + i.data.weight * i.data.quantity * 100 }
        charge = charge + i.data.weight * i.data.quantity
      }
    }

    //update PR truc de mauviette et bonus tirer correctement pour les PJ
    if (this.actor.data.type == "character") {
      const actorData = {
        "data.attributes.pr.trucdemauviette": flagTrucDeMauviette,
        "data.attributes.lancerarme.value": flagTirerCorrectement * (-5)
      };
      this.actor.update(actorData);
    }

    // Assign and return
    context.trucs = trucs;
    context.armes = armes;
    context.armures = armures;
    context.sacs = sacs;
    context.skillsChoisis = skillsChoisis;
    context.skillsNonchoisis = skillsNonchoisis;
    context.skillsGagnes = skillsGagnes;
    context.skillsBases = skillsBases;
    context.metiers = metiers;
    context.origines = origines;
    context.spells = spells;
    context.coups = coups;
    context.etats = etats;
    context.poid = poid / 100;
    if (this.actor.data.type == "character") {
      context.charge = (charge * 100 + this.actor.data.data.attributes.pa.value + this.actor.data.data.attributes.po.value + this.actor.data.data.attributes.lb.value * 5 + this.actor.data.data.attributes.lt.value * 3) / 100;
    }
    context.attaques = attaques;
    context.traits = traits;
    context.regions = regions;
    context.apes = apes;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    //PCH - sur tag item-equipe, on équipe l'objet
    html.find('.item-equipe').click(ev => this._onItemEquipe(ev, this.actor));

    //PCH - sur tag item-equipe, on équipe l'objet
    html.find('.item-en-main').click(ev => this._onArmeEnMains(ev, this.actor));

    //PCH afficher ou masquer le champs (oeil carac)
    html.find('.hide').click(ev => {
      if (document.getElementById("hide").style.display == "none") {
        document.getElementById("hide").style.display = "block"
      } else {
        document.getElementById("hide").style.display = "none"
      }
    });

    //PCH hide catégorie d'inventaire
    html.find('.hidelivres').click(ev => {
      const actorData = {
        "data.attributes.hidelivres": !this.actor.data.data.attributes.hidelivres
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hidefioles').click(ev => {
      const actorData = {
        "data.attributes.hidefioles": !this.actor.data.data.attributes.hidefioles
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hideingredients').click(ev => {
      const actorData = {
        "data.attributes.hideingredients": !this.actor.data.data.attributes.hideingredients
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hidearmes').click(ev => {
      const actorData = {
        "data.attributes.hidearmes": !this.actor.data.data.attributes.hidearmes
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hideprotections').click(ev => {
      const actorData = {
        "data.attributes.hideprotections": !this.actor.data.data.attributes.hideprotections
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hidenourritures').click(ev => {
      const actorData = {
        "data.attributes.hidenourritures": !this.actor.data.data.attributes.hidenourritures
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hiderichesses').click(ev => {
      const actorData = {
        "data.attributes.hiderichesses": !this.actor.data.data.attributes.hiderichesses
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hideperso').click(ev => {
      const actorData = {
        "data.attributes.hideperso": !this.actor.data.data.attributes.hideperso
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hidespeciaux').click(ev => {
      const actorData = {
        "data.attributes.hidespeciaux": !this.actor.data.data.attributes.hidespeciaux
      };
      this.actor.update(actorData);
    });

    //PCH afficher ou masquer les sorts
    html.find('.hideSort').click(ev => {
      const lvl = ev.currentTarget.dataset.lvl
      const tab = ev.currentTarget.dataset.tab
      if (document.getElementById("hideSort" + lvl + tab).style.display == "none") {
        document.getElementById("hideSort" + lvl + tab).style.display = "block"
      } else {
        document.getElementById("hideSort" + lvl + tab).style.display = "none"
      }
    });


    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      //PCH enlever effet et déséquiper avant edition --> plus utile car readonly si equipe
      //if (item.data.data.equipe==true){
      //this._onItemEquipe(ev,this.actor);
      //};
      item.sheet.render(true);
    });

    html.find('.compendium-pack').click(ev => {
      const element = ev.currentTarget;
      const dataset = element.dataset;
      var packC = dataset.pack;
      game.packs.find(p => p.metadata.name === packC).render(true)
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      //PCH enlever effets avant suppression
      if (item.data.data.equipe == true) {
        this._onItemEquipe(ev, this.actor, context).then((value) => {
          item.delete();;
        });
      } else { item.delete() }
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    //PCH rajout d'un roll custom avec plus d'options, et d'un roll avec fenêtre pour les inputs
    html.find('.rollable2').click(this._onRollCustom.bind(this));
    html.find('.rollable3').click(this._onRollCustomBis.bind(this));
    html.find('.rollable4').click(this._onRollCustomSpell.bind(this));

    //PCH détail de l'armure
    html.find('.armuredetail').click(this._armuredetail.bind(this));

    //PCH diminuer quantité d'objet
    html.find('.item-quantity').click(this._quantity.bind(this));

    //PCH more stats NPC
    html.find('.moreStats').click(ev => {
      const actorData = {
        "data.attributes.moreStats": !this.actor.data.data.attributes.moreStats
      };
      this.actor.update(actorData);
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[Caractéristique] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  // -------------------- PCH -------------------------------------

  //PCH - equipe un objet et applique les bonus / malus
  async _onItemEquipe(ev, actor) {
    ev.preventDefault();
    //on récupère l'objet
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    //avant d'équiper un sac, on vérifie s'il n'y en pas déjà un équipé
    if (item.data.type == "sac" && item.data.data.equipe == false) {
      for (let i of super.getData().items) {
        if (i.type === 'sac') {
          if (i.data.equipe == true && i.data.type == item.data.data.type) {
            ui.notifications.error("Ce type de sac est déjà équipé !");
            return
          }
        }
      }
    }
    //si l'objet n'est pas équipé 
    if (item.data.data.equipe == false) {
      var cou = Number(actor.data.data.abilities.cou.bonus) + Number(item.data.data.cou);
      var int = Number(actor.data.data.abilities.int.bonus) + Number(item.data.data.int);
      var cha = Number(actor.data.data.abilities.cha.bonus) + Number(item.data.data.cha);
      var ad = Number(actor.data.data.abilities.ad.bonus) + Number(item.data.data.ad);
      var fo = Number(actor.data.data.abilities.fo.bonus) + Number(item.data.data.fo);
      var att = Number(actor.data.data.abilities.att.bonus) + Number(item.data.data.att);
      var prd = Number(actor.data.data.abilities.prd.bonus) + Number(item.data.data.prd);
      var pr = Number(actor.data.data.attributes.pr.bonus) + Number(item.data.data.pr);
      var prm = Number(actor.data.data.attributes.prm.bonus) + Number(item.data.data.prm);
      var rm = Number(actor.data.data.attributes.rm.bonus) + Number(item.data.data.rm);
      var mvt = Number(actor.data.data.attributes.mvt.value) + Number(item.data.data.mvt);
      //on construit les datas
      var actorData = {};
      if (item.type != "arme") { //pour autre chose qu'une arme
        actorData = {
          "data.abilities.cou.bonus": cou,
          "data.abilities.int.bonus": int,
          "data.abilities.cha.bonus": cha,
          "data.abilities.ad.bonus": ad,
          "data.abilities.fo.bonus": fo,
          "data.abilities.att.bonus": att,
          "data.abilities.prd.bonus": prd,
          "data.attributes.pr.bonus": pr,
          "data.attributes.prm.bonus": prm,
          "data.attributes.mvt.value": mvt,
          "data.attributes.rm.bonus": rm
        };
      }
      if (item.type == "arme") { //Si c'est une arme on n'applique pas les bonus liés à la prise en mains
        actorData = {
          "data.abilities.cou.bonus": cou,
          "data.abilities.int.bonus": int,
          "data.abilities.cha.bonus": cha,
          "data.abilities.ad.bonus": ad,
          "data.abilities.fo.bonus": fo
        };
      }
      await item.update({ "data.equipe": true }); //update de l'objet pour le passer en équipé
      await actor.update(actorData);//update de l'acteur pour modifier les stats
      //ajout d'un bout spécifique pour gérer les formules custom
      //ATTENTION PEUT ËTRE A REVOIR
      if (item.data.data.custom != "") {
        const customS = item.data.data.custom.split(";")
        customS.forEach(e => {
          const custom = e.split("=")
          var variable = custom[0]
          var customvaleur = Number(eval(game.naheulbeuk.macros.replaceAttr(custom[1], actor)))
          const valeur = Number(eval("actor.data." + variable)) + customvaleur
          actor.update({ [variable]: valeur });
        })
      }
    } else { //même chose mais en retirant le bonus
      var cou = Number(actor.data.data.abilities.cou.bonus) - Number(item.data.data.cou);
      var int = Number(actor.data.data.abilities.int.bonus) - Number(item.data.data.int);
      var cha = Number(actor.data.data.abilities.cha.bonus) - Number(item.data.data.cha);
      var ad = Number(actor.data.data.abilities.ad.bonus) - Number(item.data.data.ad);
      var fo = Number(actor.data.data.abilities.fo.bonus) - Number(item.data.data.fo);
      var att = Number(actor.data.data.abilities.att.bonus) - Number(item.data.data.att);
      var prd = Number(actor.data.data.abilities.prd.bonus) - Number(item.data.data.prd);
      var pr = Number(actor.data.data.attributes.pr.bonus) - Number(item.data.data.pr);
      var prm = Number(actor.data.data.attributes.prm.bonus) - Number(item.data.data.prm);
      var rm = Number(actor.data.data.attributes.rm.bonus) - Number(item.data.data.rm);
      var mvt = Number(actor.data.data.attributes.mvt.value) - Number(item.data.data.mvt);
      var actorData = {};
      if (item.type != "arme") {
        actorData = {
          "data.abilities.cou.bonus": cou,
          "data.abilities.int.bonus": int,
          "data.abilities.cha.bonus": cha,
          "data.abilities.ad.bonus": ad,
          "data.abilities.fo.bonus": fo,
          "data.abilities.att.bonus": att,
          "data.abilities.prd.bonus": prd,
          "data.attributes.pr.bonus": pr,
          "data.attributes.prm.bonus": prm,
          "data.attributes.mvt.value": mvt,
          "data.attributes.rm.bonus": rm
        };
      }
      if (item.type == "arme") {
        actorData = {
          "data.abilities.cou.bonus": cou,
          "data.abilities.int.bonus": int,
          "data.abilities.cha.bonus": cha,
          "data.abilities.ad.bonus": ad,
          "data.abilities.fo.bonus": fo
        };
      }
      if (item.type == "arme" && item.data.data.enmain == true) { await this._onArmeEnMains(ev, actor) };
      await item.update({ "data.equipe": false }); //update de l'objet pour le passer en équipé
      await actor.update(actorData);
      //ajout d'un bout spécifique pour gérer les formules custom
      //ATTENTION PEUT ËTRE PAS BON
      if (item.data.data.custom != "") {
        const customS = item.data.data.custom.split(";")
        customS.forEach(e => {
          const custom = e.split("=")
          var variable = custom[0]
          var customvaleur = Number(eval(game.naheulbeuk.macros.replaceAttr(custom[1], actor)))
          const valeur = Number(eval("actor.data." + variable)) - customvaleur
          actor.update({ [variable]: valeur });
        })
      }
    };
  }

  //PCH - application des bonus/malus quand on prend l'arme en mains
  async _onArmeEnMains(ev, actor) {
    ev.preventDefault();
    //on récupère l'objet
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    //si l'objet n'est pas en mains
    if (item.data.data.enmain == false) {
      //on calcule les nouvelles stats en rajoutant les bonus

      //cas particulier de l'attaque baissé quand on a un bouclier
      if (item.data.data.prd != "-" && (item.data.data.formula == "" || item.data.data.formula == "-")) {
        var att = Number(actor.data.data.abilities.att.bonus) + Number(item.data.data.att);
      } else {
        var att = Number(actor.data.data.abilities.att.bonus);
      }

      const prd = Number(actor.data.data.abilities.prd.bonus) + Number(item.data.data.prd);
      const pr = Number(actor.data.data.attributes.pr.bonus) + Number(item.data.data.pr);
      const prm = Number(actor.data.data.attributes.prm.bonus) + Number(item.data.data.prm);
      const rm = Number(actor.data.data.attributes.rm.bonus) + Number(item.data.data.rm);
      const mvt = Number(actor.data.data.attributes.mvt.value) + Number(item.data.data.mvt);
      var lancer = Number(actor.data.data.attributes.lancerarme.bonus)
      if (item.data.data.lancerarme != "-") { lancer = lancer + Number(item.data.data.lancerarme) }
      if (actor.data.data.attributes.lancerarme.degat == 0) {
        var lancerdegat = ""
      } else {
        var lancerdegat = actor.data.data.attributes.lancerarme.degat
      }
      if (item.data.data.lancerarmedegat != "-" && item.data.data.lancerarmedegat != "0") {
        if (item.data.data.lancerarmedegat.substr(0, 1) == "-" || item.data.data.lancerarmedegat.substr(0, 1) == "+") {
          lancerdegat = lancerdegat + " " + item.data.data.lancerarmedegat + " "
        } else {
          lancerdegat = lancerdegat + " +" + item.data.data.lancerarmedegat + " "
        }
      }
      //on construit les datas
      const actorData = {
        "data.abilities.att.bonus": att,
        //"data.abilities.prd.bonus": prd,
        "data.attributes.pr.bonus": pr,
        "data.attributes.prm.bonus": prm,
        "data.attributes.lancerarme.bonus": lancer,
        "data.attributes.lancerarme.degat": lancerdegat,
        "data.attributes.mvt.value": mvt,
        "data.attributes.rm.bonus": rm
      };
      await item.update({ "data.enmain": true }); //update de l'objet pour le passer en équipé
      await actor.update(actorData);//update de l'acteur pour modifier les stats
      return
    } else if (item.data.data.enmain == true) { //même chose mais en retirant le bonus
      //cas particulier de l'attaque baissé quand on a un bouclier
      if (item.data.data.prd != "-" && (item.data.data.formula == "" || item.data.data.formula == "-")) {
        var att = Number(actor.data.data.abilities.att.bonus) - Number(item.data.data.att);
      } else {
        var att = Number(actor.data.data.abilities.att.bonus);
      }
      const prd = Number(actor.data.data.abilities.prd.bonus) - Number(item.data.data.prd);
      const pr = Number(actor.data.data.attributes.pr.bonus) - Number(item.data.data.pr);
      const prm = Number(actor.data.data.attributes.prm.bonus) - Number(item.data.data.prm);
      const rm = Number(actor.data.data.attributes.rm.bonus) - Number(item.data.data.rm);
      const mvt = Number(actor.data.data.attributes.mvt.value) - Number(item.data.data.mvt);
      var lancer = Number(actor.data.data.attributes.lancerarme.bonus)
      if (item.data.data.lancerarme != "-") { lancer = lancer - Number(item.data.data.lancerarme) }
      var lancerdegat = actor.data.data.attributes.lancerarme.degat
      if (item.data.data.lancerarmedegat != "-") {
        if (item.data.data.lancerarmedegat.substr(0, 1) == "-" || item.data.data.lancerarmedegat.substr(0, 1) == "+") {
          var replacedegat = " " + item.data.data.lancerarmedegat + " ";
          lancerdegat = actor.data.data.attributes.lancerarme.degat.replace(replacedegat, "")
        } else {
          var replacedegat = " +" + item.data.data.lancerarmedegat + " ";
          lancerdegat = actor.data.data.attributes.lancerarme.degat.replace(replacedegat, "")
        }
      }
      const actorData = {
        "data.abilities.att.bonus": att,
        //"data.abilities.prd.bonus": prd,
        "data.attributes.pr.bonus": pr,
        "data.attributes.prm.bonus": prm,
        "data.attributes.lancerarme.bonus": lancer,
        "data.attributes.lancerarme.degat": lancerdegat,
        "data.attributes.mvt.value": mvt,
        "data.attributes.rm.bonus": rm
      };
      await item.update({ "data.enmain": false }); //update de l'objet pour le passer en équipé
      await actor.update(actorData);
      return
    };
  }

  //PCH roll custom avec label et description
  async _onRollCustom(event) {
    event.preventDefault();
    //récupération des données du html
    const element = event.currentTarget;
    const dataset = element.dataset;
    const desc = dataset.desc;
    var dice = dataset.dice;
    const name = dataset.name;
    var diff = dataset.diff;
    if (dice.substr(0, 8) == "épreuve:") { //lancement d'épreuve quand il y'a juste jet de dés
      diff = dice;
      dice = "d20";
    }
    //récupération de l'objet si besoin
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    //ajout du bonus de dégâts fo>12 si c'est une arme
    if (item) {
      if (item.data.type == "arme" && (this.actor.data.data.abilities.fo.value + this.actor.data.data.abilities.fo.bonus) > 12 && (name.substr(0, 5) == "Dégat" || name.substr(0, 5) == "Dégât")) {
        dice = dice + "+" + Math.max(0, (this.actor.data.data.abilities.fo.value + this.actor.data.data.abilities.fo.bonus) - 12)
      };
      if (item.data.type == "arme" && (this.actor.data.data.abilities.fo.value + this.actor.data.data.abilities.fo.bonus) < 9 && (name.substr(0, 5) == "Dégat" || name.substr(0, 5) == "Dégât")) {
        dice = dice + "-1"
      };
      if (item.data.type == "arme" && item.data.data.lancerarme != "-" && this.actor.data.data.attributes.lancerarme.degat != 0 && (name.substr(0, 5) == "Dégat" || name.substr(0, 5) == "Dégât")) {
        dice = dice + this.actor.data.data.attributes.lancerarme.degat
      };
    };
    //dice=game.naheulbeuk.macros.replaceAttr(dice,this.actor);
    //diff=game.naheulbeuk.macros.replaceAttr(diff,this.actor);
    //replace avec la gestion des replaces de cibles
    if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
      if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
    }
    if (dice.substr(0, 6) == "cible:") {
      dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
    } else {
      dice = game.naheulbeuk.macros.replaceAttr(dice, this.actor);
    }
    if (diff.substr(0, 6) == "cible:") {
      diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
    } else {
      diff = game.naheulbeuk.macros.replaceAttr(diff, this.actor);
    }
    //def du format de message dans le chat
    const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
    if (dice != "") {
      //on initialise les variables
      let r = new Roll(dice);
      await r.roll({ "async": true });
      var tplData = {};
      var reussite = "Réussite !   ";
      //si on n'a pas la difficulté
      if (diff == "") {
        tplData = {
          diff: "",
          name: name,
          hasDescription: desc && desc.length > 0,
          desc: desc
        };
        //création du message
        renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
          r.toMessage({
            user: game.user.id,
            flavor: msgFlavor,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
          });
        });
      } else { //si on a la difficulté
        diff = new Roll(diff);
        diff.roll({ "async": true }).then(diff => {
          //calcule de la réussite ou l'échec suivant si on est sur un jet de rupture ou non
          if (r.total > diff.total && name != "Rupture") { reussite = "Echec !   " };
          if (r.total <= diff.total && name == "Rupture") { reussite = "Echec !   " };
          tplData = {
            diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + Math.abs(diff.total - r.total),
            name: name,
            hasDescription: desc && desc.length > 0,
            desc: desc
          };
          //création du message
          renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
            r.toMessage({
              user: game.user.id,
              flavor: msgFlavor,
              speaker: ChatMessage.getSpeaker({ actor: this.actor })
            });
          });
        });
      }
    }
  }

  //PCH roll custom avec formulaire  
  async _onRollCustomBis(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;
    var dice = dataset.dice;
    var name = dataset.name;
    var diff = dataset.diff;
    if (dice.substr(0, 8) == "épreuve:") { //lancement d'épreuve quand il y'a juste jet de dés
      diff = dice;
      dice = "d20";
    }
    //récupération de l'objet si besoin
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    //ajout du bonus de dégâts fo>12 si c'est une arme
    if (item) {
      if (item.data.type == "arme" && (this.actor.data.data.abilities.fo.value + this.actor.data.data.abilities.fo.bonus) > 12 && (name.substr(0, 5) == "Dégat" || name.substr(0, 5) == "Dégât")) {
        dice = dice + "+" + Math.max(0, (this.actor.data.data.abilities.fo.value + this.actor.data.data.abilities.fo.bonus) - 12)
      };
      if (item.data.type == "arme" && (this.actor.data.data.abilities.fo.value + this.actor.data.data.abilities.fo.bonus) < 9 && (name.substr(0, 5) == "Dégat" || name.substr(0, 5) == "Dégât")) {
        dice = dice + "-1"
      };
      if (item.data.type == "arme" && item.data.data.lancerarme != "-" && this.actor.data.data.attributes.lancerarme.degat != 0 && (name.substr(0, 5) == "Dégat" || name.substr(0, 5) == "Dégât")) {
        dice = dice + this.actor.data.data.attributes.lancerarme.degat
      };
    };

    //replace attributs
    if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
      if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
    }
    if (dice.substr(0, 6) == "cible:") {
      dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
    } else {
      dice = game.naheulbeuk.macros.replaceAttr(dice, this.actor);
    }
    if (diff.substr(0, 6) == "cible:") {
      diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
    } else {
      diff = game.naheulbeuk.macros.replaceAttr(diff, this.actor);
    }
    dice = dice.replace(/ /g, "");
    diff = diff.replace(/ /g, "");

    let d = new Dialog({
      title: name,
      content: `
        <em style="font-size: 15px;">Raccourcis :</em>
        <br/>
        <em style="font-size: 15px;">@cou @int @cha @ad @fo @att @prd @lvl @pr @prm @esq @rm @mphy @mpsy @att-distance @bonusint</em>
        <hr>
        <label style="font-size: 15px;">Formule :</label>
        <input style="font-size: 15px;" type="text" name="inputFormule" value="`+ dice + `">
        <br/><br/>
        <label style="font-size: 15px;">Difficulté :</label>
        <input style="font-size: 15px;" type="text" name="inputDiff" value=`+ diff + `></li>
        <br/><br/>
        `,
      buttons: {
        one: {
          label: "Lancer",
          callback: (html) => {
            let dice = html.find('input[name="inputFormule"').val();
            let diff = html.find('input[name="inputDiff"').val();
            const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
            //dice=game.naheulbeuk.macros.replaceAttr(dice,this.actor);
            //diff=game.naheulbeuk.macros.replaceAttr(diff,this.actor);
            if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
              if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
            }
            if (dice.substr(0, 6) == "cible:") {
              dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
            } else {
              dice = game.naheulbeuk.macros.replaceAttr(dice, this.actor);
            }
            if (diff.substr(0, 6) == "cible:") {
              diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
            } else {
              diff = game.naheulbeuk.macros.replaceAttr(diff, this.actor);
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
                    name: name
                  }
                  renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                    r.toMessage({
                      user: game.user.id,
                      flavor: msgFlavor,
                      speaker: ChatMessage.getSpeaker({ actor: this.actor })
                    });
                  });
                } else {
                  diff = new Roll(diff);
                  diff.roll({ "async": true }).then(diff => {
                    result = Math.abs(diff.total - r.total);
                    if (r.total > diff.total) { reussite = "Echec !   " };
                    tplData = {
                      diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                      name: name
                    };
                    renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                      r.toMessage({
                        user: game.user.id,
                        flavor: msgFlavor,
                        speaker: ChatMessage.getSpeaker({ actor: this.actor })
                      });
                    });
                  });
                };
              });
            }
          }
        }
      }
    });
    d.render(true);
  }

  //PCH roll custom avec formulaire pour les sorts 
  async _onRollCustomSpell(event) {
    const element = event.currentTarget;
    const dataset = element.dataset;
    var dice1 = dataset.dice1;
    var dice2 = dataset.dice2;
    var dice3 = dataset.dice3;
    var dice4 = dataset.dice4;
    var dice5 = dataset.dice5;
    var name1 = dataset.name1;
    var name2 = dataset.name2;
    var name3 = dataset.name3;
    var name4 = dataset.name4;
    var name5 = dataset.name5;
    var diff1 = dataset.diff1;
    var diff2 = dataset.diff2;
    var diff3 = dataset.diff3;
    var diff4 = dataset.diff4;
    var diff5 = dataset.diff5;

    //récupération de l'objet si besoin
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    dice1 = dice1.replace(/ /g, "");
    dice2 = dice2.replace(/ /g, "");
    dice3 = dice3.replace(/ /g, "");
    dice4 = dice4.replace(/ /g, "");
    dice5 = dice5.replace(/ /g, "");
    diff1 = diff1.replace(/ /g, "");
    diff2 = diff2.replace(/ /g, "");
    diff3 = diff3.replace(/ /g, "");
    diff4 = diff4.replace(/ /g, "");
    diff5 = diff5.replace(/ /g, "");

    var content = `
    <em style="font-size: 15px;">Raccourcis :</em>
    <br/>
    <em style="font-size: 15px;">@cou @int @cha @ad @fo @att @prd @lvl @pr @prm @esq @rm @mphy @mpsy @att-distance @bonusint</em>
    <hr>
    `
    if (name1 != "") {
      content = content + `
      <label style="font-size: 15px;"1>Formule `+ name1 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputFormule1" value="`+ dice1 + `">
      <label style="font-size: 15px;"1>Difficulté `+ name1 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputDiff1" value=`+ diff1 + `></li>
      <br/><br/>
      `
    }
    if (name2 != "") {
      content = content + `
      <label style="font-size: 15px;"1>Formule `+ name2 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputFormule2" value="`+ dice2 + `">
      <label style="font-size: 15px;"1>Difficulté `+ name2 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputDiff2" value=`+ diff2 + `></li>
      <br/><br/>
      `
    }
    if (name3 != "") {
      content = content + `
      <label style="font-size: 15px;"1>Formule `+ name3 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputFormule3" value="`+ dice3 + `">
      <label style="font-size: 15px;"1>Difficulté `+ name3 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputDiff3" value=`+ diff3 + `></li>
      <br/><br/>
      `
    }
    if (name4 != "") {
      content = content + `
      <label style="font-size: 15px;"1>Formule `+ name4 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputFormule4" value="`+ dice4 + `">
      <label style="font-size: 15px;"1>Difficulté `+ name4 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputDiff4" value=`+ diff4 + `></li>
      <br/><br/>
      `
    }
    if (name5 != "") {
      content = content + `
      <label style="font-size: 15px;"1>Formule `+ name5 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputFormule5" value="`+ dice5 + `">
      <label style="font-size: 15px;"1>Difficulté `+ name5 + ` :</label>
      <input style="font-size: 15px;" type="text" name="inputDiff5" value=`+ diff5 + `></li>
      <br/><br/>
      `
    }
    var buttons = []
    var one = {
      label: name1,
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
          dice = game.naheulbeuk.macros.replaceAttr(dice, this.actor);
        }
        if (diff.substr(0, 6) == "cible:") {
          diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          diff = game.naheulbeuk.macros.replaceAttr(diff, this.actor);
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
                name: name1 + " - " + item.name
              }
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: this.actor })
                });
              });
            } else {
              diff = new Roll(diff);
              diff.roll({ "async": true }).then(diff => {
                result = Math.abs(diff.total - r.total);
                if (r.total > diff.total) { reussite = "Echec !   " };
                tplData = {
                  diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                  name: name1 + " - " + item.name
                };
                renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                  r.toMessage({
                    user: game.user.id,
                    flavor: msgFlavor,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor })
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
      label: name2,
      callback: (html) => {
        let dice = html.find('input[name="inputFormule2"').val();
        let diff = html.find('input[name="inputDiff2"').val();
        const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
        //dice=game.naheulbeuk.macros.replaceAttr(dice,this.actor);
        //diff=game.naheulbeuk.macros.replaceAttr(diff,this.actor);
        if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
          if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
        }
        if (dice.substr(0, 6) == "cible:") {
          dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          dice = game.naheulbeuk.macros.replaceAttr(dice, this.actor);
        }
        if (diff.substr(0, 6) == "cible:") {
          diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          diff = game.naheulbeuk.macros.replaceAttr(diff, this.actor);
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
                name: name2 + " - " + item.name
              }
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: this.actor })
                });
              });
            } else {
              diff = new Roll(diff);
              diff.roll({ "async": true }).then(diff => {
                result = Math.abs(diff.total - r.total);
                if (r.total > diff.total) { reussite = "Echec !   " };
                tplData = {
                  diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                  name: name2 + " - " + item.name
                };
                renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                  r.toMessage({
                    user: game.user.id,
                    flavor: msgFlavor,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor })
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
      label: name3,
      callback: (html) => {
        let dice = html.find('input[name="inputFormule3"').val();
        let diff = html.find('input[name="inputDiff3"').val();
        const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
        //dice=game.naheulbeuk.macros.replaceAttr(dice,this.actor);
        //diff=game.naheulbeuk.macros.replaceAttr(diff,this.actor);
        if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
          if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
        }
        if (dice.substr(0, 6) == "cible:") {
          dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          dice = game.naheulbeuk.macros.replaceAttr(dice, this.actor);
        }
        if (diff.substr(0, 6) == "cible:") {
          diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          diff = game.naheulbeuk.macros.replaceAttr(diff, this.actor);
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
                name: name3 + " - " + item.name
              }
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: this.actor })
                });
              });
            } else {
              diff = new Roll(diff);
              diff.roll({ "async": true }).then(diff => {
                result = Math.abs(diff.total - r.total);
                if (r.total > diff.total) { reussite = "Echec !   " };
                tplData = {
                  diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                  name: name3 + " - " + item.name
                };
                renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                  r.toMessage({
                    user: game.user.id,
                    flavor: msgFlavor,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor })
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
      label: name4,
      callback: (html) => {
        let dice = html.find('input[name="inputFormule4"').val();
        let diff = html.find('input[name="inputDiff4"').val();
        const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
        //dice=game.naheulbeuk.macros.replaceAttr(dice,this.actor);
        //diff=game.naheulbeuk.macros.replaceAttr(diff,this.actor);
        if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
          if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
        }
        if (dice.substr(0, 6) == "cible:") {
          dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          dice = game.naheulbeuk.macros.replaceAttr(dice, this.actor);
        }
        if (diff.substr(0, 6) == "cible:") {
          diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          diff = game.naheulbeuk.macros.replaceAttr(diff, this.actor);
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
                name: name4 + " - " + item.name
              }
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: this.actor })
                });
              });
            } else {
              diff = new Roll(diff);
              diff.roll({ "async": true }).then(diff => {
                result = Math.abs(diff.total - r.total);
                if (r.total > diff.total) { reussite = "Echec !   " };
                tplData = {
                  diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                  name: name4 + " - " + item.name
                };
                renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                  r.toMessage({
                    user: game.user.id,
                    flavor: msgFlavor,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor })
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
      label: name5,
      callback: (html) => {
        let dice = html.find('input[name="inputFormule5"').val();
        let diff = html.find('input[name="inputDiff5"').val();
        const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
        //dice=game.naheulbeuk.macros.replaceAttr(dice,this.actor);
        //diff=game.naheulbeuk.macros.replaceAttr(diff,this.actor);
        if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
          if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
        }
        if (dice.substr(0, 6) == "cible:") {
          dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          dice = game.naheulbeuk.macros.replaceAttr(dice, this.actor);
        }
        if (diff.substr(0, 6) == "cible:") {
          diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
        } else {
          diff = game.naheulbeuk.macros.replaceAttr(diff, this.actor);
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
                name: name5 + " - " + item.name
              }
              renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                r.toMessage({
                  user: game.user.id,
                  flavor: msgFlavor,
                  speaker: ChatMessage.getSpeaker({ actor: this.actor })
                });
              });
            } else {
              diff = new Roll(diff);
              diff.roll({ "async": true }).then(diff => {
                result = Math.abs(diff.total - r.total);
                if (r.total > diff.total) { reussite = "Echec !   " };
                tplData = {
                  diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                  name: name4 + " - " + item.name
                };
                renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                  r.toMessage({
                    user: game.user.id,
                    flavor: msgFlavor,
                    speaker: ChatMessage.getSpeaker({ actor: this.actor })
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
    const myDialogOptions = {
      width: 500
    };
    let d = new CustomDialog({
      title: "Avancé",
      content: content,
      buttons: buttons
    }, myDialogOptions);
    d.render(true);
  }

  //PCH - diminue la quantité d'un objet
  async _quantity(ev) {
    ev.preventDefault();
    //on récupère l'objet
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    const quantity = item.data.data.quantity
    //avant d'équiper un sac, on vérifie s'il n'y en pas déjà un équipé
    if (quantity > 0) {
      item.update({ "data.quantity": quantity - 1 });
    }
  }

  //PCH calcule niveau
  _level() {
    var value = this.actor.data.data.attributes.xp.value
    if (value < 100) { return 1 }
    else if (value < 300) { return 2 }
    else if (value < 600) { return 3 }
    else if (value < 1000) { return 4 }
    else if (value < 1500) { return 5 }
    else if (value < 2100) { return 6 }
    else if (value < 2800) { return 7 }
    else if (value < 3600) { return 8 }
    else if (value < 4500) { return 9 }
    else if (value < 5500) { return 10 }
    else if (value < 6600) { return 11 }
    else if (value < 7800) { return 12 }
    else if (value < 9100) { return 13 }
    else if (value < 10500) { return 14 }
    else if (value < 12000) { return 15 }
    else if (value < 13600) { return 16 }
    else if (value < 15300) { return 17 }
    else if (value < 17100) { return 18 }
    else if (value < 19000) { return 19 }
    else if (value < 21000) { return 20 }
    else if (value < 24000) { return 21 }
    else if (value < 29000) { return 22 }
    else if (value < 35000) { return 23 }
    else if (value < 45000) { return 24 }
    else if (value < 60000) { return 25 }
    else { return 26 };
  }

  //PCH calcule résistance magique
  _rm() {
    var value = this.actor.data.data.abilities.cou.value + this.actor.data.data.abilities.cou.bonus;
    value = value + this.actor.data.data.abilities.int.value + this.actor.data.data.abilities.int.bonus;
    value = value + this.actor.data.data.abilities.fo.value + this.actor.data.data.abilities.fo.bonus;
    value = Math.round(value / 3);
    return value;
  }

  //PCH calcule esquive
  _esq() {
    var val1 = this.actor.data.data.abilities.ad.value + this.actor.data.data.abilities.ad.bonus
    var val2 = this.actor.data.data.attributes.pr.value + this.actor.data.data.attributes.pr.bonus
    if (val2 <= 1) {
      val2 = 1;
    } else if (val2 == 2) {
      val2 = 0;
    } else if (val2 <= 4) {
      val2 = -2;
    } else if (val2 == 5) {
      val2 = -4;
    } else if (val2 == 6) {
      val2 = -5;
    } else if (val2 == 7) {
      val2 = -6;
    } else if (val2 > 7) {
      val2 = 0;
      val1 = 0;
    }
    return val1 + val2;
  }

  //PCH calcule magie physique
  _mphy() {
    var value = this.actor.data.data.abilities.ad.value + this.actor.data.data.abilities.ad.bonus;
    value = value + this.actor.data.data.abilities.int.value + this.actor.data.data.abilities.int.bonus;
    value = Math.ceil(value / 2);
    return value;
  }

  //PCH calcule magie psychique
  _mpsy() {
    var value = this.actor.data.data.abilities.cha.value + this.actor.data.data.abilities.cha.bonus;
    value = value + this.actor.data.data.abilities.int.value + this.actor.data.data.abilities.int.bonus;
    value = value - this.actor.data.data.abilities.cha.ignorempsy
    value = Math.ceil(value / 2);
    return value;
  }

  //Détail d'armure
  _armuredetail() {
    var compendiums = [];
    game.packs.forEach(elem => {
      if (elem.metadata.package == "naheulbeuk") {
        compendiums.push(elem.metadata.label)
      }
    });
    var prtete = 0;
    var prbras = 0;
    var prbouclier = 0;
    var prtorse = 0;
    var prmains = 0;
    var prjambes = 0;
    var prpieds = 0;
    this.actor.items._source.forEach(element => {
      if (element.type == "armure" && element.data.equipe) {
        if (element.data.prtete) { prtete = prtete + element.data.pr };
        if (element.data.prbras) { prbras = prbras + element.data.pr };
        if (element.data.prtorse) { prtorse = prtorse + element.data.pr };
        if (element.data.prmains) { prmains = prmains + element.data.pr };
        if (element.data.prjambes) { prjambes = prjambes + element.data.pr };
        if (element.data.prpieds) { prpieds = prpieds + element.data.pr };
      }
      if (element.type == "arme" && element.data.equipe && element.data.enmain) {
        if (element.data.prbouclier) { prbouclier = prbouclier + element.data.pr };
      }
    })
    this.actor.items._source.forEach(element => {
      if (element.type == "armure" && element.data.equipe) {
        if (element.data.prtete) { prtete = prtete + "*" };
        if (element.data.prbras) { prbras = prbras + "*" };
        if (element.data.prtorse) { prtorse = prtorse + "*" };
        if (element.data.prmains) { prmains = prmains + "*" };
        if (element.data.prjambes) { prjambes = prjambes + "*" };
        if (element.data.prpieds) { prpieds = prpieds + "*" };
      }
      if (element.type == "arme" && element.data.equipe && element.data.enmain) {
        if (element.data.prbouclier) { prbouclier = prbouclier + "*" };
      }
    })
    const myDialogOptions = {
      height: 509,
      width: 381
    };
    let d = new Dialog({
      title: "Equipement par zone",
      content: `
      <style>
      .contenant {
        position: relative;
        text-align: center;
        font-size: 25px;
      }
      .texte_centrer1 {
        position: absolute;
        top: 12.5%;
        left: 47%;
      }
      .texte_centrer2 {
        position: absolute;
        top: 32%;
        left: 15%;
      }
      .texte_centrer3 {
        position: absolute;
        top: 41%;
        left: 85%;
      }
      .texte_centrer4 {
        position: absolute;
        top: 48%;
        left: 43%;
      }
      .texte_centrer5 {
        position: absolute;
        top: 55%;
        left: 9%;
      }
      .texte_centrer6 {
        position: absolute;
        top: 66%;
        left: 64%;
      }
      .texte_centrer7 {
        position: absolute;
        top: 87%;
        left: 64%;
      }
      </style>
      <div class="contenant">
        <img src="systems/naheulbeuk/assets/autres/armure.png">
        <div class="texte_centrer1">`+ prtete + `</div>
        <div class="texte_centrer2">`+ prbras + `</div>
        <div class="texte_centrer3">`+ prbouclier + `</div>
        <div class="texte_centrer4">`+ prtorse + `</div>
        <div class="texte_centrer5">`+ prmains + `</div>
        <div class="texte_centrer6">`+ prjambes + `</div>
        <div class="texte_centrer7">`+ prpieds + `</div>
      </div>
      * zones équipées
      `,
      buttons: {
      }
    }, myDialogOptions);
    d.render(true);
  }
}

