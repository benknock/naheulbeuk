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
    if (this.isEditable) {
      if(actor.type=="character") {
        //Popup bonus malus AD > 12 <8
        if (document.getElementById("bonus_malus_ad")==null) {
          await this._bonus_malus_ad()
        }
        //Popup level up
        if (document.getElementById("level_up")==null) {
          if (this.actor.system.attributes.level.value!=this._level()) {
            await this._level_up()
          }
        }
      }

      //Maj stat acteurs
      let actorData = this._update_stats()
      await actor.update(actorData);
      if (actor.type == "character") {
        let bio = ""
        if (actor.system.biography=="") {
          bio = '<h2>Description :</h2>\n<p><strong>&Acirc;ge :</strong></p>\n<p><strong>Taille :</strong></p>\n<p><strong>Poids :</strong></p>\n<p><strong>Cheveux :</strong></p>\n<p>&nbsp;</p>\n<h2>Caract&eacute;ristiques sp&eacute;ciales :</h2>\n<p><strong>Vision :</strong></p>\n<p><strong>Restrictions :</strong></p>\n<p><strong>Bonus :</strong></p>\n<p>&nbsp;</p>\n<h2>Histoire :</h2>\n<p>&nbsp;</p>\n<p>&nbsp;</p>'
        } else {
          bio = actor.system.biography
        }
        const actorData = {
          "system.biography": bio,
          "system.attributes.level.value": this._level(),
          "system.attributes.rm.value": this._rm(),
          "system.attributes.esq.value": this._esq(),
          "system.attributes.mphy.value": this._mphy(),
          "system.attributes.mpsy.value": this._mpsy()
        };
        await actor.update(actorData);
      }
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) { //permet l'accès dans les doc html
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
    var poidssac = 0; // poids des objets dans le sac
    var poidsbourse = 0; //poids des objets dans la bourse
    var charge = 0; //poids total des objets portés
    var compteurMetier = 0; //pour limiter à 1
    var compteurOrigine = 0; // pour limiter à 1
    var flagTrucDeMauviette = 0; //pour détecter si on a la compétence
    var flagTirerCorrectement = 1; //pour détecter si on a la compétence
    var attaques = []; // attaque PNJ
    var traits = []; //traits PNJ
    var regions = []; //region PNJ
    var coups = []; //coups spéciaux
    var apes = []; //APE

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
      //attaque (PNJ)
      else if (i.type === 'attaque') {
        attaques.push(i);
      }
      //traits (PNJ)
      else if (i.type === 'trait') {
        traits.push(i);
      }
      //region (PNJ)
      else if (i.type === 'region') {
        regions.push(i);
      }
      //Coup spéciaux
      else if (i.type === 'coup') {
        coups.push(i);
      }
      //APE
      else if (i.type === 'ape') {
        apes.push(i);
      }
      //Gemmes
      else if (i.type === 'gemme') {
        trucs.push(i);
        if (i.system.stockage == "sac") { poidssac = poidssac + i.system.weight * i.system.quantity * 100 }
        if (i.system.stockage == "bourse") { poidsbourse = poidsbourse + i.system.weight * i.system.quantity * 100 }
        charge = charge + i.system.weight * i.system.quantity
      }
      //Conteneurs
      else if (i.type === 'conteneur') {
        trucs.push(i);
        if (i.system.stockage == "sac") { poidssac = poidssac + i.system.weight * i.system.quantity * 100 }
        if (i.system.stockage == "bourse") { poidsbourse = poidsbourse + i.system.weight * i.system.quantity * 100 }
        charge = charge + i.system.weight * i.system.quantity
      }
      //Plan ingénieur
      else if (i.type === 'recette') {
        trucs.push(i);
      }
    }

    //update PR truc de mauviette et bonus tirer correctement pour les PJ
    if (this.actor.type == "character") {
      const actorData = {
        "system.attributes.pr.trucdemauviette": flagTrucDeMauviette,
        "system.attributes.att_arme_jet.value": flagTirerCorrectement * (-4)
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
    context.categoriemagique=["generaliste","combat","feu","metamorphose","thermodynamique","invocation","necromancie","eau","terre","air","tzinntch","pr-niourgl","pr-dlul","pr-youclidh","pr-slanoush","pr-adathie","pa-niourgl","pa-slanoush","pa-dlul","pa-braav","pa-khornettoh"]
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    //Garder la fenetre bonus ad et level up au premier plan
    if(document.getElementById("bonus_malus_ad")!=null){
      document.getElementById("bonus_malus_ad").offsetParent.style["z-index"]=document.getElementById("bonus_malus_ad").offsetParent.style["z-index"]+1
    }
    if(document.getElementById("level_up")!=null){
      document.getElementById("level_up").offsetParent.style["z-index"]=document.getElementById("level_up").offsetParent.style["z-index"]+1
    }

    //Sur tag item-equipe, on équipe l'objet
    html.find('.item-equipe').click(ev => this._onItemEquipe(ev, this.actor));

    //Afficher les bonus/malus liés aux objets (oeil carac)
    html.find('.bonus-eye').click(ev => {
      this._getStatsEquipe(this.actor)
    });

    //Hide catégorie d'inventaire
    html.find('.hidelivres').click(ev => {
      const actorData = {
        "system.attributes.hidelivres": !this.actor.system.attributes.hidelivres
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidefioles').click(ev => {
      const actorData = {
        "system.attributes.hidefioles": !this.actor.system.attributes.hidefioles
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hideingredients').click(ev => {
      const actorData = {
        "system.attributes.hideingredients": !this.actor.system.attributes.hideingredients
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidearmes').click(ev => {
      const actorData = {
        "system.attributes.hidearmes": !this.actor.system.attributes.hidearmes
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hideprotections').click(ev => {
      const actorData = {
        "system.attributes.hideprotections": !this.actor.system.attributes.hideprotections
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidenourritures').click(ev => {
      const actorData = {
        "system.attributes.hidenourritures": !this.actor.system.attributes.hidenourritures
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hiderichesses').click(ev => {
      const actorData = {
        "system.attributes.hiderichesses": !this.actor.system.attributes.hiderichesses
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hideperso').click(ev => {
      const actorData = {
        "system.attributes.hideperso": !this.actor.system.attributes.hideperso
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidemonture').click(ev => {
      const actorData = {
        "system.attributes.hidemonture": !this.actor.system.attributes.hidemonture
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidespeciaux').click(ev => {
      const actorData = {
        "system.attributes.hidespeciaux": !this.actor.system.attributes.hidespeciaux
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidebourse').click(ev => {
      const actorData = {
        "system.attributes.hidebourse": !this.actor.system.attributes.hidebourse
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidenosac').click(ev => {
      const actorData = {
        "system.attributes.hidenosac": !this.actor.system.attributes.hidenosac
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidesac').click(ev => {
      const actorData = {
        "system.attributes.hidesac": !this.actor.system.attributes.hidesac
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidesachs').click(ev => {
      const actorData = {
        "system.attributes.hidesachs": !this.actor.system.attributes.hidesachs
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hidearmehs').click(ev => {
      const actorData = {
        "system.attributes.hidearmehs": !this.actor.system.attributes.hidearmehs
      };
      this.actor.update(actorData);
    });
    //Hide catégorie d'inventaire
    html.find('.hideautrehs').click(ev => {
      const actorData = {
        "system.attributes.hideautrehs": !this.actor.system.attributes.hideautrehs
      };
      this.actor.update(actorData);
    });

    //Afficher ou masquer les niveau de sorts
    html.find('.hideSort').click(ev => {
      const lvl = ev.currentTarget.dataset.lvl
      const tab = ev.currentTarget.dataset.tab
      if (document.getElementById("hideSort" + lvl + tab).style.display == "none") {
        document.getElementById("hideSort" + lvl + tab).style.display = "block"
      } else {
        document.getElementById("hideSort" + lvl + tab).style.display = "none"
      }
    });

    //Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item.system.equipe==true){
        item.sheet.render(true,{editable:false});
      } else {
        item.sheet.render(true)
      }
    });

    //Affichage d'un compendium (metier/origine)
    html.find('.compendium-pack').click(ev => {
      const element = ev.currentTarget;
      const dataset = element.dataset;
      var packC = dataset.pack;
      game.packs.find(p => p.metadata.name === packC).render(true)
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item --> non utilisé mais gardé au cas ou
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

    // Item changer le type de stockage
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
    
    // Active Effect management --> non utilisé mais gardé au cas ou
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

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

    //Détail de la répartition de l'armure
    html.find('.armuredetail').click(this._armuredetail.bind(this));

    //Augmenter/Diminuer quantité d'objet
    html.find('.item-quantity-moins').click(this._quantitymoins.bind(this));
    html.find('.item-quantity-plus').click(this._quantityplus.bind(this));

    //Affiche plus de stats pour les PNJ
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
    //Maj  sac et bourse
    if (item.system.equipe == false && item.type == "sac" && actor.type == "character") {
      if (item.type == "sac" && item.system.type == "sac à dos") {
        await item.update({"system.stockage":"nosac"})
      }
      if (item.type == "sac" && item.system.type == "bourse") {
        await item.update({"system.stockage":"nosac"})
      }
    } else if (item.system.equipe == true && item.type == "sac" && actor.type == "character") {
      if (item.type == "sac" && item.system.type == "sac à dos") {
        await item.update({"system.stockage":"sac"})
      }
      if (item.type == "sac" && item.system.type == "bourse") {
        await item.update({"system.stockage":"sac"})
      }
    }
    
    //Initialisation de la variable permettant de savoir si on peut équiper l'objet
    let flag_equipement_possible = true

    //Gestion PR max (ignoré si shift utilisé lors de l'équipement)
    if (ev.shiftKey) {

    } else {
      if (item.system.equipe==false) {
        //Test des objets de type "bouclier" équipés 
        var prbouclier = 0;
        this.actor.items._source.forEach(element => {
          if (element.type == "arme" && element.system.equipe) {
            if (element.system.prbouclier) { prbouclier = prbouclier + element.system.pr };
          }
        })
        //Définition des différentes protection
        //Pr totale sans truc de mauviette et les protections qui ne comptent pas dans l'encombrement
        let pr_totale = this.actor.system.attributes.pr.value + this.actor.system.attributes.pr.bonus + this.actor.system.attributes.pr.bonus_man
        let pr_ss_bouclier = pr_totale - prbouclier
        let pr_max = this.actor.system.attributes.pr.max
        //Test du nouvel objet à équiper
        if (item.type == "armure" && pr_max != "" && pr_max != "-") {
          if ((pr_ss_bouclier + item.system.pr) > parseFloat(pr_max)) {
            flag_equipement_possible = false
            ui.notifications.error("Ce n'est pas possible d'équiper cet objet, la protection max serait dépassée.");
          }
        }
      }
    }

    //Test des objets de type "arme" équipés
    if (item.system.equipe == false && item.type == "arme" && actor.type == "character") {
      //On regarde ce qui est équipé
      let nb_arme_cac=0
      let nb_bouclier=0
      let nb_arme_distance=0
      let nb_munition=0
      let nb_arme_autre=0
      for (let objFind of actor.items) {
        if (objFind.type=="arme") {
          if (objFind.system.equipe == true) {
            if (objFind.system.arme_cac == true) {nb_arme_cac++}
            if (objFind.system.prbouclier == true) {nb_bouclier++}
            if ((objFind.system.arme_distance == true || objFind.system.armefeu == true) && objFind.system.arme_cac == false) {nb_arme_distance++}
            if (objFind.system.nb_munition == true) {nb_munition++}
            if (objFind.system.arme_autre == true) {nb_arme_autre++}
          }
        }
      }

      //On compare avec l'objet à équiper
      if (ev.shiftKey) {

      } else {
        if (item.system.arme_cac == true) {
          if (nb_arme_cac>1) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà 2 armes équipées.");}
          else if (nb_arme_distance>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez une arme à distance équipée.");}
          else if (nb_arme_cac>0 && nb_bouclier>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà une arme et un boulier équipés.");}
          else if (nb_arme_autre>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà un objet spécial équipé.");}
        } else if (item.system.arme_distance == true || item.system.armefeu == true) {
          if (nb_arme_distance>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà une arme équipée.");}
          else if (nb_arme_cac>0 && nb_bouclier>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà une arme et un boulier équipés.");}
          else if (nb_arme_cac>0 && nb_bouclier==0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà une arme équipée.");}
          else if (nb_bouclier>0 && nb_arme_cac==0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà un bouclier équipé.");}
          else if (nb_arme_autre>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà un objet spécial équipé.");}
        } else if (item.system.prbouclier == true) {
          if (nb_arme_cac>1) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà 2 armes équipées.");}
          else if (nb_arme_distance>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez une arme à distance équipée.");}
          else if (nb_arme_cac>0 && nb_bouclier>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà une arme et un boulier équipés.");}
          else if (nb_arme_autre>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà un objet spécial équipé.");}
          else if (nb_bouclier>0 && nb_arme_cac==0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà un bouclier équipé.");}
        } else if (item.system.arme_autre == true) {
          if (nb_arme_cac>0 || nb_arme_distance>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà une arme équipée.");}
          else if (nb_bouclier>0 && nb_arme_cac==0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà un bouclier équipé.");}
          else if (nb_arme_autre>0) {flag_equipement_possible=false;ui.notifications.error("Vous avez déjà un objet spécial équipé.");}
        }
      }
    }
    
    //si l'objet n'est pas équipé
    if (flag_equipement_possible==true) {
      if (item.system.equipe == false) {
        await item.update({ "system.equipe": true }); //update de l'objet pour le passer en équipé
      } else { //même chose mais en retirant le bonus
        await item.update({ "system.equipe": false}); //update de l'objet pour le passer en équipé
      };
    }
  }

  //Diminue la quantité d'un objet
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

  //Augmente la quantité d'un objet
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

  //Détail de répartition de l'armure
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
      if (element.type == "arme" && element.system.equipe) {
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
      if (element.type == "arme" && element.system.equipe) {
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

  //Calcul bonus/malus AD + popup
  _bonus_malus_ad() {
    let ad_value = this.actor.system.abilities.ad.value + this.actor.system.abilities.ad.bonus + this.actor.system.abilities.ad.bonus_man;
    let bonus_malus_AD = this.actor.system.abilities.ad.bonus_malus_AD
    let d
    if (this.actor.system.abilities.ad.value!=0 && ad_value<9 && bonus_malus_AD==0){
      d = new Dialog({
        title: "Bonus / Malus d'attaque ou de parade lié à l'Adresse",
        content: `
        <form>
          <label id="bonus_malus_ad">Ton Adresse vient de passer en dessous de 9, mets un malus de -1 en parade ou en attaque.</label><br/>
          <label>Bonus de parade :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormulePRD" value="`+ this.actor.system.abilities.prd.bonus_ad + `">
          <label>Bonus d'attaque :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormuleATT" value="`+ this.actor.system.abilities.att.bonus_ad + `">
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              let bonus_prd = html.find('input[name="inputFormulePRD"').val();
              let bonus_att = html.find('input[name="inputFormuleATT"').val();
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": -1,
                "system.abilities.prd.bonus_ad": bonus_prd,
                "system.abilities.att.bonus_ad": bonus_att
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
          <label id="bonus_malus_ad">Ton Adresse vient de passer au dessus de 12, mets un bonus de 1 en parade ou en attaque.</label><br/>
          <label>Bonus de parade :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormulePRD" value="`+ this.actor.system.abilities.prd.bonus_ad + `">
          <label>Bonus d'attaque :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormuleATT" value="`+ this.actor.system.abilities.att.bonus_ad + `">
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              let bonus_prd = html.find('input[name="inputFormulePRD"').val();
              let bonus_att = html.find('input[name="inputFormuleATT"').val();
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": 1,
                "system.abilities.prd.bonus_ad": bonus_prd,
                "system.abilities.att.bonus_ad": bonus_att
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
          <label id="bonus_malus_ad">Ton Adresse vient de passer au dessus de 12, enlève le malus de -1 en attaque ou parade que tu avais mis, puis mets un bonus de 1 en parade ou en attaque.</label><br/>
          <label>Bonus de parade :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormulePRD" value="`+ this.actor.system.abilities.prd.bonus_ad + `">
          <label>Bonus d'attaque :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormuleATT" value="`+ this.actor.system.abilities.att.bonus_ad + `">
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              let bonus_prd = html.find('input[name="inputFormulePRD"').val();
              let bonus_att = html.find('input[name="inputFormuleATT"').val();
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": 1,
                "system.abilities.prd.bonus_ad": bonus_prd,
                "system.abilities.att.bonus_ad": bonus_att
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
          <label id="bonus_malus_ad">Ton Adresse vient de passer en dessous de 9, enlève le bonus de 1 en attaque ou parade que tu avais mis, puis mets un malus de -1 en parade ou en attaque.</label><br/>
          <label>Bonus de parade :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormulePRD" value="`+ this.actor.system.abilities.prd.bonus_ad + `">
          <label>Bonus d'attaque :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormuleATT" value="`+ this.actor.system.abilities.att.bonus_ad + `">
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              let bonus_prd = html.find('input[name="inputFormulePRD"').val();
              let bonus_att = html.find('input[name="inputFormuleATT"').val();
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": -1,
                "system.abilities.prd.bonus_ad": bonus_prd,
                "system.abilities.att.bonus_ad": bonus_att
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
          <label id="bonus_malus_ad">Ton Adresse vient de passer au dessus de 8, enlève le malus de -1 en attaque ou parade que tu avais mis.</label><br/>
          <label>Bonus de parade :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormulePRD" value="`+ this.actor.system.abilities.prd.bonus_ad + `">
          <label>Bonus d'attaque :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormuleATT" value="`+ this.actor.system.abilities.att.bonus_ad + `">
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              let bonus_prd = html.find('input[name="inputFormulePRD"').val();
              let bonus_att = html.find('input[name="inputFormuleATT"').val();
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": 0,
                "system.abilities.prd.bonus_ad": bonus_prd,
                "system.abilities.att.bonus_ad": bonus_att
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
          <label id="bonus_malus_ad">Ton Adresse vient de passer en dessous de 13, enlève le bonus de 1 en attaque ou parade que tu avais mis.</label><br/>
          <label>Bonus de parade :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormulePRD" value="`+ this.actor.system.abilities.prd.bonus_ad + `">
          <label>Bonus d'attaque :</label><br/>
          <input style="font-size: 15px;" type="text" name="inputFormuleATT" value="`+ this.actor.system.abilities.att.bonus_ad + `">
          <br/><br/>
        </form>
        `,
        buttons: {
          one: {
            label: "C'est fait",
            callback: (html) => {
              let bonus_prd = html.find('input[name="inputFormulePRD"').val();
              let bonus_att = html.find('input[name="inputFormuleATT"').val();
              const actorData = {
                "system.abilities.ad.bonus_malus_AD": 0,
                "system.abilities.prd.bonus_ad": bonus_prd,
                "system.abilities.att.bonus_ad": bonus_att
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

  //Calcul level up + popup
  _level_up() {
    let niveau = this._level()
    let content = `
    <form>
      <label id="level_up">Bravo, tu viens de passer niveau `+niveau+` !!<br/><br/>
      Voila la liste des modifications à apporter.<br/>
      <em>(Attention, ton personnage peut avoir des règles spécifiques !)</em><br/><br/>
        > +1d6 PV ou PA<br/>
      `
    if (niveau%2 == 0){
      content = content + `  > +1 à la force, l'adresse, le courage ou l'intelligence`
    } else {
      content = content + `  > +1 à l'attaque ou la parade`
    }
    if (niveau==3 || niveau==6 || niveau==10) { content = content + `<br/>  > une compétence choisie supplémentaire`}
    if (niveau==5 || niveau==10) { content = content + `<br/>  > une spécialité supplémentaire pour le mage`}
    content = content + `</label>
      <br/><br/>
    </form>
    `
    let d = new Dialog({
      title: "Level UP",
      content: content,
      buttons: {
        one: {
          label: "Ok !",
          callback: (html) => {
          }
        }
      }
    });
    d.render(true);
  }

  //Calcul niveau en fonction de l'XP
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

  //Calcul résistance magique
  _rm() {
    var value = this.actor.system.abilities.cou.value + this.actor.system.abilities.cou.bonus + this.actor.system.abilities.cou.bonus_man;
    value = value + this.actor.system.abilities.int.value + this.actor.system.abilities.int.bonus  + this.actor.system.abilities.int.bonus_man;
    value = value + this.actor.system.abilities.fo.value + this.actor.system.abilities.fo.bonus + this.actor.system.abilities.fo.bonus_man;
    value = Math.round(value / 3);
    return value;
  }

  //Calcul esquive
  _esq() {
    var val1 = this.actor.system.abilities.ad.value + this.actor.system.abilities.ad.bonus + this.actor.system.abilities.ad.bonus_man;
    var val2 = this.actor.system.attributes.pr.value + this.actor.system.attributes.pr.bonus + this.actor.system.attributes.pr.bonus_man - this.actor.system.attributes.pr.nb_pr_ss_encombrement
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

  //Calcul magie physique
  _mphy() {
    var value = this.actor.system.abilities.ad.value + this.actor.system.abilities.ad.bonus + this.actor.system.abilities.ad.bonus_man;
    value = value + this.actor.system.abilities.int.value + this.actor.system.abilities.int.bonus  + this.actor.system.abilities.int.bonus_man;
    value = Math.ceil(value / 2);
    return value;
  }

  //Calcul magie psychique
  _mpsy() {
    var value = this.actor.system.abilities.cha.value + this.actor.system.abilities.cha.bonus + this.actor.system.abilities.cha.bonus_man;
    value = value - this.actor.system.abilities.cha.ignorempsy;
    value = value + this.actor.system.abilities.int.value + this.actor.system.abilities.int.bonus + this.actor.system.abilities.int.bonus_man;
    value = Math.ceil(value / 2);
    return value;
  }

  //Mise à jour des statistiques au chargement de la page
  _update_stats() {
    let UpdatedData = {}
    UpdatedData.system = {}
    UpdatedData.system.attributes = {}
    UpdatedData.system.abilities = {}
    UpdatedData.system.attributes.sac={}
    UpdatedData.system.attributes.sac.max=0
    UpdatedData.system.attributes.bourse={}
    UpdatedData.system.attributes.bourse.max=0
    UpdatedData.system.attributes.pr={}
    UpdatedData.system.attributes.pr.bonus=0
    UpdatedData.system.attributes.pr.nb_pr_ss_encombrement=0
    UpdatedData.system.attributes.prm={}
    UpdatedData.system.attributes.prm.bonus=0
    UpdatedData.system.attributes.att_arme_jet={}
    UpdatedData.system.attributes.att_arme_jet.bonus=0
    UpdatedData.system.attributes.att_arme_jet.degat=0
    UpdatedData.system.attributes.rm={}
    UpdatedData.system.attributes.rm.bonus=0
    UpdatedData.system.attributes.mvt={}
    UpdatedData.system.attributes.mvt.value=0
    UpdatedData.system.attributes.mphy={}
    UpdatedData.system.attributes.mphy.bonus=0
    UpdatedData.system.attributes.mpsy={}
    UpdatedData.system.attributes.mpsy.bonus=0
    UpdatedData.system.attributes.esq={}
    UpdatedData.system.attributes.esq.bonus=0
    UpdatedData.system.abilities.cou={}
    UpdatedData.system.abilities.cou.bonus=0
    UpdatedData.system.abilities.int={}
    UpdatedData.system.abilities.int.bonus=0
    UpdatedData.system.abilities.cha={}
    UpdatedData.system.abilities.cha.bonus=0
    UpdatedData.system.abilities.cha.ignorempsy=0
    UpdatedData.system.abilities.ad={}
    UpdatedData.system.abilities.ad.bonus=0
    UpdatedData.system.abilities.fo={}
    UpdatedData.system.abilities.fo.bonus=0
    UpdatedData.system.abilities.att={}
    UpdatedData.system.abilities.att.bonus=parseInt(this.actor.system.abilities.att.bonus_ad)
    UpdatedData.system.abilities.att.degat=0
    UpdatedData.system.abilities.prd={}
    UpdatedData.system.abilities.prd.bonus=parseInt(this.actor.system.abilities.prd.bonus_ad)

    for (let item of this.actor.items){
      if (item.system.equipe==true) {
        if (this.actor.type=="character"){
          //Maj sac et bourse charge max
          if (item.type=="sac"){
            if (item.system.type=="sac à dos") {
              UpdatedData.system.attributes.sac.max = UpdatedData.system.attributes.sac.max + parseFloat(item.system.place)
            }
            if (item.system.type=="bourse") {
              UpdatedData.system.attributes.bourse.max = UpdatedData.system.attributes.bourse.max + parseFloat(item.system.place)
            }
          }

          //Maj dégat cac (si c'est une arme de cac, on ne modifie pas car le bonus/malus ne vaut que pour elle)
          if (((item.type == "arme" && item.system.arme_cac == false) || (item.type != "arme")) && item.system.degat_arme_cac != undefined && item.system.degat_arme_cac != "-") {
            if (item.system.degat_arme_cac.toString().substr(0, 1) == "-" || item.system.degat_arme_cac.toString().substr(0, 1) == "+") {
              UpdatedData.system.abilities.att.degat = UpdatedData.system.abilities.att.degat + item.system.degat_arme_cac
            } else {
              UpdatedData.system.abilities.att.degat = UpdatedData.system.abilities.att.degat + "+" + item.system.degat_arme_cac
            }
          }

          //Maj att_arme_jet et degat_arme_jet
          if (((item.type == "arme" && item.system.arme_distance == false) || (item.type != "arme")) && item.system.att_arme_jet != undefined && item.system.att_arme_jet != "-") {
            UpdatedData.system.attributes.att_arme_jet.bonus = UpdatedData.system.attributes.att_arme_jet.bonus + parseInt(item.system.att_arme_jet)
          }
          if (((item.type == "arme" && item.system.arme_distance == false) || (item.type != "arme")) && item.system.att_arme_jet != undefined && item.system.att_arme_jet != "-") {
            if (item.system.degat_arme_jet.toString().substr(0, 1) == "-" || item.system.degat_arme_jet.toString().substr(0, 1) == "+") {
              UpdatedData.system.attributes.att_arme_jet.degat = UpdatedData.system.attributes.att_arme_jet.degat + item.system.degat_arme_jet
            } else {
              UpdatedData.system.attributes.att_arme_jet.degat = UpdatedData.system.attributes.att_arme_jet.degat + "+" + item.system.degat_arme_jet
            }
          }
          
          //Maj Mvt
          if (item.system.mvt != undefined && item.system.mvt != "-") {
            UpdatedData.system.attributes.mvt.value = UpdatedData.system.attributes.mvt.value + parseInt(item.system.mvt)
          }

        }      

        //Maj PR bonus
        if (item.system.pr != undefined && item.system.pr != "-") {
          UpdatedData.system.attributes.pr.bonus = UpdatedData.system.attributes.pr.bonus + parseInt(item.system.pr)
        }
        if(item.system.nb_pr_ss_encombrement != undefined  && item.system.nb_pr_ss_encombrement != "-") {
          UpdatedData.system.attributes.pr.nb_pr_ss_encombrement = UpdatedData.system.attributes.pr.nb_pr_ss_encombrement + parseInt(item.system.nb_pr_ss_encombrement)
        }

        //Maj PRM bonus
        if (item.system.prm != undefined && item.system.prm != "-") {
          UpdatedData.system.attributes.prm.bonus = UpdatedData.system.attributes.prm.bonus + parseInt(item.system.prm)
        }

        //Maj RM bonus
        if (item.system.rm != undefined && item.system.rm != "-") {
          UpdatedData.system.attributes.rm.bonus = UpdatedData.system.attributes.rm.bonus + parseInt(item.system.rm)
        }

        //Maj mphy bonus
        if (item.system.mphy != undefined && item.system.mphy != "-") {
          UpdatedData.system.attributes.mphy.bonus = UpdatedData.system.attributes.mphy.bonus + parseInt(item.system.mphy)
        }

        //Maj mpsy bonus
        if (item.system.mpsy != undefined && item.system.mpsy != "-") {
          UpdatedData.system.attributes.mpsy.bonus = UpdatedData.system.attributes.mpsy.bonus + parseInt(item.system.mpsy)
        }
        
        //Maj esquive bonus
        if (item.system.esq != undefined && item.system.esq != "-") {
          UpdatedData.system.attributes.esq.bonus = UpdatedData.system.attributes.esq.bonus + parseInt(item.system.esq)
        }

        //Maj cou bonus
        if (item.system.cou != undefined && item.system.cou != "-") {
          UpdatedData.system.abilities.cou.bonus = UpdatedData.system.abilities.cou.bonus + parseInt(item.system.cou)
        }

        //Maj int bonus
        if (item.system.int != undefined && item.system.int != "-") {
          UpdatedData.system.abilities.int.bonus = UpdatedData.system.abilities.int.bonus + parseInt(item.system.int)
        }
        //Maj cha bonus
        if (item.system.cha != undefined && item.system.cha != "-") {
          UpdatedData.system.abilities.cha.bonus = UpdatedData.system.abilities.cha.bonus + parseInt(item.system.cha)
        }
        if (item.system.cha_ignorempsy != undefined && item.system.cha_ignorempsy != "-") {
          UpdatedData.system.abilities.cha.ignorempsy = UpdatedData.system.abilities.cha.ignorempsy + parseInt(item.system.cha_ignorempsy)
        }

        //Maj ad bonus
        if (item.system.ad != undefined && item.system.ad != "-") {
          UpdatedData.system.abilities.ad.bonus = UpdatedData.system.abilities.ad.bonus + parseInt(item.system.ad)
        }

        //Maj fo bonus
        if (item.system.fo != undefined && item.system.fo != "-") {
          UpdatedData.system.abilities.fo.bonus = UpdatedData.system.abilities.fo.bonus + parseInt(item.system.fo)
        }

        //Maj att bonus (les armes ont un bonus d'attaque qui n'impacte que les jets avec cet objet)
        if ((item.type == "arme" && item.system.arme_cac == false || item.type != "arme") && item.system.att != undefined && item.system.att != "-") {
          UpdatedData.system.abilities.att.bonus = UpdatedData.system.abilities.att.bonus + parseInt(item.system.att)
        }

        //Maj prd bonus (une arme ou un bouclier ont un bonus de PR qui n'impact que les jets avec cet objet)
        if (((item.type=="arme" && item.system.arme_cac == false && item.system.prbouclier == false) || item.type != "arme") && item.system.prd != undefined && item.system.prd != "-") {
          UpdatedData.system.abilities.prd.bonus = UpdatedData.system.abilities.prd.bonus + parseInt(item.system.prd)
        }
      }
    }
    return UpdatedData
  }

  //Popup qui donne des infos sur les objets équipés
  _getStatsEquipe(actor) {
    let name = []
    let change = []

    for (let item of actor.items) {
      if (item.system.equipe==true) {
        let addName = ""
        let addChange = ""
        let signe = ""
        if (item.system.cou!=0 && item.system.cou!="" && item.system.cou!="0" && item.system.cou!="-" && item.system.cou!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.cou.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Courage "+ signe + item.system.cou
        }
        if (item.system.int!=0 && item.system.int!="" && item.system.int!="0" && item.system.int!="-" && item.system.int!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.int.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Intelligence "+signe+item.system.int
        }
        if (item.system.cha!=0 && item.system.cha!="" && item.system.cha!="0" && item.system.cha!="-" && item.system.cha!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.cha.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Charisme "+signe+item.system.cha
        }
        if (item.system.ad!=0 && item.system.ad!="" && item.system.ad!="0" && item.system.ad!="-" && item.system.ad!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.ad.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Adresse "+signe+item.system.ad
        }
        if (item.system.fo!=0 && item.system.fo!="" && item.system.fo!="0" && item.system.fo!="-" && item.system.fo!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.fo.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Force "+signe+item.system.fo
        }
        if (item.system.pr!=0 && item.system.pr!="" && item.system.pr!="0" && item.system.pr!="-" && item.system.pr!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.pr.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Protection "+signe+item.system.pr
        }
        if (item.system.prm!=0 && item.system.prm!="" && item.system.prm!="0" && item.system.prm!="-" && item.system.prm!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.prm.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Protection magique"+signe+item.system.prm
        }
        if (item.system.mvt!=0 && item.system.mvt!="" && item.system.mvt!="0" && item.system.mvt!="-" && item.system.mvt!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.mvt.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Déplacement "+signe+item.system.mvt+"%"
        }
        if (item.system.rm!=0 && item.system.rm!="" && item.system.rm!="0" && item.system.rm!="-" && item.system.rm!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.rm.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Résistance magique "+signe+item.system.rm
        }
        if (item.system.mphy!=0 && item.system.mphy!="" && item.system.mphy!="0" && item.system.mphy!="-" && item.system.mphy!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.mphy.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Magie physique "+signe+item.system.mphy
        }
        if (item.system.mpsy!=0 && item.system.mpsy!="" && item.system.mpsy!="0" && item.system.mpsy!="-" && item.system.mpsy!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.mpsy.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Magie psychique "+signe+item.system.mpsy
        }
        if (item.system.esq!=0 && item.system.esq!="" && item.system.esq!="0" && item.system.esq!="-" && item.system.esq!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.esq.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Esquive "+signe+item.system.esq
        }
        if (item.system.att!=0 && item.system.att!="" && item.system.att!="0" && item.system.att!="-" && item.system.att!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.att.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Attaque au contact "+signe+item.system.att
        }
        if (item.system.degat_arme_cac!=0 && item.system.degat_arme_cac!="" && item.system.degat_arme_cac!="0" && item.system.degat_arme_cac!="-" && item.system.degat_arme_cac!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.degat_arme_cac.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Dégat au contact "+signe+item.system.degat_arme_cac
        }
        if (item.system.prd!=0 && item.system.prd!="" && item.system.prd!="0" && item.system.prd!="-" && item.system.prd!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.prd.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Parade "+signe+item.system.prd
        }
        if (item.system.att_arme_jet!=0 && item.system.att_arme_jet!="" && item.system.att_arme_jet!="0" && item.system.att_arme_jet!="-" && item.system.att_arme_jet!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.att_arme_jet.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Attaque à distance "+signe+item.system.att_arme_jet
        }
        if (item.system.degat_arme_jet!=0 && item.system.degat_arme_jet!="" && item.system.degat_arme_jet!="0" && item.system.degat_arme_jet!="-" && item.system.degat_arme_jet!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.degat_arme_jet.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Dégat à distance "+signe+item.system.degat_arme_jet
        }
        if (item.system.cha_ignorempsy!=0 && item.system.cha_ignorempsy!="" && item.system.cha_ignorempsy!="0" && item.system.cha_ignorempsy!="-" && item.system.cha_ignorempsy!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.cha_ignorempsy.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Charisme ignoré dans le calcul de la magie psychique "+signe+item.system.cha_ignorempsy
        }
        if (item.system.nb_pr_ss_encombrement!=0 && item.system.nb_pr_ss_encombrement!="" && item.system.nb_pr_ss_encombrement!="0" && item.system.nb_pr_ss_encombrement!="-" && item.system.nb_pr_ss_encombrement!=null) {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+", "}
          if (item.system.nb_pr_ss_encombrement.toString().substr(0,1)=="-") {signe=""} else {signe="+"}
          addChange=addChange+"Protection ignorée pour le calcul des déplacements "+signe+item.system.nb_pr_ss_encombrement
        }
        if (item.system.autre!="") {
          if (addName=="") {addName=item.name}
          if (addChange!="") {addChange=addChange+"<br/>"}
          addChange=addChange+"<u>Information importante : "+item.system.autre+"</u>"
        }

        if (addName!="") {
          name.push(addName)
          change.push(addChange)
        }
      }
    }
    let i = 0
    let content = "<form>"
    for (let obj of name) {
      if (i==0) {
        content = content + "<strong>" + name[i] + " :</strong><br/>" + change[i]
      } else {
        content = content + "<br/><strong>" + name[i] + " :</strong><br/>" + change[i]
      }
      i++
    }
    if (name.length==0){content=content+"Aucun objet ne donne de bonus ou malus."}
    content = content+"</form>"
    let d = new Dialog({
      title: "Bonus / Malus issus des objets équipés",
      content: content,
      buttons: {
      }
    });
    d.render(true);
  }

}


