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
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.
    //PCH afficher ou masquer les épreuves avancées sur un objets
    html.find('.epreuves').click(ev => {
      if (super.getData().item.data.data.epreuvecustom == true) {
        super.getData().item.update({ "data.epreuvecustom": false });
      } else {
        super.getData().item.update({ "data.epreuvecustom": true });
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
      super.getData().item.update(dataset)
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
}
