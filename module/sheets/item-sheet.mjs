/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class NaheulbeukItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["naheulbeuk", "sheet", "item"],
      width: 600,
      height: 650,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/naheulbeuk/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item.data;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;

    //modif de l'image de base
    if (context.item.data.data.img != "") {
      context.item.update({ "img": context.item.data.data.img, "data.img": "" });
    }

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  async activateListeners(html) {
    super.activateListeners(html);
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    //Si l'objet est un conteneur
    if (this.object.type == 'conteneur') {
      //on permet le Drag and Drop depuis l'objet (DragStart) et vers l'objet (Drop)
      this.form.ondragstart = (event) => this._onDragStart(event);
      this.form.ondrop = (event) => this._onDrop(event);
      //On vérifie qu'un acteur "system est présent"
      let actorSystem = game.actors.find(entry => entry.name==="system");
      //S'il n'y en a pas, on dit qu'il faut le créer
      if (actorSystem==undefined){ui.notifications.error('Créer l\'acteur de type NPC avec le nom "system" pour que les conteneurs fonctionnent.');}
      
    }

    // Suppression d'un objet d'un conteneur
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item"); //on récupère l'ID de l'objet à supprimer
      const items = this.object.data.data.items //on récupère la liste des objets contenu par le conteneur
      let itemFind
      for (let item of items){ //on cherche l'objet à supprimer
        if (item._id==li.data("itemId")){itemFind=item}
      }
      const index = items.indexOf(itemFind) //on sauve son index
      if (index > -1) {items.splice(index,1)} // on retire l'objet
      this.object.update({"data.items":items}) // on met à jour le conteneur
    });

    // Edition d'un objet de conteneur
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item"); //on sauve l'ID de l'objet à éditer
      var ownerSystem = game.actors.find(entry => entry.name==="system");
      if (ownerSystem!=undefined) {
        for (let item of ownerSystem.items){ //On supprime tous les objets de cet acteur, pour éviter l'accumulation inutile
          item.delete();
        }
        const items = this.object.data.data.items //On récupère la liste des objets du conteneur
        //on cherche l'objet à éditer dans la liste
        let itemFind = items.find(entry => entry._id===li.data("itemId"));
        const index = items.indexOf(itemFind) //on sauve son index
        if (index > -1) {items.splice(index,1)} //on l'enlève de la liste des objets contenu
        Item.create(itemFind, { parent: ownerSystem }).then (ev =>{ //on crée une copie de l'objet à éditer sur l'objet
          const itemActor = ev //On récupère l'objet correspondant 
          const newitemData = ev.data//On sauve l'objet créé sur l'acteur à l'étape précédente
          const data = {}
          data._id=this.object.data._id
          itemActor.update({"data.conteneur":data})//On sauvegarde dans son attribut "conteneur" le conteneur auquel il est lié
          items.push(newitemData) //On rajoute ce nouvel objet à la liste des objets du conteneur précédement sauvegardés
          this.object.update({"data.items":items})//on met à jour le conteneur
          itemActor.sheet.render(true)//on affiche la fiche de l'objet créé dans le conteneur
          //  IL SERA MIS A JOUR PAR LA SURCHARGE DE _onSubmit
        })
      }
    });


    // Roll handlers, click handlers, etc. would go here.
    //PCH afficher ou masquer les stats
    html.find('.masquerstats').click(ev => {
      if (game.users.current.role==4){
        let nom = this.object.data.name
        this.object.update({ 
          "data.cacher": !this.object.data.data.cacher,
          "name" : this.object.data.data.nomcacher,
          "data.nomcacher": nom,
        });
      }
    })
    //PCH afficher ou masquer les épreuves avancées sur un objets
    html.find('.epreuves').click(ev => {
      if (this.object.data.data.epreuvecustom == true) {
        this.object.update({ "data.epreuvecustom": false });
      } else {
        this.object.update({ "data.epreuvecustom": true });
      }
    });

    //PCH afficher ou masquer le champs caché
    html.find('.hideItem').click(ev => {
      if (document.getElementById("hideItem").style.display == "none") {
        document.getElementById("hideItem").style.display = "block"
      } else {
        document.getElementById("hideItem").style.display = "none"
      }
    });

    //PCH rajout d'un roll custom avec plus d'options, et d'un roll avec fenêtre pour les inputs
    html.find('.rollable2').click(this._onRollCustom.bind(this));

    //PCH afficher ou masquer la catégorie d'une arme/armure
    html.find('.hidecategorie').dblclick(ev => {
      if (document.getElementById("hidecategorie").style.display == "none") {
        document.getElementById("hidecategorie").style.display = "block"
      } else {
        document.getElementById("hidecategorie").style.display = "none"
      }
    });

    //PCH permet d'avoir un choix de type de compétence unique
    html.find('.majcomp').click(ev => {
      var compchoix = ev.currentTarget.dataset.name
      var dataset
      if (compchoix == "data.choix") {
        dataset = {
          "data.choix": true,
          "data.gagne": false,
          "data.base": false
        }
      }
      if (compchoix == "data.gagne") {
        dataset = {
          "data.choix": false,
          "data.gagne": true,
          "data.base": false
        }
      }
      if (compchoix == "data.base") {
        dataset = {
          "data.choix": false,
          "data.gagne": false,
          "data.base": true
        }
      }
      this.object.update(dataset)
    });
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
            });
          });
        });
      }
    }
  }
  
  //Création de la fonction pour le drop d'un objet dans le conteneur
  _onDrop(event) {
    event.preventDefault();
    if (!this.options.editable) return false;
    // Get dropped data
    let data;
    try {
        data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
        return false;
    }
    if (!data) return false;

    // Case 1 - Dropped Item
    if (data.type === "Item") {
        return this._onDropItem(event, data);
    }
  }

  //Action qui suit le drop de l'objet
  async _onDropItem(event, data) {
    Item.fromDropData(data).then(item => {
      if (this.object.data.type=="conteneur"){ //On vérifie qu'on est bien sur un conteur
        const itemData = duplicate(item.data); //On sauvegarde les datas de l'objet drop
        if (itemData.data.stockage!=undefined){ //On vérifie que c'est un objet qu'on peut drag and drop dans un conteneur
          //On cherche l'acteur système qui gère les objets des conteneurs
          var ownerSystem = game.actors.find(entry => entry.name==="system");
          Item.create(itemData, { parent: ownerSystem }).then (ev =>{ //On crée l'objet sur le conteneur
            let newitemData = ownerSystem.data.items._source[ownerSystem.data.items._source.length-1] //On récupère son id...
            const itemActor = ownerSystem.items.get(newitemData._id);//...pour pouvoir récupérer l'objet
            itemActor.update({"data.conteneur":this.object.data})//On met à jour son conteneur associé
            let itemsFinal = this.object.data.data.items //On stock la liste des objets contenus par le conteneur
            itemsFinal.push(newitemData) // On rajoute le nouvel objet drop
            this.object.update({"data.items":itemsFinal}) // On met à jour le conteneur
          })
        }
      }
    });
  }

  //Création de la fonction lorsqu'on drag l'objet en dehors du conteneur
  _onDragStart(event) {
    let itemDatas=this.object.data.data.items //On stock la liste des objets contenus par le conteneur
    // On cherche l'objet dans la liste précédente
    let itemFind = itemDatas.find(entry => entry._id===event.originalTarget.dataset.itemId);
    if ( event.target.classList.contains("content-link") ) return;
    let dragData = {} //On crée les data pour la création la ou on va drop
    dragData.type = "Item";
    dragData.data = itemFind;
    // On initie le drop avec la création de l'objet
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

    //copié collé du _onSubmit présent dans foundry.js avec une petite modif (identifiée plus bas) pour mettre à jour un conteneur
  //permet la mise à jour d'un objet contenu par un conteneur
  async _onSubmit(event, {updateData=null, preventClose=false, preventRender=false}={}) {
    event.preventDefault();

    // Prevent double submission
    const states = this.constructor.RENDER_STATES;
    if ( (this._state === states.NONE) || !this.isEditable || this._submitting ) return false;
    this._submitting = true;

    // Process the form data
    const formData = this._getSubmitData(updateData);

    // Handle the form state prior to submission
    let closeForm = this.options.closeOnSubmit && !preventClose;
    const priorState = this._state;
    if ( preventRender ) this._state = states.RENDERING;
    if ( closeForm ) this._state = states.CLOSING;

    // Trigger the object update
    try {
      await this._updateObject(event, formData);
    }
    catch (err) {
      console.error(err);
      closeForm = false;
      this._state = priorState;
    }
    // Restore flags and optionally close the form
    this._submitting = false;
    if ( preventRender ) this._state = priorState;
    if ( closeForm ) await this.close({submit: false, force: true});

    // !!!!!!!!!!!!!!!!!!! petite modif pour mettre à jour le conteneur
    if (this.object.data.data.conteneur!=undefined){ //Si l'objet à mettre à jour vient peut être ajouté à un conteneur...
      if (this.object.data.data.conteneur._id!=undefined){ //... et que ce conteneur n'est pas vide --> L'objet est donc lié à un conteneur
        var conteneur_data=this.object.data.data.conteneur //On récupère les data du conteneur qui le contient
        var ownerConteneur = {}
        for (let actor of game.actors){
          if (actor.items.get(conteneur_data._id)!=undefined){ownerConteneur=actor}
        }
        let conteneurAupdate 
        if (ownerConteneur.items!=undefined){ //Si le conteneur est bien sur un acteur
          conteneurAupdate = ownerConteneur.items.get(conteneur_data._id) //On récupère l'objet associé
        } else {
          //Sinon on prend l'objet dans les objets de base de foundry
          conteneurAupdate = game.items.get(conteneur_data._id)
        }
        const items = conteneurAupdate.data.data.items //on sauve la liste des objets
        let itemFind = items.find(entry => entry._id===this.object.data._id);
        const index = items.indexOf(itemFind) // On retire l'objet trouvé (puisqu'on vient de le mettre à jour)
        if (index > -1) {items.splice(index,1)}
        items.push(this.object.data) //et on le remplace par l'objet mis à jour
        conteneurAupdate.update(({"data.items":items}))
      }
    }
    //fin de la petite modif pour mettre à jour le conteneur

    return formData;
  }
}
