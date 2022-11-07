import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

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
    return `systems/naheulbeuk/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    if (this.actor.system.biography!=undefined){context.enrichedBio = await TextEditor.enrichHTML(this.actor.system.biography, {async: true});}
    if (this.actor.system.attributes.bioCombat!=undefined){context.enrichedBioCombat = await TextEditor.enrichHTML(this.actor.system.attributes.bioCombat, {async: true});}

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
  async _prepareCharacterData(context, actor) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.NAHEULBEUK.abilities[k]) ?? k;
    }

    //PCH check bonus malus AD
    
    if (document.getElementById("bonus_malus_ad")==null) {
      await this._bonus_malus_ad()
    }

    if (document.getElementById("level_up")==null) {
      if (this.actor.system.attributes.level.value!=this._level()) {
        await this._level_up()
      }
    }

    //PCH maj actor (PJ)
    if (actor.type == "character") {
      const actorData = {
        "system.attributes.level.value": this._level(),
        "system.attributes.rm.value": this._rm(),
        "system.attributes.esq.value": this._esq(),
        "system.attributes.mphy.value": this._mphy(),
        "system.attributes.mpsy.value": this._mpsy()
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
    var poidssac = 0;
    var poidsbourse = 0;
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
        if (i.system.stockage == "sac") { poidssac = poidssac + i.system.weight * i.system.quantity * 100 }
        if (i.system.stockage == "bourse") { poidsbourse = poidsbourse + i.system.weight * i.system.quantity * 100 }
        charge = charge + i.system.weight * i.system.quantity
      }
      // Append to armes --> si pas équipée, on la considère comme un truc
      else if (i.type === 'arme') {
        if (i.system.equipe == true) { armes.push(i) }
        else {
          trucs.push(i);
          if (i.system.stockage == "sac") { poidssac = poidssac + i.system.weight * i.system.quantity * 100 }
          if (i.system.stockage == "bourse") { poidsbourse = poidsbourse + i.system.weight * i.system.quantity * 100 }
        };
        charge = charge + i.system.weight * i.system.quantity
      }
      // Append to armures --> si pas équipée, on la considère comme un truc
      else if (i.type === 'armure') {
        if (i.system.equipe == true) { armures.push(i) }
        else {
          trucs.push(i);
          if (i.system.stockage == "sac") { poidssac = poidssac + i.system.weight * i.system.quantity * 100 }
          if (i.system.stockage == "bourse") { poidsbourse = poidsbourse + i.system.weight * i.system.quantity * 100 }
        };
        charge = charge + i.system.weight * i.system.quantity
      }
      // Append to sacs --> si pas équipé, on la considère comme un truc
      else if (i.type === 'sac') {
        trucs.push(i);
        if (i.system.stockage == "sac") { poidssac = poidssac + i.system.weight * i.system.quantity * 100 }
        if (i.system.stockage == "bourse") { poidsbourse = poidsbourse + i.system.weight * i.system.quantity * 100 }
        charge = charge + i.system.weight * i.system.quantity
      }
      // Append to skills  --> on définit si le skill est appris ou hérité
      else if (i.type === 'competence') {
        if (i.system.gagne == true) { skillsGagnes.push(i) }
        else if (i.system.choix == true) { skillsChoisis.push(i) }
        else if (i.system.base == true) { skillsBases.push(i) }
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
          this.actor.update({ "system.attributes.magie.value": i.system.magie })
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
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
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
        if (i.system.stockage == "sac") { poidssac = poidssac + i.system.weight * i.system.quantity * 100 }
        if (i.system.stockage == "bourse") { poidsbourse = poidsbourse + i.system.weight * i.system.quantity * 100 }
        charge = charge + i.system.weight * i.system.quantity
      }
      else if (i.type === 'conteneur') {
        trucs.push(i);
        if (i.system.stockage == "sac") { poidssac = poidssac + i.system.weight * i.system.quantity * 100 }
        if (i.system.stockage == "bourse") { poidsbourse = poidsbourse + i.system.weight * i.system.quantity * 100 }
        charge = charge + i.system.weight * i.system.quantity
      }
      else if (i.type === 'recette') {
        trucs.push(i);
      }
    }

    //update PR truc de mauviette et bonus tirer correctement pour les PJ
    if (this.actor.type == "character") {
      const actorData = {
        "system.attributes.pr.trucdemauviette": flagTrucDeMauviette,
        "system.attributes.lancerarme.value": flagTirerCorrectement * (-5)
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
    context.poidssac = poidssac / 100;
    context.poidsbourse = poidsbourse / 100;
    if (this.actor.type == "character") {
      context.charge = (charge * 100 ) / 100;
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
    //fenetre bonus ad et level up au premier plan
    if(document.getElementById("bonus_malus_ad")!=null){
      document.getElementById("bonus_malus_ad").offsetParent.style["z-index"]=document.getElementById("bonus_malus_ad").offsetParent.style["z-index"]+1
    }
    if(document.getElementById("level_up")!=null){
      document.getElementById("level_up").offsetParent.style["z-index"]=document.getElementById("level_up").offsetParent.style["z-index"]+1
    }
    //PCH - sur tag item-equipe, on équipe l'objet
    html.find('.item-equipe').click(ev => this._onItemEquipe(ev, this.actor));

    //PCH - sur tag item-en-main, on équipe l'objet
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
        "system.attributes.hidelivres": !this.actor.system.attributes.hidelivres
      };
      this.actor.update(actorData);
    });

    //PCH hide catégorie d'inventaire
    html.find('.hidefioles').click(ev => {
      const actorData = {
        "system.attributes.hidefioles": !this.actor.system.attributes.hidefioles
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hideingredients').click(ev => {
      const actorData = {
        "system.attributes.hideingredients": !this.actor.system.attributes.hideingredients
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hidearmes').click(ev => {
      const actorData = {
        "system.attributes.hidearmes": !this.actor.system.attributes.hidearmes
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hideprotections').click(ev => {
      const actorData = {
        "system.attributes.hideprotections": !this.actor.system.attributes.hideprotections
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hidenourritures').click(ev => {
      const actorData = {
        "system.attributes.hidenourritures": !this.actor.system.attributes.hidenourritures
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hiderichesses').click(ev => {
      const actorData = {
        "system.attributes.hiderichesses": !this.actor.system.attributes.hiderichesses
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hideperso').click(ev => {
      const actorData = {
        "system.attributes.hideperso": !this.actor.system.attributes.hideperso
      };
      this.actor.update(actorData);
    });
        //PCH hide catégorie d'inventaire
    html.find('.hidemonture').click(ev => {
      const actorData = {
        "system.attributes.hidemonture": !this.actor.system.attributes.hidemonture
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hidespeciaux').click(ev => {
      const actorData = {
        "system.attributes.hidespeciaux": !this.actor.system.attributes.hidespeciaux
      };
      this.actor.update(actorData);
    });
      //PCH hide catégorie d'inventaire
    html.find('.hidebourse').click(ev => {
      const actorData = {
        "system.attributes.hidebourse": !this.actor.system.attributes.hidebourse
      };
      this.actor.update(actorData);
    });
      //PCH hide catégorie d'inventaire
    html.find('.hidenosac').click(ev => {
      const actorData = {
        "system.attributes.hidenosac": !this.actor.system.attributes.hidenosac
      };
      this.actor.update(actorData);
    });
    //PCH hide catégorie d'inventaire
    html.find('.hidesac').click(ev => {
      const actorData = {
        "system.attributes.hidesac": !this.actor.system.attributes.hidesac
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
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }
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
      if (item.system.equipe == true) {
        this._onItemEquipe(ev, this.actor, context).then((value) => {
          item.delete();
        });
      } else { item.delete() }
      li.slideUp(200, () => this.render(false));
    });

    // Item changer stockage
    html.find('.item-nosac').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.update({"system.stockage":"nosac"})
    });
    html.find('.item-sac').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.update({"system.stockage":"sac"})
    });
    html.find('.item-bourse').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.update({"system.stockage":"bourse"})
    });
    
    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    //PCH rajout d'un roll custom avec plus d'options, et d'un roll avec fenêtre pour les inputs
    //Roll simple, depuis la fiche acteur, sans interface
    html.find('.rollable2').click(ev => {
      let elementRoll = ev.currentTarget;
      let datasetRoll = elementRoll.dataset;
      let liRoll = $(ev.currentTarget).parents(".item");
      const itemRoll = this.actor.items.get(liRoll.data("itemId"));
      game.naheulbeuk.macros.onRoll(this.actor,itemRoll,datasetRoll,"simple")
    });
    //Roll simple, depuis la fiche acteur, avec interface
    html.find('.rollable3').click(ev => {
      let elementRoll = ev.currentTarget;
      let datasetRoll = elementRoll.dataset;
      let liRoll = $(ev.currentTarget).parents(".item");
      const itemRoll = this.actor.items.get(liRoll.data("itemId"));
      game.naheulbeuk.macros.onRoll(this.actor,itemRoll,datasetRoll,"interface")
    });
    //Roll custom, depuis la fiche acteur, avec interface
    html.find('.rollable4').click(ev => {
      let elementRoll = ev.currentTarget;
      let datasetRoll = elementRoll.dataset;
      let liRoll = $(ev.currentTarget).parents(".item");
      const itemRoll = this.actor.items.get(liRoll.data("itemId"));
      game.naheulbeuk.macros.onRollCustom(this.actor,itemRoll,datasetRoll)
    });

    //PCH détail de l'armure
    html.find('.armuredetail').click(this._armuredetail.bind(this));

    //PCH diminuer quantité d'objet
    html.find('.item-quantity-moins').click(this._quantitymoins.bind(this));
    html.find('.item-quantity-plus').click(this._quantityplus.bind(this));

    //PCH more stats NPC
    html.find('.moreStats').click(ev => {
      const actorData = {
        "system.attributes.moreStats": !this.actor.system.attributes.moreStats
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

  //non utilisé mais gardé pour l'exemple
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
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemsystem["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  //Equipe un objet et applique les bonus / malus
  async _onItemEquipe(ev, actor) {
    ev.preventDefault();
    //on récupère l'objet
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    //Maj poid max sac et bourse
    if (item.system.equipe == false && item.type == "sac" && actor.type == "character") {
      if (item.type == "sac" && item.system.type == "sac à dos") {
        var poidsac = Number(actor.system.attributes.sac.max) + Number(item.system.place);
        await actor.update({"system.attributes.sac.max": poidsac});
        await item.update({"system.stockage":"nosac"})
      }
      if (item.type == "sac" && item.system.type == "bourse") {
        var poidbourse = Number(actor.system.attributes.bourse.max) + Number(item.system.place);
        await actor.update({"system.attributes.bourse.max": poidbourse});
        await item.update({"system.stockage":"nosac"})
      }
    } else if (item.system.equipe == true && item.type == "sac" && actor.type == "character") {
      if (item.type == "sac" && item.system.type == "sac à dos") {
        var poidsac = Number(actor.system.attributes.sac.max) - Number(item.system.place);
        await actor.update({"system.attributes.sac.max": poidsac});
        await item.update({"system.stockage":"sac"})
      }
      if (item.type == "sac" && item.system.type == "bourse") {
        var poidbourse = Number(actor.system.attributes.bourse.max) - Number(item.system.place);
        await actor.update({"system.attributes.bourse.max": poidbourse});
        await item.update({"system.stockage":"sac"})
      }
    }

    //si l'objet n'est pas équipé
    if (item.system.equipe == false) {
      var cou = Number(actor.system.abilities.cou.bonus) + Number(item.system.cou);
      var int = Number(actor.system.abilities.int.bonus) + Number(item.system.int);
      var cha = Number(actor.system.abilities.cha.bonus) + Number(item.system.cha);
      var ad = Number(actor.system.abilities.ad.bonus) + Number(item.system.ad);
      var fo = Number(actor.system.abilities.fo.bonus) + Number(item.system.fo);
      var att = Number(actor.system.abilities.att.bonus) + Number(item.system.att);
      var prd = Number(actor.system.abilities.prd.bonus) + Number(item.system.prd);
      var pr = Number(actor.system.attributes.pr.bonus) + Number(item.system.pr);
      var prm = Number(actor.system.attributes.prm.bonus) + Number(item.system.prm);
      var rm = Number(actor.system.attributes.rm.bonus) + Number(item.system.rm);
      var mvt = Number(actor.system.attributes.mvt.value) + Number(item.system.mvt);
      
      //on construit les datas
      var actorData = {};

      if (item.type != "arme") { //pour autre chose qu'une arme
        actorData = {
          "system.abilities.cou.bonus": cou,
          "system.abilities.int.bonus": int,
          "system.abilities.cha.bonus": cha,
          "system.abilities.ad.bonus": ad,
          "system.abilities.fo.bonus": fo,
          "system.abilities.att.bonus": att,
          "system.abilities.prd.bonus": prd,
          "system.attributes.pr.bonus": pr,
          "system.attributes.prm.bonus": prm,
          "system.attributes.mvt.value": mvt,
          "system.attributes.rm.bonus": rm
        };
      }
      if (item.type == "arme") { //Si c'est une arme on n'applique pas les bonus liés à la prise en mains
        actorData = {
          "system.abilities.cou.bonus": cou,
          "system.abilities.int.bonus": int,
          "system.abilities.cha.bonus": cha,
          "system.abilities.ad.bonus": ad,
          "system.abilities.fo.bonus": fo
        };
      }
      await item.update({ "system.equipe": true }); //update de l'objet pour le passer en équipé
      await actor.update(actorData);//update de l'acteur pour modifier les stats
      //ajout d'un bout spécifique pour gérer les formules custom
      //ATTENTION PEUT ËTRE A REVOIR
      if (item.system.custom != "") {
        const customS = item.system.custom.split(";")
        customS.forEach(e => {
          const custom = e.split("=")
          var variable = custom[0]
          var customvaleur = Number(eval(game.naheulbeuk.macros.replaceAttr(custom[1], actor)))
          const valeur = Number(eval("actor." + variable)) + customvaleur
          actor.update({ [variable]: valeur });
        })
      }
    } else { //même chose mais en retirant le bonus
      var cou = Number(actor.system.abilities.cou.bonus) - Number(item.system.cou);
      var int = Number(actor.system.abilities.int.bonus) - Number(item.system.int);
      var cha = Number(actor.system.abilities.cha.bonus) - Number(item.system.cha);
      var ad = Number(actor.system.abilities.ad.bonus) - Number(item.system.ad);
      var fo = Number(actor.system.abilities.fo.bonus) - Number(item.system.fo);
      var att = Number(actor.system.abilities.att.bonus) - Number(item.system.att);
      var prd = Number(actor.system.abilities.prd.bonus) - Number(item.system.prd);
      var pr = Number(actor.system.attributes.pr.bonus) - Number(item.system.pr);
      var prm = Number(actor.system.attributes.prm.bonus) - Number(item.system.prm);
      var rm = Number(actor.system.attributes.rm.bonus) - Number(item.system.rm);
      var mvt = Number(actor.system.attributes.mvt.value) - Number(item.system.mvt);

      var actorData = {};
      if (item.type != "arme") {
        actorData = {
          "system.abilities.cou.bonus": cou,
          "system.abilities.int.bonus": int,
          "system.abilities.cha.bonus": cha,
          "system.abilities.ad.bonus": ad,
          "system.abilities.fo.bonus": fo,
          "system.abilities.att.bonus": att,
          "system.abilities.prd.bonus": prd,
          "system.attributes.pr.bonus": pr,
          "system.attributes.prm.bonus": prm,
          "system.attributes.mvt.value": mvt,
          "system.attributes.rm.bonus": rm,
        };
      }
      if (item.type == "arme") {
        actorData = {
          "system.abilities.cou.bonus": cou,
          "system.abilities.int.bonus": int,
          "system.abilities.cha.bonus": cha,
          "system.abilities.ad.bonus": ad,
          "system.abilities.fo.bonus": fo
        };
      }
      if (item.type == "arme" && item.system.enmain == true) { await this._onArmeEnMains(ev, actor) };
      await item.update({ "system.equipe": false }); //update de l'objet pour le passer en équipé
      await actor.update(actorData);
      //ajout d'un bout spécifique pour gérer les formules custom
      //ATTENTION PEUT ËTRE PAS BON
      if (item.system.custom != "") {
        const customS = item.system.custom.split(";")
        customS.forEach(e => {
          const custom = e.split("=")
          var variable = custom[0]
          var customvaleur = Number(eval(game.naheulbeuk.macros.replaceAttr(custom[1], actor)))
          const valeur = Number(eval("actor." + variable)) - customvaleur
          actor.update({ [variable]: valeur });
        })
      }
    };
  }

  //Application des bonus/malus quand on prend l'arme en mains
  async _onArmeEnMains(ev, actor) {
    ev.preventDefault();
    //on récupère l'objet
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    //si l'objet n'est pas en mains
    if (item.system.enmain == false) {
      //on calcule les nouvelles stats en rajoutant les bonus

      //cas particulier de l'attaque baissé quand on a un bouclier
      if (item.system.prd != "-" && (item.system.formula == "" || item.system.formula == "-")) {
        var att = Number(actor.system.abilities.att.bonus) + Number(item.system.att);
      } else {
        var att = Number(actor.system.abilities.att.bonus);
      }

      const prd = Number(actor.system.abilities.prd.bonus) + Number(item.system.prd);
      const pr = Number(actor.system.attributes.pr.bonus) + Number(item.system.pr);
      const prm = Number(actor.system.attributes.prm.bonus) + Number(item.system.prm);
      const rm = Number(actor.system.attributes.rm.bonus) + Number(item.system.rm);
      const mvt = Number(actor.system.attributes.mvt.value) + Number(item.system.mvt);
      var lancer = Number(actor.system.attributes.lancerarme.bonus)
      if (item.system.lancerarme != "-") { lancer = lancer + Number(item.system.lancerarme) }
      if (actor.system.attributes.lancerarme.degat == 0) {
        var lancerdegat = ""
      } else {
        var lancerdegat = actor.system.attributes.lancerarme.degat
      }
      if (item.system.lancerarmedegat != "-" && item.system.lancerarmedegat != "0") {
        if (item.system.lancerarmedegat.substr(0, 1) == "-" || item.system.lancerarmedegat.substr(0, 1) == "+") {
          lancerdegat = lancerdegat + " " + item.system.lancerarmedegat + " "
        } else {
          lancerdegat = lancerdegat + " +" + item.system.lancerarmedegat + " "
        }
      }
      //on construit les datas
      const actorData = {
        "system.abilities.att.bonus": att,
        //"system.abilities.prd.bonus": prd,
        "system.attributes.pr.bonus": pr,
        "system.attributes.prm.bonus": prm,
        "system.attributes.lancerarme.bonus": lancer,
        "system.attributes.lancerarme.degat": lancerdegat,
        "system.attributes.mvt.value": mvt,
        "system.attributes.rm.bonus": rm
      };
      await item.update({ "system.enmain": true }); //update de l'objet pour le passer en équipé
      await actor.update(actorData);//update de l'acteur pour modifier les stats
      return
    } else if (item.system.enmain == true) { //même chose mais en retirant le bonus
      //cas particulier de l'attaque baissé quand on a un bouclier
      if (item.system.prd != "-" && (item.system.formula == "" || item.system.formula == "-")) {
        var att = Number(actor.system.abilities.att.bonus) - Number(item.system.att);
      } else {
        var att = Number(actor.system.abilities.att.bonus);
      }
      const prd = Number(actor.system.abilities.prd.bonus) - Number(item.system.prd);
      const pr = Number(actor.system.attributes.pr.bonus) - Number(item.system.pr);
      const prm = Number(actor.system.attributes.prm.bonus) - Number(item.system.prm);
      const rm = Number(actor.system.attributes.rm.bonus) - Number(item.system.rm);
      const mvt = Number(actor.system.attributes.mvt.value) - Number(item.system.mvt);
      var lancer = Number(actor.system.attributes.lancerarme.bonus)
      if (item.system.lancerarme != "-") { lancer = lancer - Number(item.system.lancerarme) }
      var lancerdegat = actor.system.attributes.lancerarme.degat
      if (item.system.lancerarmedegat != "-") {
        if (item.system.lancerarmedegat.substr(0, 1) == "-" || item.system.lancerarmedegat.substr(0, 1) == "+") {
          var replacedegat = " " + item.system.lancerarmedegat + " ";
          lancerdegat = actor.system.attributes.lancerarme.degat.replace(replacedegat, "")
        } else {
          var replacedegat = " +" + item.system.lancerarmedegat + " ";
          lancerdegat = actor.system.attributes.lancerarme.degat.replace(replacedegat, "")
        }
      }
      const actorData = {
        "system.abilities.att.bonus": att,
        //"system.abilities.prd.bonus": prd,
        "system.attributes.pr.bonus": pr,
        "system.attributes.prm.bonus": prm,
        "system.attributes.lancerarme.bonus": lancer,
        "system.attributes.lancerarme.degat": lancerdegat,
        "system.attributes.mvt.value": mvt,
        "system.attributes.rm.bonus": rm
      };
      await item.update({ "system.enmain": false }); //update de l'objet pour le passer en équipé
      await actor.update(actorData);
      return
    };
  }

  //PCH - diminue la quantité d'un objet
  async _quantitymoins(ev) {
    let option="moins"
    ev.preventDefault();
    //on récupère l'objet
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    const quantity = item.system.quantity
    if (quantity > 0 && option=="moins") {
      item.update({ "system.quantity": quantity - 1 });
    }
    if (option=="plus") {
      item.update({ "system.quantity": quantity + 1 });
    }
  }

  //PCH - diminue la quantité d'un objet
  async _quantityplus(ev) {
    let option="plus"
    ev.preventDefault();
    //on récupère l'objet
    const li = $(ev.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    const quantity = item.system.quantity
    if (quantity > 0 && option=="moins") {
      item.update({ "system.quantity": quantity - 1 });
    }
    if (option=="plus") {
      item.update({ "system.quantity": quantity + 1 });
    }
  }

  //PCH calcule niveau
  _level() {
    var value = this.actor.system.attributes.xp.value
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
    var value = this.actor.system.abilities.cou.value + this.actor.system.abilities.cou.bonus;
    value = value + this.actor.system.abilities.int.value + this.actor.system.abilities.int.bonus;
    value = value + this.actor.system.abilities.fo.value + this.actor.system.abilities.fo.bonus;
    value = Math.round(value / 3);
    return value;
  }

  //PCH calcule esquive
  _esq() {
    var val1 = this.actor.system.abilities.ad.value + this.actor.system.abilities.ad.bonus
    var val2 = this.actor.system.attributes.pr.value + this.actor.system.attributes.pr.bonus - this.actor.system.attributes.pr.prignorepoid
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
    var value = this.actor.system.abilities.ad.value + this.actor.system.abilities.ad.bonus;
    value = value + this.actor.system.abilities.int.value + this.actor.system.abilities.int.bonus;
    value = Math.ceil(value / 2);
    return value;
  }

  //PCH calcule magie psychique
  _mpsy() {
    var value = this.actor.system.abilities.cha.value + this.actor.system.abilities.cha.bonus;
    value = value + this.actor.system.abilities.int.value + this.actor.system.abilities.int.bonus;
    value = value - this.actor.system.abilities.cha.ignorempsy
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
      if (element.type == "armure" && element.system.equipe) {
        if (element.system.prtete) { prtete = prtete + element.system.pr };
        if (element.system.prbras) { prbras = prbras + element.system.pr };
        if (element.system.prtorse) { prtorse = prtorse + element.system.pr };
        if (element.system.prmains) { prmains = prmains + element.system.pr };
        if (element.system.prjambes) { prjambes = prjambes + element.system.pr };
        if (element.system.prpieds) { prpieds = prpieds + element.system.pr };
      }
      if (element.type == "arme" && element.system.equipe && element.system.enmain) {
        if (element.system.prbouclier) { prbouclier = prbouclier + element.system.pr };
      }
    })
    this.actor.items._source.forEach(element => {
      if (element.type == "armure" && element.system.equipe) {
        if (element.system.prtete) { prtete = prtete + "*" };
        if (element.system.prbras) { prbras = prbras + "*" };
        if (element.system.prtorse) { prtorse = prtorse + "*" };
        if (element.system.prmains) { prmains = prmains + "*" };
        if (element.system.prjambes) { prjambes = prjambes + "*" };
        if (element.system.prpieds) { prpieds = prpieds + "*" };
      }
      if (element.type == "arme" && element.system.equipe && element.system.enmain) {
        if (element.system.prbouclier) { prbouclier = prbouclier + "*" };
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

  //PCH calcule bonus/malus AD
  _bonus_malus_ad() {
    let ad_value = this.actor.system.abilities.ad.value + this.actor.system.abilities.ad.bonus
    let bonus_malus_AD = this.actor.system.abilities.ad.bonus_malus_AD
    let d
    if (this.actor.system.abilities.ad.value!=0 && ad_value<9 && bonus_malus_AD==0){
      d = new Dialog({
        title: "Bonus / Malus d'attaque ou de parade lié à l'Adresse",
        content: `
        <form>
          <label id="bonus_malus_ad">Ton Adresse vient de passer en dessous de 9, mets -1 en parade ou en attaque.</label>
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": -1
              };
              this.actor.update(actorData);
            }
          }
        }
      });
      d.render(true);
    } else if ((ad_value>12) && (bonus_malus_AD==0)){
      d = new Dialog({
        title: "Bonus / Malus d'attaque ou de parade lié à l'Adresse",
        content: `
        <form>
          <label id="bonus_malus_ad">Ton Adresse vient de passer au dessus de 12, mets +1 en parade ou en attaque.</label>
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": 1
              };
              this.actor.update(actorData);
            }
          }
        }
      });
      d.render(true);
    } else if ((ad_value>12) && (bonus_malus_AD==-1)){
      d = new Dialog({
        title: "Bonus / Malus d'attaque ou de parade lié à l'Adresse",
        content: `
        <form>
          <label id="bonus_malus_ad">Ton Adresse vient de passer au dessus de 12, enlève le malus de -1 en attaque ou parade que tu avais mis, puis mets +1 en parade ou en attaque.</label>
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": 1
              };
              this.actor.update(actorData);
            }
          }
        }
      });
      d.render(true);
    } else if ((ad_value<9) && (bonus_malus_AD==1)){
      d = new Dialog({
        title: "Bonus / Malus d'attaque ou de parade lié à l'Adresse",
        content: `
        <form>
          <label id="bonus_malus_ad">Ton Adresse vient de passer en dessous de 9, enlève le bonus de +1 en attaque ou parade que tu avais mis, puis mets -1 en parade ou en attaque.</label>
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": -1
              };
              this.actor.update(actorData);
            }
          }
        }
      });
      d.render(true);
    } else if ((ad_value>8 && ad_value<13) && (bonus_malus_AD==-1)){
      d = new Dialog({
        title: "Bonus / Malus d'attaque ou de parade lié à l'Adresse",
        content: `
        <form>
          <label id="bonus_malus_ad">Ton Adresse vient de passer au dessus de 8, enlève le malus de -1 en attaque ou parade que tu avais mis.</label>
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": 0
              };
              this.actor.update(actorData);
            }
          }
        }
      });
      d.render(true);
    } else if ((ad_value>8 && ad_value<13) && (bonus_malus_AD==1)){
      d = new Dialog({
        title: "Bonus / Malus d'attaque ou de parade lié à l'Adresse",
        content: `
        <form>
          <label id="bonus_malus_ad">Ton Adresse vient de passer en dessous de 13, enlève le bonus de +1 en attaque ou parade que tu avais mis.</label>
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": 0
              };
              this.actor.update(actorData);
            }
          }
        }
      });
      d.render(true);
    }
    return d
  }

  //PCH calcule level up
  _level_up() {
    let niveau = this._level()
    let d = new Dialog({
      title: "Level UP",
      content: `
      <form>
        <label id="level_up">Bravo, tu viens de passer niveau `+niveau+` !!<br/><br/>
        Voila la liste des modifications à apporter.<br/>
        <em>(Attention, ton personnage peut avoir des règles spécifiques !)</em><br/><br/>
          - Tous les niveaux : +1d6 PV ou PA<br/>
          - Niveaux pairs : +1 à FO ou AD ou COU ou INT<br/>
          - Niveaux impairs : +1 à l'attaque ou la parade<br/>
          - Niveau 3, 6 et 10 : +1 compétence<br/>
          - Niveau 5 et 10 : +1 spécialité pour le mage</label>
        <br/><br/>
      </form>
      `,
      buttons: {
        one: {
          label: "ok !",
          callback: (html) => {
          }
        }
      }
    });
    d.render(true);
  }
}

