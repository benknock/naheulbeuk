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
    return `${path}/item-${this.item.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    //modif de l'image de base
    if (context.item.system.img != "") {
      context.item.update({ "img": context.item.system.img, "system.img": "" });
    }
    if (this.object.system.desccacher!=undefined){context.enrichedDesccacher = await TextEditor.enrichHTML(this.object.system.desccacher, {async: true});}
    if (this.object.system.description!=undefined){context.enrichedDescription = await TextEditor.enrichHTML(this.object.system.description, {async: true});}
    if (this.object.system.note2!=undefined){context.enrichedNote2 = await TextEditor.enrichHTML(this.object.system.note2, {async: true});}
    if (this.object.system.attributes!=undefined){
      if (this.object.system.attributes.desc!=undefined){context.enrichedDesc = await TextEditor.enrichHTML(this.object.system.attributes.desc, {async: true});}
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
      //this.form.ondragstart = (event) => this._onDragStart(event);
      this.form.ondrop = (event) => this._onDrop(event);
    }

    // Suppression d'un objet d'un conteneur
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item"); //on récupère l'ID de l'objet à supprimer
      const items = this.object.system.items //on récupère la liste des objets contenu par le conteneur
      let itemFind
      for (let item of items){ //on cherche l'objet à supprimer
        if (item._id==li.data("itemId")){itemFind=item}
      }
      const index = items.indexOf(itemFind) //on sauve son index
      if (index > -1) {items.splice(index,1)} // on retire l'objet
      this.object.update({"system.items":items}) // on met à jour le conteneur
    });

    // Enlever un objet d'un conteneur
    html.find('.item-out').click(ev => {
      const li = $(ev.currentTarget).parents(".item"); //on récupère l'ID de l'objet à supprimer
      const items = this.object.system.items //on récupère la liste des objets contenu par le conteneur
      let itemFind
      for (let item of items){ //on cherche l'objet à supprimer
        if (item._id==li.data("itemId")){itemFind=item}
      }
      const index = items.indexOf(itemFind) //on sauve son index
      if (index > -1) {items.splice(index,1)} // on retire l'objet
      this.object.update({"system.items":items}) // on met à jour le conteneur
      let new_Item = duplicate(itemFind)
      new_Item.system.conteneur={}
      if (this.object.parent!=null){
        Item.create(new_Item, { parent: this.object.parent });
      } else {
        Item.create(new_Item);
      }
      
    });

    // Edition d'un objet de conteneur
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item"); //on sauve l'ID de l'objet à éditer
      const items = this.object.system.items //On récupère la liste des objets du conteneur
      //on cherche l'objet à éditer dans la liste
      let itemFind = items.find(entry => entry._id===li.data("itemId"));
      let new_Item = duplicate(itemFind)
      let cont_id={}
      cont_id._id=this.object._id
      new_Item.system.conteneur=cont_id
      let itemFinal = new Item(new_Item)
      itemFinal.sheet.render(true)
    });


    // Roll handlers, click handlers, etc. would go here.
    //PCH afficher ou masquer les stats
    html.find('.masquerstats').click(ev => {
      if (game.users.current.role==4){
        let nom = this.object.name
        this.object.update({ 
          "system.cacher": !this.object.system.cacher,
          "name" : this.object.system.nomcacher,
          "system.nomcacher": nom,
        });
      }
    })
    //PCH afficher ou masquer les épreuves avancées sur un objets
    html.find('.epreuves').click(ev => {
      if (this.object.system.epreuvecustom == true) {
        this.object.update({ "system.epreuvecustom": false });
      } else {
        this.object.update({ "system.epreuvecustom": true });
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
      if (compchoix == "system.choix") {
        dataset = {
          "system.choix": true,
          "system.gagne": false,
          "system.base": false
        }
      }
      if (compchoix == "system.gagne") {
        dataset = {
          "system.choix": false,
          "system.gagne": true,
          "system.base": false
        }
      }
      if (compchoix == "system.base") {
        dataset = {
          "system.choix": false,
          "system.gagne": false,
          "system.base": true
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
      if (this.object.type=="conteneur"){ //On vérifie qu'on est bien sur un conteur
        const itemData = duplicate(item); //On sauvegarde les datas de l'objet drop
        if (itemData.system.stockage!=undefined){ //On vérifie que c'est un objet qu'on peut drag and drop dans un conteneur
          if (item.system.equipe==true){ //on vérifie que l'objet n'est pas équipé
            ui.notifications.error("L'objet ne doit pas être équipé/activé pour aller dans un conteneur.");
          } else {
            // on sauvegarde l'ID du conteneur dans l'objet contenu
            let cont_id={} 
            cont_id._id=this.object._id
            itemData.system.conteneur=cont_id
            //On génère un ID unique
            let j = 100
            let item_id="pch"+itemData._id.substr(3,7)+"PCH"+j
            while (this.object.system.items.find(entry => entry._id===item_id)!=undefined){
              j++
              item_id="pch"+itemData._id.substr(3,7)+"PCH"+j
            }
            itemData._id=item_id
            itemData.system.equipe=false
            //on met à jour la liste d'objet
            let itemsFinal = this.object.system.items
            itemsFinal.push(itemData)
            //on update la liste d'objet du conteneur
            this.object.update({"system.items":itemsFinal})
            item.delete()
          }
        }
      }
    });
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

    // !!!!!!!!!!!!!!!!!!! petite modif pour mettre à jour le conteneur
    if (this.object.system.conteneur==undefined){
      // Trigger the object update
      try {
        await this._updateObject(event, formData);
      }
      catch (err) {
        console.error(err);
        closeForm = false;
        this._state = priorState;
      }
    } else {
      if (this.object.system.conteneur._id==undefined){
        // Trigger the object update
        try {
          await this._updateObject(event, formData);
        }
        catch (err) {
          console.error(err);
          closeForm = false;
          this._state = priorState;
        }
      } else {
        var conteneur_data=this.object.system.conteneur //On récupère les data du conteneur qui le contient
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
        const items = conteneurAupdate.system.items //on sauve la liste des objets
        let itemFind = items.find(entry => entry._id===this.object._id);
        const index = items.indexOf(itemFind) // On retire l'objet trouvé (puisqu'on vient de le mettre à jour)
        if (index > -1) {items.splice(index,1)}
        let new_ItemData=duplicate(this.object)

        //Mettre à jour newItemData en fonction de formData puis pousser newItemData dans items
        let key_new_ItemData=Object.keys(new_ItemData)
        let key_new_ItemData_Datas=Object.keys(new_ItemData.system)
        let key_formData=Object.keys(formData)
        let value_formData=Object.values(formData)
        let i = 0
        for (let key of key_new_ItemData){
            for (let key2 of key_formData){
              if (key2.substring(0,7)=="system." && key=="system") {
                let dataForm = key2.substring(7,(key2.length))
                for (let key3 of key_new_ItemData_Datas){
                  if (key3==dataForm){
                    new_ItemData.system[key3]=value_formData[i]
                  }
                }
              } else if (key==key2){
                  new_ItemData[key]=value_formData[i]
              }
              i++
            }
            i=0
        }
        items.push(new_ItemData) //et on le remplace par l'objet mis à jour
        conteneurAupdate.update({"system.items":items})
      }
    }
    //fin de la petite modif pour mettre à jour le conteneur



    // Restore flags and optionally close the form
    this._submitting = false;
    if ( preventRender ) this._state = priorState;
    if ( closeForm ) await this.close({submit: false, force: true});

    return formData;
  }
}
