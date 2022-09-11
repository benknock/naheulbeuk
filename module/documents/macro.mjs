export class Macros {
  /**
   * @name customRoll
   * @description
   * 
   * @returns 
   */

  static customRoll = function (dice, diff) {
    if (game.naheulbeuk.macros.getSpeakersActor() == null) { return }
    const actorSource = game.naheulbeuk.macros.getSpeakersActor()
    dice = dice.replace(/ /g, "");
    diff = diff.replace(/ /g, "");
    let d = new Dialog({
      title: "Lancer custom",
      content: `
        <em style="font-size: 15px;">Raccourcis :</em>
        <br/>
        <em style="font-size: 15px;">@cou @int @cha @ad @fo @att @prd @lvl @pr @prm @esq @rm @mphy @mpsy @att-distance @bonusint</em>
        <hr>
        <label style="font-size: 15px;">Formule :</label>
        <input style="font-size: 15px;" type="text" name="inputFormule" value="`+ dice + `">
        <br/><br/>
        <label style="font-size: 15px;">Difficulté :</label>
        <input style="font-size: 15px;" type="text" name="inputDiff" value="`+ diff + `"></li>
        <br/><br/>
        `,
      buttons: {
        one: {
          label: "Lancer custom",
          callback: (html) => {
            let dice = html.find('input[name="inputFormule"').val();
            let diff = html.find('input[name="inputDiff"').val();
            const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
            if (dice.substr(0, 6) == "cible:" || diff.substr(0, 6) == "cible:") {
              if (game.naheulbeuk.macros.getSpeakersTarget() == null) { return }
            }
            if (dice.substr(0, 6) == "cible:") {
              dice = game.naheulbeuk.macros.replaceAttr(dice, game.naheulbeuk.macros.getSpeakersTarget());
            } else {
              dice = game.naheulbeuk.macros.replaceAttr(dice, actorSource);
            }
            if (diff.substr(0, 6) == "cible:") {
              diff = game.naheulbeuk.macros.replaceAttr(diff, game.naheulbeuk.macros.getSpeakersTarget());
            } else {
              diff = game.naheulbeuk.macros.replaceAttr(diff, actorSource);
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
                    name: "Lancer custom"
                  }
                  renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                    r.toMessage({
                      user: game.user.id,
                      flavor: msgFlavor,
                      speaker: ChatMessage.getSpeaker({ actor: actorSource })
                    });
                  });
                } else {
                  diff = new Roll(diff);
                  diff.roll({ "async": true }).then(diff => {
                    result = Math.abs(diff.total - r.total);
                    if (r.total > diff.total) { reussite = "Echec !   " };
                    tplData = {
                      diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                      name: "Lancer custom"
                    };
                    renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                      r.toMessage({
                        user: game.user.id,
                        flavor: msgFlavor,
                        speaker: ChatMessage.getSpeaker({ actor: actorSource })
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

  // remplace @lvl @ad... ds un string
  static replaceAttr = function (expr, actor) {
    var expr = expr
    if (actor.data.type == "character") {
      const ad = actor.data.data.abilities.ad.value + actor.data.data.abilities.ad.bonus;
      const lancer = actor.data.data.attributes.lancerarme.value + actor.data.data.attributes.lancerarme.bonus + ad;
      const bonusint = Math.max(0, (actor.data.data.abilities.int.value + actor.data.data.abilities.int.bonus) - 12)
      expr = expr.replace(/@att-distance/g, lancer);
      expr = expr.replace(/@bonusint/g, bonusint);
    }
    const pr = actor.data.data.attributes.pr.value + actor.data.data.attributes.pr.bonus + actor.data.data.attributes.pr.bonusSsEncombrement;
    const prm = actor.data.data.attributes.prm.value + actor.data.data.attributes.prm.bonus;
    const cou = actor.data.data.abilities.cou.value + actor.data.data.abilities.cou.bonus;
    const int = actor.data.data.abilities.int.value + actor.data.data.abilities.int.bonus;
    const cha = actor.data.data.abilities.cha.value + actor.data.data.abilities.cha.bonus;
    const ad = actor.data.data.abilities.ad.value + actor.data.data.abilities.ad.bonus;
    const fo = actor.data.data.abilities.fo.value + actor.data.data.abilities.fo.bonus;
    const att = actor.data.data.abilities.att.value + actor.data.data.abilities.att.bonus;
    const prd = actor.data.data.abilities.prd.value + actor.data.data.abilities.prd.bonus;
    const mphy = actor.data.data.attributes.mphy.value;
    const mpsy = actor.data.data.attributes.mpsy.value;
    const rm = actor.data.data.attributes.rm.value + actor.data.data.attributes.rm.bonus;
    const esq = actor.data.data.attributes.esq.value + actor.data.data.attributes.esq.bonus;
    const lvl = actor.data.data.attributes.level.value;
    var bonusfo = "";
    if ((actor.data.data.abilities.fo.value + actor.data.data.abilities.fo.bonus) > 12) {
      bonusfo = "+" + (actor.data.data.abilities.fo.value + actor.data.data.abilities.fo.bonus - 12)
    };
    if ((actor.data.data.abilities.fo.value + actor.data.data.abilities.fo.bonus) < 9) {
      bonusfo = "-1"
    };
    expr = expr.replace(/épreuve:/g, "");
    expr = expr.replace(/cible:/g, "");
    expr = expr.replace(/@prm/g, prm);
    expr = expr.replace(/@cou/g, cou);
    expr = expr.replace(/@int/g, int);
    expr = expr.replace(/@cha/g, cha);
    expr = expr.replace(/@ad/g, ad);
    expr = expr.replace(/@fo/g, fo);
    expr = expr.replace(/@att/g, att);
    expr = expr.replace(/@prd/g, prd);
    expr = expr.replace(/@mphy/g, mphy);
    expr = expr.replace(/@mpsy/g, mpsy);
    expr = expr.replace(/@rm/g, rm);
    expr = expr.replace(/@esq/g, esq);
    expr = expr.replace(/@pr/g, pr);
    expr = expr.replace(/ /g, "");
    expr = expr.replace(/@bonusfo/g, bonusfo);
    expr = expr.replace(/@lvl/g, lvl);
    expr = expr.replace(/\+\-/g, "-");
    expr = expr.replace(/\-\+/g, "-");
    expr = expr.replace(/\-\-/g, "+");
    expr = expr.replace(/\+\+/g, "+");
    if (expr.substring(expr.length - 2, expr.length) == "+0") { expr = expr.substring(0, expr.length - 2) }
    return expr;
  }

  static getSpeakersTarget = function () {
    let targets = ([...game.user.targets].length > 0) ? [...game.user.targets] : canvas.tokens.children.filter(t => t._controlled);
    if (targets.length == 0 || targets.length > 1) {
      ui.notifications.error("Choisissez un token cible (unique)");
      return null;
    }
    return targets[0].actor;
  }

  static getSpeakersActor = function () {
    // Vérifie qu'un seul token est sélectionné
    const tokens = canvas.tokens.controlled;
    if (tokens.length > 1) {
      ui.notifications.error("Choisissez un unique token source")
      return null;
    }
    const speaker = ChatMessage.getSpeaker();
    let actor;
    // Si un token est sélectionné, le prendre comme acteur cible
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    // Sinon prendre l'acteur par défaut pour l'utilisateur courrant
    if (!actor) actor = game.actors.get(speaker.actor);
    if (actor === undefined) {
      ui.notifications.error("Choisissez un token source")
      return null;
    } else {
      return actor;
    }
  }

  static compendiumSearch = function () {
    var compendiums = [];
    game.packs.forEach(elem => {
      if (elem.metadata.package == "naheulbeuk") {
        compendiums.push(elem.metadata.label)
      }
    })

    let d = new Dialog({
      title: "Rechercher un compendium du système Naheulbeuk",
      content: `
      <form>
        <label>Taper le nom du compendium à ouvrir <em>(entrée pour faire la recherche)</em></label>
        <input type="text" name="q" id="q" value="" label="Nom du compendium" />
        <div id="result"></div>
      </form>
      `,
      buttons: {
      }
    });
    d.render(true);
    $(document).ready(function () {
      $("[id=q]").change(function () {
        var val = $("[id=q]").val().toLowerCase();
        var res = $("[id=result]");
        res[0].innerHTML = '';
        let list = '';
        var terms = [];
        if (val != '') {
          var reg = new RegExp(val)
          terms = compendiums.filter(function (term) {
            var termlc = term.toLowerCase();
            return termlc.match(reg);
          });
        }
        for (let i = 0; i < terms.length; i++) {
          list += '<li class="afficher" data-comp="' + terms[i] + '"><a>' + terms[i] + '</a></li>';
        }
        res[0].innerHTML = '<ul>' + list + '</ul>';
        $("[class=afficher]").click(ev => {
          game.packs.find(p => p.metadata.label === ev.currentTarget.dataset.comp).render(true)
        });
        document.getElementById("app-" + d.appId).style.height = "auto"
      });
    });
  }

  static async rencontre() {
    var message = "";
    var monstres = []
    const promise = []
    const compendium = game.packs.find(p => p.metadata.label === "Bestiaire");
    for (let c of compendium.index) {
      promise.push(compendium.getDocument(c._id));
    }
    await Promise.all(promise).then(actors => {
      for (let actor of actors) {
        monstres.push(actor.data)
      }
    })
    let monstresClasses = []
    while (monstres.length != 0) {
      var i = 0
      var j = 0
      var minxp = monstres[0]
      for (let monstre of monstres) {
        if (monstre.data.attributes.xp.value < minxp.data.attributes.xp.value) {
          minxp = monstre
          j = i
        }
        i++
      }
      monstresClasses.push(minxp)
      monstres.splice(j, 1)
    }
    monstres = monstresClasses
    let d = new Dialog({
      title: "Rencontre",
      content: `
      <form>
        <a class="afficher">Ouvrir le compendium</a>
        <br/>
        <a class="relance">Relancer la sélection aléatoire</a>
        <br/>
        <a class="jet">Lancer de dés</a>
        <br/>
        <hr>
        <label>Trait</label>
        <select name="a" id="a" style="margin-bottom: 5px;">
          <option value=""></option>
          <option value="Bizarre +">Bizarre +</option>
          <option value="Bizarre ++">Bizarre ++</option>
          <option value="Bizarre +++">Bizarre +++</option>
          <option value="Bulldozer +">Bulldozer +</option>
          <option value="Bulldozer ++">Bulldozer ++</option>
          <option value="Bulldozer +++">Bulldozer +++</option>
          <option value="Critique +">Critique +</option>
          <option value="Critique ++">Critique ++</option>
          <option value="Critique +++">Critique +++</option>
          <option value="Mâchoire +">Mâchoire +</option>
          <option value="Mâchoire ++">Mâchoire ++</option>
          <option value="Mâchoire +++">Mâchoire +++</option>
          <option value="Mise à terre +">Mise à terre +</option>
          <option value="Mise à terre ++">Mise à terre ++</option>
          <option value="Mise à terre +++">Mise à terre +++</option>
          <option value="Puissant +">Puissant +</option>
          <option value="Puissant ++">Puissant ++</option>
          <option value="Puissant +++">Puissant +++</option>
          <option value="Rapide +">Rapide +</option>
          <option value="Rapide ++">Rapide ++</option>
          <option value="Rapide +++">Rapide +++</option>
          <option value="Terrifiant +">Terrifiant +</option>
          <option value="Terrifiant ++">Terrifiant ++</option>
          <option value="Terrifiant +++">Terrifiant +++</option>
          <option value="Violent +">Violent +</option>
          <option value="Violent ++">Violent ++</option>
          <option value="Violent +++">Violent +++</option>
          <option value="Agile">Agile</option>
          <option value="Bulldozer volant">Bulldozer volant</option>
          <option value="Immunité">Immunité</option>
          <option value="Légende">Légende</option>
          <option value="Malin">Malin</option>
          <option value="Mort">Mort</option>
          <option value="Nuée">Nuée</option>
          <option value="Paisible">Paisible</option>
          <option value="Surnaturel">Surnaturel</option>
          <option value="Volant">Volant</option>
        </select>
        <br/>
        <label>Répartition géographique</label>
        <select name="b" id="b" style="margin-bottom: 5px;">
          <option value=""></option>
          <option value="Archipel Papoutouh">Archipel Papoutouh</option>
          <option value="Arnn">Arnn</option>
          <option value="Banquise">Banquise</option>
          <option value="Cimes de Kuylinia">Cimes de Kuylinia</option>
          <option value="Côte de Sk'ka">Côte de Sk'ka</option>
          <option value="Fernol et Galzanie">Fernol et Galzanie</option>
          <option value="Forêt maudite de l'Ouest">Forêt maudite de l'Ouest</option>
          <option value="Haute mer">Haute mer</option>
          <option value="Jungles de la péninsule">Jungles de la péninsule</option>
          <option value="Marais gelés">Marais gelés</option>
          <option value="Montagnes du Nord">Montagnes du Nord</option>
          <option value="Monts de l'Est">Monts de l'Est</option>
          <option value="Pays de Nugh">Pays de Nugh</option>
          <option value="Plaine centrale">Plaine centrale</option>
          <option value="Plaine de Sakourvit">Plaine de Sakourvit</option>
          <option value="Plaines de Fangh et Caladie">Plaines de Fangh et Caladie</option>
          <option value="Plaines de l'Ouest">Plaines de l'Ouest</option>
          <option value="Plaines gelées du Nord">Plaines gelées du Nord</option>
          <option value="Pointe sud du Birmilistan">Pointe sud du Birmilistan</option>
          <option value="Rivages de la mer d'Embarh">Rivages de la mer d'Embarh</option>
          <option value="Rivages de la mer Sidralnée">Rivages de la mer Sidralnée</option>
          <option value="Steppes du Srölnagud">Steppes du Srölnagud</option>
          <option value="Uzgueg et Gnaal">Uzgueg et Gnaal</option>
          <option value="Vallée du Birmilistan">Vallée du Birmilistan</option>
          <option value="-Plaines-">-Plaines-</option>
          <option value="-Forêt-">-Forêt-</option>
        </select>
        <br/>
        <label>Catégorie</label>
        <select name="c" id="c">
        <option value=""></option>
        <option value="Animaux">Animaux</option>
        <option value="Végétaux">Végétaux</option>
        <option value="Fanghiens">Fanghiens</option>
        <option value="Pirates Mauves">Pirates Mauves</option>
        <option value="Birmilistanais">Birmilistanais</option>
        <option value="Sauvages du Froid">Sauvages du Froid</option>
        <option value="Skuulnards">Skuulnards</option>
        <option value="Vrognards">Vrognards</option>
        <option value="Humanoïdes">Humanoïdes</option>
        <option value="Monstres et créatures">Monstres et créatures</option>
        <option value="Opposants légendaires">Opposants légendaires</option>
      </select>
        <hr>
        <div id="result"></div>
      </form>
      `,
      buttons: {
      }
    });
    d.render(true);
    $(document).ready(function () {
      $("[class=afficher]").click(ev => {
        game.packs.find(p => p.metadata.label === "Bestiaire").render(true)
      });
      $("[id=a]").change(function () {
        var trait = $("[id=a]").val();
        var geo = $("[id=b]").val();
        var categorie = $("[id=c]").val();
        let list = '';
        var res = $("[id=result]");
        var count = 0;
        res[0].innerHTML = '';
        monstres.forEach(monstre => {
          let flagTrait = false;
          let flagGeo = false;
          let flagCategorie = false;
          monstre.items.forEach(item => {
            if (item.data.name == trait || trait == "") { flagTrait = true }
            if (item.data.name == geo || geo == "") { flagGeo = true }
          })
          if (monstre.data.attributes.categorie == categorie || categorie == "") { flagCategorie = true }
          if (flagCategorie && flagGeo && flagTrait) {
            count++;
            list += '<li style="padding-bottom: 5px;display: flex;align-items: center;">' + count + '&nbsp;<img src=' + monstre.img + ' style="width:30px;height:30px;">&nbsp;<a class="entity-link content-link" draggable="true" data-pack="naheulbeuk.bestiaire" data-id=' + monstre._id + '><i class="fas fa-suitcase"></i>&nbsp;' + monstre.name + '</a>&nbsp;' + monstre.data.attributes.xp.value + ' XP</li>';
          }
          //}
        });
        if (count > 0) {
          count = 1 + Math.floor(Math.random() * count);
          message = 'Sélection aléatoire :&nbsp;' + count;
        } else {
          message = 'Aucun résultat'
        }
        res[0].innerHTML = message + '<ul>' + list + '</ul>';
        document.getElementById("app-" + d.appId).style.height = "auto"
      });
      $("[id=b]").change(function () {
        var trait = $("[id=a]").val();
        var geo = $("[id=b]").val();
        var categorie = $("[id=c]").val();
        let list = '';
        var res = $("[id=result]");
        var count = 0;
        res[0].innerHTML = '';
        monstres.forEach(monstre => {
          let flagTrait = false;
          let flagGeo = false;
          let flagCategorie = false;
          monstre.items.forEach(item => {
            if (item.data.name == trait || trait == "") { flagTrait = true }
            if (item.data.name == geo || geo == "") { flagGeo = true }
          })
          if (monstre.data.attributes.categorie == categorie || categorie == "") { flagCategorie = true }
          if (flagCategorie && flagGeo && flagTrait) {
            count++;
            list += '<li style="padding-bottom: 5px;display: flex;align-items: center;">' + count + '&nbsp;<img src=' + monstre.img + ' style="width:30px;height:30px;">&nbsp;<a class="entity-link content-link" draggable="true" data-pack="naheulbeuk.bestiaire" data-id=' + monstre._id + '><i class="fas fa-suitcase"></i>&nbsp;' + monstre.name + '</a>&nbsp;' + monstre.data.attributes.xp.value + ' XP</li>';
          }
          //}
        });
        if (count > 0) {
          count = 1 + Math.floor(Math.random() * count);
          message = 'Sélection aléatoire :&nbsp;' + count;
        } else {
          message = 'Aucun résultat'
        }
        res[0].innerHTML = message + '<ul>' + list + '</ul>';
        document.getElementById("app-" + d.appId).style.height = "auto"
      });
      $("[id=c]").change(function () {
        var trait = $("[id=a]").val();
        var geo = $("[id=b]").val();
        var categorie = $("[id=c]").val();
        let list = '';
        var res = $("[id=result]");
        var count = 0;
        res[0].innerHTML = '';
        monstres.forEach(monstre => {
          let flagTrait = false;
          let flagGeo = false;
          let flagCategorie = false;
          monstre.items.forEach(item => {
            if (item.data.name == trait || trait == "") { flagTrait = true }
            if (item.data.name == geo || geo == "") { flagGeo = true }
          })
          if (monstre.data.attributes.categorie == categorie || categorie == "") { flagCategorie = true }
          if (flagCategorie && flagGeo && flagTrait) {
            count++;
            list += '<li style="padding-bottom: 5px;display: flex;align-items: center;">' + count + '&nbsp;<img src=' + monstre.img + ' style="width:30px;height:30px;">&nbsp;<a class="entity-link content-link" draggable="true" data-pack="naheulbeuk.bestiaire" data-id=' + monstre._id + '><i class="fas fa-suitcase"></i>&nbsp;' + monstre.name + '</a>&nbsp;' + monstre.data.attributes.xp.value + ' XP</li>';
          }
          //}
        });
        if (count > 0) {
          count = 1 + Math.floor(Math.random() * count);
          message = 'Sélection aléatoire :&nbsp;' + count;
        } else {
          message = 'Aucun résultat'
        }
        res[0].innerHTML = message + '<ul>' + list + '</ul>';
        document.getElementById("app-" + d.appId).style.height = "auto"
      });
      $("[class=relance]").click(ev => {
        var trait = $("[id=a]").val();
        var geo = $("[id=b]").val();
        var categorie = $("[id=c]").val();
        let list = '';
        var res = $("[id=result]");
        var count = 0;
        res[0].innerHTML = '';
        monstres.forEach(monstre => {
          let flagTrait = false;
          let flagGeo = false;
          let flagCategorie = false;
          monstre.items.forEach(item => {
            if (item.data.name == trait || trait == "") { flagTrait = true }
            if (item.data.name == geo || geo == "") { flagGeo = true }
          })
          if (monstre.data.attributes.categorie == categorie || categorie == "") { flagCategorie = true }
          if (flagCategorie && flagGeo && flagTrait) {
            count++;
            list += '<li style="padding-bottom: 5px;display: flex;align-items: center;">' + count + '&nbsp;<img src=' + monstre.img + ' style="width:30px;height:30px;">&nbsp;<a class="entity-link content-link" draggable="true" data-pack="naheulbeuk.bestiaire" data-id=' + monstre._id + '><i class="fas fa-suitcase"></i>&nbsp;' + monstre.name + '</a>&nbsp;' + monstre.data.attributes.xp.value + ' XP</li>';
          }
          //}
        });
        if (count > 0) {
          count = 1 + Math.floor(Math.random() * count);
          message = 'Sélection aléatoire :&nbsp;' + count;
        } else {
          message = 'Aucun résultat'
        }
        res[0].innerHTML = message + '<ul>' + list + '</ul>';
        document.getElementById("app-" + d.appId).style.height = "auto"
      });
      $("[class=jet]").click(ev => {
        let e = new Dialog({
          title: "Lancer custom",
          content: `
          <label style="font-size: 15px;">Formule :</label>
          <input style="font-size: 15px;" type="text" name="inputFormule" value="d20">
          <br/><br/>
          <label style="font-size: 15px;">Difficulté :</label>
          <input style="font-size: 15px;" type="text" name="inputDiff" value=""></li>
          <br/><br/>
          `,
          buttons: {
            one: {
              label: "Lancer custom",
              callback: (html) => {
                let dice = html.find('input[name="inputFormule"').val();
                let diff = html.find('input[name="inputDiff"').val();
                const rollMessageTpl = 'systems/naheulbeuk/templates/chat/skill-roll.hbs';
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
                        name: "Lancer custom"
                      }
                      renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                        r.toMessage({
                          user: game.user.id,
                          flavor: msgFlavor,
                        });
                      });
                    } else {
                      diff = new Roll(diff);
                      diff.roll({ "async": true }).then(diff => {
                        result = Math.abs(diff.total - r.total);
                        if (r.total > diff.total) { reussite = "Echec !   " };
                        tplData = {
                          diff: reussite + " - Difficulté : " + diff.total + " - Ecart : " + result,
                          name: "Lancer custom"
                        };
                        renderTemplate(rollMessageTpl, tplData).then(msgFlavor => {
                          r.toMessage({
                            user: game.user.id,
                            flavor: msgFlavor,
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
        e.render(true);
      });
    });
  }

  static async compendiumAlea() {
    var compendiums = [];
    game.packs.forEach(elem => {
      if (elem.metadata.package == "naheulbeuk") {
        compendiums.push(elem.metadata.label)
      }
    })

    let d = new Dialog({
      title: "Rechercher un compendium du système Naheulbeuk",
      content: `
      <form>
        <label>Taper le nom du compendium à ouvrir <em>(entrée pour faire la recherche)</em></label>
        <input type="text" name="q" id="q" value="" label="Nom du compendium" />
        <div id="result"></div>
      </form>
      `,
      buttons: {
      }
    });
    d.render(true);
    $(document).ready(function () {
      $("[id=q]").change(function () {
        var val = $("[id=q]").val().toLowerCase();
        var res = $("[id=result]");
        res[0].innerHTML = '';
        let list = '';
        var terms = [];
        if (val != '') {
          var reg = new RegExp(val)
          terms = compendiums.filter(function (term) {
            var termlc = term.toLowerCase();
            return termlc.match(reg);
          });
        }
        for (let i = 0; i < terms.length; i++) {
          list += '<li class="afficher" data-comp="' + terms[i] + '"><a>' + terms[i] + '</a></li>';
        }
        res[0].innerHTML = '<ul>' + list + '</ul>';
        $("[class=afficher]").click(ev => {
          var compendium = game.packs.find(p => p.metadata.label === ev.currentTarget.dataset.comp);
          var alea = 1 + Math.floor(Math.random() * compendium.index.size);
          res[0].innerHTML = '<br/><a class="entity-link content-link" draggable="true" data-pack="naheulbeuk.' + compendium.metadata.name + '" data-id=' + compendium.index.contents[alea]._id + '><i class="fas fa-suitcase"></i>&nbsp;' + compendium.index.contents[alea].name + '</a>';
        });
        document.getElementById("app-" + d.appId).style.height = "auto"
      });
    });
  }

  static async listrencontreprep() {
    //---------------------------
    let list = '';
    let i = 1;
    let j = 1;
    let levelFinal = [];
    let zoneFinal = [];
    let traitFinal = [];
    let typeFinal = [];
    let consnom = '';
    let listfamille = '';

    let d = new Dialog({
      title: "Rencontre",
      content: `
      <form>
        Choisissez l'XP de votre rencontre.<br/>
        Ordre de grandeur :<br/>
        - 4 aventuriers de niveau 1 -> 1-20 XP<br/>
        - 4 aventuriers de niveau 2 -> 20-40 XP<br/>
        - 4 aventuriers de niveau 3 -> 40-60 XP<br/>
        - 4 aventuriers de niveau 5 -> 80-100 XP<br/>
        - 4 aventuriers de niveau 10 -> 180-200 XP<br/>
        - 4 aventuriers de niveau 15 -> 280-300 XP<br/>
        <hr>
        <em>Remarque : s'il n'y a pas de résultat, la macro essayera de trouver une rencontre jusqu'à +/- 10 d'xp par rapport à la valeur choisie</em>
        <hr>
        Les rencontres 2,3,n seront de la même famille que la 1 : <input type="checkbox" id="consnom" name="consnom"><br/>
        Lister toutes les rencontres de la même famille que la première : <input type="checkbox" id="listfamille" name="listfamille"><hr>
        <div style="display:flex;text-align: center;">
          <div style="flex:2">Plage d'XP</div>
          <div style="flex:1">Zones</div>
          <div style="flex:1">Traits</div>
          <div style="flex:1">Types</div>
          <div style="flex:0.4"></div>
        </div>
        <div style="display:flex">
          <input name="a1" id="a1" type="text" value=1>
          <input name="b1" id="b1" type="text" value=20>
          <input name="c1" id="c1" type="text" value="" class="zone">
          <input name="d1" id="d1" type="text" value="" class="trait">
          <input name="e1" id="e1" type="text" value="" class="type">
        </div>
        <div id="result"></div>
        <hr>
        <a class="afficher"><strong>Ajouter une rencontre</strong></a><br/>
        <a class="afficherd6"><strong>Ajouter 1d6 rencontres</strong></a><br/>
        <br/>
      </form>
      `,
      buttons: {
        one: {
          label: "Valider",
          callback: (html) => {
            while (j != (i + 1)) {
              levelFinal.push([html.find('input[name="a' + j + '"]').val(), html.find('input[name="b' + j + '"]').val()])
              zoneFinal.push([html.find('input[name="c' + j + '"]').val()])
              traitFinal.push([html.find('input[name="d' + j + '"]').val()])
              typeFinal.push([html.find('input[name="e' + j + '"]').val()])
              j = j + 1
            }
            consnom = document.getElementById("consnom").checked
            listfamille = document.getElementById("listfamille").checked
            game.naheulbeuk.macros.listrencontre(monstres, levelFinal, zoneFinal, traitFinal, typeFinal, consnom, listfamille)
          }
        }
      }
    });
    var monstres = []
    const promise = []
    const compendium = game.packs.find(p => p.metadata.label === "Bestiaire");
    for (let c of compendium.index) {
      promise.push(compendium.getDocument(c._id));
    }
    await Promise.all(promise).then(actors => {
      for (let actor of actors) {
        monstres.push(actor.data)
      }
    })
    d.render(true);

    $(document).ready(function () {
      $("[class=afficher]").click(ev => {
        i = i + 1
        var res = $("[id=result]");
        let xpmin = []
        let xpmax = []
        let zone = []
        let trait = []
        if (i != 2) {
          for (let z = 2; z < i; z++) {
            xpmin.push(document.getElementById("a" + z).value)
            xpmax.push(document.getElementById("b" + z).value)
            trait.push(document.getElementById("c" + z).value)
            zone.push(document.getElementById("d" + z).value)
          }
        }
        res[0].innerHTML = '';
        list += `
        <div class="test" style="display:flex">
          <input name="a`+ i + `" id="a` + i + `" type="text" value=` + $("[name=a1]")[0].value + `>
          <input name="b`+ i + `" id="b` + i + `" type="text" value=` + $("[name=b1]")[0].value + `>
          <input class="zoneAd" name="c`+ i + `" id="c` + i + `" type="text" value="` + $("[name=c1]")[0].value + `">
          <input class="traitAd"name="d`+ i + `" id="d` + i + `" type="text" value="` + $("[name=d1]")[0].value + `">
          <input class="typeAd"name="e`+ i + `" id="e` + i + `" type="text" value="` + $("[name=e1]")[0].value + `">
        </div>
        `
        res[0].innerHTML = res[0].innerHTML + list;
        if (i != 2) {
          for (let z = 2; z < i; z++) {
            document.getElementById("a" + z).value = xpmin[z - 2]
            document.getElementById("b" + z).value = xpmax[z - 2]
            document.getElementById("c" + z).value = trait[z - 2]
            document.getElementById("d" + z).value = zone[z - 2]
          }
        }
        document.getElementById("app-" + d.appId).style.height = "auto"
        $("[class=traitAd]").click(ev => {
          let e = new Dialog({
            title: "Rencontre",
            content: `
            <input type="checkbox" id="zone1" name="Bizarre +"><label>Bizarre +</label><hr>
            <input type="checkbox" id="zone2" name="Bizarre ++"><label>Bizarre ++</label><hr>
            <input type="checkbox" id="zone3" name="Bizarre +++"><label>Bizarre +++</label><hr>
            <input type="checkbox" id="zone4" name="Bulldozer +"><label>Bulldozer +</label><hr>
            <input type="checkbox" id="zone5" name="Bulldozer ++"><label>Bulldozer ++</label><hr>
            <input type="checkbox" id="zone6" name="Bulldozer +++"><label>Bulldozer +++</label><hr>
            <input type="checkbox" id="zone7" name="Critique +"><label>Critique +</label><hr>
            <input type="checkbox" id="zone8" name="Critique ++"><label>Critique ++</label><hr>
            <input type="checkbox" id="zone9" name="Critique +++"><label>Critique +++</label><hr>
            <input type="checkbox" id="zone10" name="Mâchoire +"><label>Mâchoire +</label><hr>
            <input type="checkbox" id="zone11" name="Mâchoire ++"><label>Mâchoire ++</label><hr>
            <input type="checkbox" id="zone12" name="Mâchoire +++"><label>Mâchoire +++</label><hr>
            <input type="checkbox" id="zone13" name="Mise à terre +"><label>Mise à terre +</label><hr>
            <input type="checkbox" id="zone14" name="Mise à terre ++"><label>Mise à terre ++</label><hr>
            <input type="checkbox" id="zone15" name="Mise à terre +++"><label>Mise à terre +++</label><hr>
            <input type="checkbox" id="zone16" name="Puissant +"><label>Puissant +</label><hr>
            <input type="checkbox" id="zone17" name="Puissant ++"><label>Puissant ++</label><hr>
            <input type="checkbox" id="zone18" name="Puissant +++"><label>Puissant +++</label><hr>
            <input type="checkbox" id="zone19" name="Rapide +"><label>Rapide +</label><hr>
            <input type="checkbox" id="zone20" name="Rapide ++"><label>Rapide ++</label><hr>
            <input type="checkbox" id="zone21" name="Rapide +++"><label>Rapide +++</label><hr>
            <input type="checkbox" id="zone22" name="Terrifiant +"><label>Terrifiant +</label><hr>
            <input type="checkbox" id="zone23" name="Terrifiant ++"><label>Terrifiant ++</label><hr>
            <input type="checkbox" id="zone24" name="Terrifiant +++"><label>Terrifiant +++</label><hr>
            <input type="checkbox" id="zone25" name="Violent +"><label>Violent +</label><hr>
            <input type="checkbox" id="zone26" name="Violent ++"><label>Violent ++</label><hr>
            <input type="checkbox" id="zone27" name="Violent +++"><label>Violent +++</label><hr>
            <input type="checkbox" id="zone28" name="Agile"><label>Agile</label><hr>
            <input type="checkbox" id="zone29" name="Bulldozer volant"><label>Bulldozer volant</label><hr>
            <input type="checkbox" id="zone30" name="Immunité"><label>Immunité</label><hr>
            <input type="checkbox" id="zone31" name="Légende"><label>Légende</label><hr>
            <input type="checkbox" id="zone32" name="Malin"><label>Malin</label><hr>
            <input type="checkbox" id="zone33" name="Mort"><label>Mort</label><hr>
            <input type="checkbox" id="zone34" name="Nuée"><label>Nuée</label><hr>
            <input type="checkbox" id="zone35" name="Paisible"><label>Paisible</label><hr>
            <input type="checkbox" id="zone36" name="Surnaturel"><label>Surnaturel</label><hr>
            <input type="checkbox" id="zone37" name="Volant"><label>Volant</label><hr>
            <button class="validation" type="button">Ok</button>
            `,
            buttons: {
            }
          });
          e.render(true);
          $(document).ready(function () {
            document.getElementById("app-" + d.appId).style.height = "auto"
            $("[class=validation]").click(ev2 => {
              let id_ev = ev.currentTarget.id
              let variable = []
              for (let env = 1; env < 38; env++) {
                if (document.getElementById("zone" + env).checked) {
                  variable.push(document.getElementById("zone" + env).name)
                }
              }
              document.getElementById(id_ev).value = variable
              e.close()
            })
          })
        })
        $("[class=zoneAd]").click(ev => {
          let e = new Dialog({
            title: "Rencontre",
            content: `
            <input type="checkbox" id="zone1" name="Archipel Papoutouh"><label>Archipel Papoutouh</label><hr>
            <input type="checkbox" id="zone2" name="Arnn"><label>Arnn</label><hr>
            <input type="checkbox" id="zone3" name="Banquise"><label>Banquise</label><hr>
            <input type="checkbox" id="zone4" name="Cimes de Kuylinia"><label>Cimes de Kuylinia</label><hr>
            <input type="checkbox" id="zone5" name="Côte de Sk'ka"><label>Côte de Sk'ka</label><hr>
            <input type="checkbox" id="zone6" name="Fernol et Galzanie"><label>Fernol et Galzanie</label><hr>
            <input type="checkbox" id="zone7" name="Forêt maudite de l'Ouest"><label>Forêt maudite de l'Ouest</label><hr>
            <input type="checkbox" id="zone8" name="Haute mer"><label>Haute mer</label><hr>
            <input type="checkbox" id="zone9" name="Jungles de la péninsule"><label>Jungles de la péninsule</label><hr>
            <input type="checkbox" id="zone10" name="Marais gelés"><label>Marais gelés</label><hr>
            <input type="checkbox" id="zone11" name="Montagnes du Nord"><label>Montagnes du Nord</label><hr>
            <input type="checkbox" id="zone12" name="Monts de l'Est"><label>Monts de l'Est</label><hr>
            <input type="checkbox" id="zone13" name="Pays de Nugh"><label>Pays de Nugh</label><hr>
            <input type="checkbox" id="zone14" name="Plaine centrale"><label>Plaine centrale</label><hr>
            <input type="checkbox" id="zone15" name="Plaine de Sakourvit"><label>Plaine de Sakourvit</label><hr>
            <input type="checkbox" id="zone16" name="Plaines de Fangh et Caladie"><label>Plaines de Fangh et Caladie</label><hr>
            <input type="checkbox" id="zone17" name="Plaines de l'Ouest"><label>Plaines de l'Ouest</label><hr>
            <input type="checkbox" id="zone18" name="Plaines gelées du Nord"><label>Plaines gelées du Nord</label><hr>
            <input type="checkbox" id="zone19" name="Pointe sud du Birmilistan"><label>Pointe sud du Birmilistan</label><hr>
            <input type="checkbox" id="zone20" name="Rivages de la mer d'Embarh"><label>Rivages de la mer d'Embarh</label><hr>
            <input type="checkbox" id="zone21" name="Rivages de la mer Sidralnée"><label>Rivages de la mer Sidralnée</label><hr>
            <input type="checkbox" id="zone22" name="Steppes du Srölnagud"><label>Steppes du Srölnagud</label><hr>
            <input type="checkbox" id="zone23" name="Uzgueg et Gnaal"><label>Uzgueg et Gnaal</label><hr>
            <input type="checkbox" id="zone24" name="Vallée du Birmilistan"><label>Vallée du Birmilistan</label><hr>
            <input type="checkbox" id="zone25" name="-Plaines-"><label>-Plaines-</label><hr>
            <input type="checkbox" id="zone26" name="-Forêt-"><label>-Forêt-</label><hr>
            <button class="validation" type="button">Ok</button>
            `,
            buttons: {
            }
          });
          e.render(true);
          $(document).ready(function () {
            document.getElementById("app-" + d.appId).style.height = "auto"
            $("[class=validation]").click(ev2 => {
              let id_ev = ev.currentTarget.id
              let variable = []
              for (let env = 1; env < 27; env++) {
                if (document.getElementById("zone" + env).checked) {
                  variable.push(document.getElementById("zone" + env).name)
                }
              }
              document.getElementById(id_ev).value = variable
              e.close()
            })
          })
        })
        $("[class=typeAd]").click(ev => {
          let e = new Dialog({
            title: "Rencontre",
            content: `
            <input type="checkbox" id="zone1" name="Animaux"><label>Animaux</label><hr>
            <input type="checkbox" id="zone2" name="Végétaux"><label>Végétaux</label><hr>
            <input type="checkbox" id="zone3" name="Fanghiens"><label>Fanghiens</label><hr>
            <input type="checkbox" id="zone4" name="Pirates Mauves"><label>Pirates Mauves</label><hr>
            <input type="checkbox" id="zone5" name="Birmilistanais"><label>Birmilistanais</label><hr>
            <input type="checkbox" id="zone6" name="Sauvages du Froid"><label>Sauvages du Froid</label><hr>
            <input type="checkbox" id="zone7" name="Skuulnards"><label>Skuulnards</label><hr>
            <input type="checkbox" id="zone8" name="Vrognards"><label>Vrognards</label><hr>
            <input type="checkbox" id="zone9" name="Humanoïdes"><label>Humanoïdes</label><hr>
            <input type="checkbox" id="zone10" name="Monstres et créatures"><label>Monstres et créatures</label><hr>
            <input type="checkbox" id="zone11" name="Opposants légendaires"><label>Opposants légendaires</label><hr>
            <button class="validation" type="button">Ok</button>
            `,
            buttons: {
            }
          });
          e.render(true);
          $(document).ready(function () {
            document.getElementById("app-" + d.appId).style.height = "auto"
            $("[class=validation]").click(ev2 => {
              let id_ev = ev.currentTarget.id
              let variable = []
              for (let env = 1; env < 12; env++) {
                if (document.getElementById("zone" + env).checked) {
                  variable.push(document.getElementById("zone" + env).name)
                }
              }
              document.getElementById(id_ev).value = variable
              e.close()
            })
          })
        })
      })
      $("[class=afficherd6]").click(ev => {
        let alea = Math.floor(Math.random() * 6) + 1
        while (alea != 0) {
          i = i + 1
          var res = $("[id=result]");
          let xpmin = []
          let xpmax = []
          let zone = []
          let trait = []
          if (i != 2) {
            for (let z = 2; z < i; z++) {
              xpmin.push(document.getElementById("a" + z).value)
              xpmax.push(document.getElementById("b" + z).value)
              trait.push(document.getElementById("c" + z).value)
              zone.push(document.getElementById("d" + z).value)
            }
          }
          res[0].innerHTML = '';
          list += `
          <div class="test" style="display:flex">
            <input name="a`+ i + `" id="a` + i + `" type="text" value=` + $("[name=a1]")[0].value + `>
            <input name="b`+ i + `" id="b` + i + `" type="text" value=` + $("[name=b1]")[0].value + `>
            <input class="zoneAd" name="c`+ i + `" id="c` + i + `" type="text" value="` + $("[name=c1]")[0].value + `">
            <input class="traitAd" name="d`+ i + `" id="d` + i + `" type="text" value="` + $("[name=d1]")[0].value + `">
            <input class="typeAd"name="e`+ i + `" id="e` + i + `" type="text" value="` + $("[name=e1]")[0].value + `">
          </div>
          `
          res[0].innerHTML = list;
          if (i != 2) {
            for (let z = 2; z < i; z++) {
              document.getElementById("a" + z).value = xpmin[z - 2]
              document.getElementById("b" + z).value = xpmax[z - 2]
              document.getElementById("c" + z).value = trait[z - 2]
              document.getElementById("d" + z).value = zone[z - 2]
            }
          }
          document.getElementById("app-" + d.appId).style.height = "auto"
          alea = alea - 1;
        }
        $("[class=traitAd]").click(ev => {
          let e = new Dialog({
            title: "Rencontre",
            content: `
            <input type="checkbox" id="zone1" name="Bizarre +"><label>Bizarre +</label><hr>
            <input type="checkbox" id="zone2" name="Bizarre ++"><label>Bizarre ++</label><hr>
            <input type="checkbox" id="zone3" name="Bizarre +++"><label>Bizarre +++</label><hr>
            <input type="checkbox" id="zone4" name="Bulldozer +"><label>Bulldozer +</label><hr>
            <input type="checkbox" id="zone5" name="Bulldozer ++"><label>Bulldozer ++</label><hr>
            <input type="checkbox" id="zone6" name="Bulldozer +++"><label>Bulldozer +++</label><hr>
            <input type="checkbox" id="zone7" name="Critique +"><label>Critique +</label><hr>
            <input type="checkbox" id="zone8" name="Critique ++"><label>Critique ++</label><hr>
            <input type="checkbox" id="zone9" name="Critique +++"><label>Critique +++</label><hr>
            <input type="checkbox" id="zone10" name="Mâchoire +"><label>Mâchoire +</label><hr>
            <input type="checkbox" id="zone11" name="Mâchoire ++"><label>Mâchoire ++</label><hr>
            <input type="checkbox" id="zone12" name="Mâchoire +++"><label>Mâchoire +++</label><hr>
            <input type="checkbox" id="zone13" name="Mise à terre +"><label>Mise à terre +</label><hr>
            <input type="checkbox" id="zone14" name="Mise à terre ++"><label>Mise à terre ++</label><hr>
            <input type="checkbox" id="zone15" name="Mise à terre +++"><label>Mise à terre +++</label><hr>
            <input type="checkbox" id="zone16" name="Puissant +"><label>Puissant +</label><hr>
            <input type="checkbox" id="zone17" name="Puissant ++"><label>Puissant ++</label><hr>
            <input type="checkbox" id="zone18" name="Puissant +++"><label>Puissant +++</label><hr>
            <input type="checkbox" id="zone19" name="Rapide +"><label>Rapide +</label><hr>
            <input type="checkbox" id="zone20" name="Rapide ++"><label>Rapide ++</label><hr>
            <input type="checkbox" id="zone21" name="Rapide +++"><label>Rapide +++</label><hr>
            <input type="checkbox" id="zone22" name="Terrifiant +"><label>Terrifiant +</label><hr>
            <input type="checkbox" id="zone23" name="Terrifiant ++"><label>Terrifiant ++</label><hr>
            <input type="checkbox" id="zone24" name="Terrifiant +++"><label>Terrifiant +++</label><hr>
            <input type="checkbox" id="zone25" name="Violent +"><label>Violent +</label><hr>
            <input type="checkbox" id="zone26" name="Violent ++"><label>Violent ++</label><hr>
            <input type="checkbox" id="zone27" name="Violent +++"><label>Violent +++</label><hr>
            <input type="checkbox" id="zone28" name="Agile"><label>Agile</label><hr>
            <input type="checkbox" id="zone29" name="Bulldozer volant"><label>Bulldozer volant</label><hr>
            <input type="checkbox" id="zone30" name="Immunité"><label>Immunité</label><hr>
            <input type="checkbox" id="zone31" name="Légende"><label>Légende</label><hr>
            <input type="checkbox" id="zone32" name="Malin"><label>Malin</label><hr>
            <input type="checkbox" id="zone33" name="Mort"><label>Mort</label><hr>
            <input type="checkbox" id="zone34" name="Nuée"><label>Nuée</label><hr>
            <input type="checkbox" id="zone35" name="Paisible"><label>Paisible</label><hr>
            <input type="checkbox" id="zone36" name="Surnaturel"><label>Surnaturel</label><hr>
            <input type="checkbox" id="zone37" name="Volant"><label>Volant</label><hr>
            <button class="validation" type="button">Ok</button>
            `,
            buttons: {
            }
          });
          e.render(true);
          $(document).ready(function () {
            document.getElementById("app-" + d.appId).style.height = "auto"
            $("[class=validation]").click(ev2 => {
              let id_ev = ev.currentTarget.id
              let variable = []
              for (let env = 1; env < 38; env++) {
                if (document.getElementById("zone" + env).checked) {
                  variable.push(document.getElementById("zone" + env).name)
                }
              }
              document.getElementById(id_ev).value = variable
              e.close()
            })
          })
        })
        $("[class=zoneAd]").click(ev => {
          let e = new Dialog({
            title: "Rencontre",
            content: `
            <input type="checkbox" id="zone1" name="Archipel Papoutouh"><label>Archipel Papoutouh</label><hr>
            <input type="checkbox" id="zone2" name="Arnn"><label>Arnn</label><hr>
            <input type="checkbox" id="zone3" name="Banquise"><label>Banquise</label><hr>
            <input type="checkbox" id="zone4" name="Cimes de Kuylinia"><label>Cimes de Kuylinia</label><hr>
            <input type="checkbox" id="zone5" name="Côte de Sk'ka"><label>Côte de Sk'ka</label><hr>
            <input type="checkbox" id="zone6" name="Fernol et Galzanie"><label>Fernol et Galzanie</label><hr>
            <input type="checkbox" id="zone7" name="Forêt maudite de l'Ouest"><label>Forêt maudite de l'Ouest</label><hr>
            <input type="checkbox" id="zone8" name="Haute mer"><label>Haute mer</label><hr>
            <input type="checkbox" id="zone9" name="Jungles de la péninsule"><label>Jungles de la péninsule</label><hr>
            <input type="checkbox" id="zone10" name="Marais gelés"><label>Marais gelés</label><hr>
            <input type="checkbox" id="zone11" name="Montagnes du Nord"><label>Montagnes du Nord</label><hr>
            <input type="checkbox" id="zone12" name="Monts de l'Est"><label>Monts de l'Est</label><hr>
            <input type="checkbox" id="zone13" name="Pays de Nugh"><label>Pays de Nugh</label><hr>
            <input type="checkbox" id="zone14" name="Plaine centrale"><label>Plaine centrale</label><hr>
            <input type="checkbox" id="zone15" name="Plaine de Sakourvit"><label>Plaine de Sakourvit</label><hr>
            <input type="checkbox" id="zone16" name="Plaines de Fangh et Caladie"><label>Plaines de Fangh et Caladie</label><hr>
            <input type="checkbox" id="zone17" name="Plaines de l'Ouest"><label>Plaines de l'Ouest</label><hr>
            <input type="checkbox" id="zone18" name="Plaines gelées du Nord"><label>Plaines gelées du Nord</label><hr>
            <input type="checkbox" id="zone19" name="Pointe sud du Birmilistan"><label>Pointe sud du Birmilistan</label><hr>
            <input type="checkbox" id="zone20" name="Rivages de la mer d'Embarh"><label>Rivages de la mer d'Embarh</label><hr>
            <input type="checkbox" id="zone21" name="Rivages de la mer Sidralnée"><label>Rivages de la mer Sidralnée</label><hr>
            <input type="checkbox" id="zone22" name="Steppes du Srölnagud"><label>Steppes du Srölnagud</label><hr>
            <input type="checkbox" id="zone23" name="Uzgueg et Gnaal"><label>Uzgueg et Gnaal</label><hr>
            <input type="checkbox" id="zone24" name="Vallée du Birmilistan"><label>Vallée du Birmilistan</label><hr>
            <input type="checkbox" id="zone25" name="-Plaines-"><label>-Plaines-</label><hr>
            <input type="checkbox" id="zone26" name="-Forêt-"><label>-Forêt-</label><hr>
            <button class="validation" type="button">Ok</button>
            `,
            buttons: {
            }
          });
          e.render(true);
          $(document).ready(function () {
            document.getElementById("app-" + d.appId).style.height = "auto"
            $("[class=validation]").click(ev2 => {
              let id_ev = ev.currentTarget.id
              let variable = []
              for (let env = 1; env < 27; env++) {
                if (document.getElementById("zone" + env).checked) {
                  variable.push(document.getElementById("zone" + env).name)
                }
              }
              document.getElementById(id_ev).value = variable
              e.close()
            })
          })
        })
        $("[class=typeAd]").click(ev => {
          let e = new Dialog({
            title: "Rencontre",
            content: `
            <input type="checkbox" id="zone1" name="Animaux"><label>Animaux</label><hr>
            <input type="checkbox" id="zone2" name="Végétaux"><label>Végétaux</label><hr>
            <input type="checkbox" id="zone3" name="Fanghiens"><label>Fanghiens</label><hr>
            <input type="checkbox" id="zone4" name="Pirates Mauves"><label>Pirates Mauves</label><hr>
            <input type="checkbox" id="zone5" name="Birmilistanais"><label>Birmilistanais</label><hr>
            <input type="checkbox" id="zone6" name="Sauvages du Froid"><label>Sauvages du Froid</label><hr>
            <input type="checkbox" id="zone7" name="Skuulnards"><label>Skuulnards</label><hr>
            <input type="checkbox" id="zone8" name="Vrognards"><label>Vrognards</label><hr>
            <input type="checkbox" id="zone9" name="Humanoïdes"><label>Humanoïdes</label><hr>
            <input type="checkbox" id="zone10" name="Monstres et créatures"><label>Monstres et créatures</label><hr>
            <input type="checkbox" id="zone11" name="Opposants légendaires"><label>Opposants légendaires</label><hr>
            <button class="validation" type="button">Ok</button>
            `,
            buttons: {
            }
          });
          e.render(true);
          $(document).ready(function () {
            document.getElementById("app-" + d.appId).style.height = "auto"
            $("[class=validation]").click(ev2 => {
              let id_ev = ev.currentTarget.id
              let variable = []
              for (let env = 1; env < 12; env++) {
                if (document.getElementById("zone" + env).checked) {
                  variable.push(document.getElementById("zone" + env).name)
                }
              }
              document.getElementById(id_ev).value = variable
              e.close()
            })
          })
        })
      })

      $("[class=zone]").click(ev => {
        let e = new Dialog({
          title: "Rencontre",
          content: `
          <input type="checkbox" id="zone1" name="Archipel Papoutouh"><label>Archipel Papoutouh</label><hr>
          <input type="checkbox" id="zone2" name="Arnn"><label>Arnn</label><hr>
          <input type="checkbox" id="zone3" name="Banquise"><label>Banquise</label><hr>
          <input type="checkbox" id="zone4" name="Cimes de Kuylinia"><label>Cimes de Kuylinia</label><hr>
          <input type="checkbox" id="zone5" name="Côte de Sk'ka"><label>Côte de Sk'ka</label><hr>
          <input type="checkbox" id="zone6" name="Fernol et Galzanie"><label>Fernol et Galzanie</label><hr>
          <input type="checkbox" id="zone7" name="Forêt maudite de l'Ouest"><label>Forêt maudite de l'Ouest</label><hr>
          <input type="checkbox" id="zone8" name="Haute mer"><label>Haute mer</label><hr>
          <input type="checkbox" id="zone9" name="Jungles de la péninsule"><label>Jungles de la péninsule</label><hr>
          <input type="checkbox" id="zone10" name="Marais gelés"><label>Marais gelés</label><hr>
          <input type="checkbox" id="zone11" name="Montagnes du Nord"><label>Montagnes du Nord</label><hr>
          <input type="checkbox" id="zone12" name="Monts de l'Est"><label>Monts de l'Est</label><hr>
          <input type="checkbox" id="zone13" name="Pays de Nugh"><label>Pays de Nugh</label><hr>
          <input type="checkbox" id="zone14" name="Plaine centrale"><label>Plaine centrale</label><hr>
          <input type="checkbox" id="zone15" name="Plaine de Sakourvit"><label>Plaine de Sakourvit</label><hr>
          <input type="checkbox" id="zone16" name="Plaines de Fangh et Caladie"><label>Plaines de Fangh et Caladie</label><hr>
          <input type="checkbox" id="zone17" name="Plaines de l'Ouest"><label>Plaines de l'Ouest</label><hr>
          <input type="checkbox" id="zone18" name="Plaines gelées du Nord"><label>Plaines gelées du Nord</label><hr>
          <input type="checkbox" id="zone19" name="Pointe sud du Birmilistan"><label>Pointe sud du Birmilistan</label><hr>
          <input type="checkbox" id="zone20" name="Rivages de la mer d'Embarh"><label>Rivages de la mer d'Embarh</label><hr>
          <input type="checkbox" id="zone21" name="Rivages de la mer Sidralnée"><label>Rivages de la mer Sidralnée</label><hr>
          <input type="checkbox" id="zone22" name="Steppes du Srölnagud"><label>Steppes du Srölnagud</label><hr>
          <input type="checkbox" id="zone23" name="Uzgueg et Gnaal"><label>Uzgueg et Gnaal</label><hr>
          <input type="checkbox" id="zone24" name="Vallée du Birmilistan"><label>Vallée du Birmilistan</label><hr>
          <input type="checkbox" id="zone25" name="-Plaines-"><label>-Plaines-</label><hr>
          <input type="checkbox" id="zone26" name="-Forêt-"><label>-Forêt-</label><hr>
          <button class="validation" type="button">Ok</button>
          `,
          buttons: {
          }
        });
        e.render(true);
        $(document).ready(function () {
          document.getElementById("app-" + d.appId).style.height = "auto"
          $("[class=validation]").click(ev2 => {
            let id_ev = ev.currentTarget.id
            let variable = []
            for (let env = 1; env < 27; env++) {
              if (document.getElementById("zone" + env).checked) {
                variable.push(document.getElementById("zone" + env).name)
              }
            }
            document.getElementById(id_ev).value = variable
            e.close()
          })
        })
      })
      $("[class=trait]").click(ev => {
        let e = new Dialog({
          title: "Rencontre",
          content: `
          <input type="checkbox" id="zone1" name="Bizarre +"><label>Bizarre +</label><hr>
          <input type="checkbox" id="zone2" name="Bizarre ++"><label>Bizarre ++</label><hr>
          <input type="checkbox" id="zone3" name="Bizarre +++"><label>Bizarre +++</label><hr>
          <input type="checkbox" id="zone4" name="Bulldozer +"><label>Bulldozer +</label><hr>
          <input type="checkbox" id="zone5" name="Bulldozer ++"><label>Bulldozer ++</label><hr>
          <input type="checkbox" id="zone6" name="Bulldozer +++"><label>Bulldozer +++</label><hr>
          <input type="checkbox" id="zone7" name="Critique +"><label>Critique +</label><hr>
          <input type="checkbox" id="zone8" name="Critique ++"><label>Critique ++</label><hr>
          <input type="checkbox" id="zone9" name="Critique +++"><label>Critique +++</label><hr>
          <input type="checkbox" id="zone10" name="Mâchoire +"><label>Mâchoire +</label><hr>
          <input type="checkbox" id="zone11" name="Mâchoire ++"><label>Mâchoire ++</label><hr>
          <input type="checkbox" id="zone12" name="Mâchoire +++"><label>Mâchoire +++</label><hr>
          <input type="checkbox" id="zone13" name="Mise à terre +"><label>Mise à terre +</label><hr>
          <input type="checkbox" id="zone14" name="Mise à terre ++"><label>Mise à terre ++</label><hr>
          <input type="checkbox" id="zone15" name="Mise à terre +++"><label>Mise à terre +++</label><hr>
          <input type="checkbox" id="zone16" name="Puissant +"><label>Puissant +</label><hr>
          <input type="checkbox" id="zone17" name="Puissant ++"><label>Puissant ++</label><hr>
          <input type="checkbox" id="zone18" name="Puissant +++"><label>Puissant +++</label><hr>
          <input type="checkbox" id="zone19" name="Rapide +"><label>Rapide +</label><hr>
          <input type="checkbox" id="zone20" name="Rapide ++"><label>Rapide ++</label><hr>
          <input type="checkbox" id="zone21" name="Rapide +++"><label>Rapide +++</label><hr>
          <input type="checkbox" id="zone22" name="Terrifiant +"><label>Terrifiant +</label><hr>
          <input type="checkbox" id="zone23" name="Terrifiant ++"><label>Terrifiant ++</label><hr>
          <input type="checkbox" id="zone24" name="Terrifiant +++"><label>Terrifiant +++</label><hr>
          <input type="checkbox" id="zone25" name="Violent +"><label>Violent +</label><hr>
          <input type="checkbox" id="zone26" name="Violent ++"><label>Violent ++</label><hr>
          <input type="checkbox" id="zone27" name="Violent +++"><label>Violent +++</label><hr>
          <input type="checkbox" id="zone28" name="Agile"><label>Agile</label><hr>
          <input type="checkbox" id="zone29" name="Bulldozer volant"><label>Bulldozer volant</label><hr>
          <input type="checkbox" id="zone30" name="Immunité"><label>Immunité</label><hr>
          <input type="checkbox" id="zone31" name="Légende"><label>Légende</label><hr>
          <input type="checkbox" id="zone32" name="Malin"><label>Malin</label><hr>
          <input type="checkbox" id="zone33" name="Mort"><label>Mort</label><hr>
          <input type="checkbox" id="zone34" name="Nuée"><label>Nuée</label><hr>
          <input type="checkbox" id="zone35" name="Paisible"><label>Paisible</label><hr>
          <input type="checkbox" id="zone36" name="Surnaturel"><label>Surnaturel</label><hr>
          <input type="checkbox" id="zone37" name="Volant"><label>Volant</label><hr>
          <button class="validation" type="button">Ok</button>
          `,
          buttons: {
          }
        });
        e.render(true);
        $(document).ready(function () {
          document.getElementById("app-" + d.appId).style.height = "auto"
          $("[class=validation]").click(ev2 => {
            let id_ev = ev.currentTarget.id
            let variable = []
            for (let env = 1; env < 38; env++) {
              if (document.getElementById("zone" + env).checked) {
                variable.push(document.getElementById("zone" + env).name)
              }
            }
            document.getElementById(id_ev).value = variable
            e.close()
          })
        })
      })
      $("[class=type]").click(ev => {
        let e = new Dialog({
          title: "Rencontre",
          content: `
          <input type="checkbox" id="zone1" name="Animaux"><label>Animaux</label><hr>
          <input type="checkbox" id="zone2" name="Végétaux"><label>Végétaux</label><hr>
          <input type="checkbox" id="zone3" name="Fanghiens"><label>Fanghiens</label><hr>
          <input type="checkbox" id="zone4" name="Pirates Mauves"><label>Pirates Mauves</label><hr>
          <input type="checkbox" id="zone5" name="Birmilistanais"><label>Birmilistanais</label><hr>
          <input type="checkbox" id="zone6" name="Sauvages du Froid"><label>Sauvages du Froid</label><hr>
          <input type="checkbox" id="zone7" name="Skuulnards"><label>Skuulnards</label><hr>
          <input type="checkbox" id="zone8" name="Vrognards"><label>Vrognards</label><hr>
          <input type="checkbox" id="zone9" name="Humanoïdes"><label>Humanoïdes</label><hr>
          <input type="checkbox" id="zone10" name="Monstres et créatures"><label>Monstres et créatures</label><hr>
          <input type="checkbox" id="zone11" name="Opposants légendaires"><label>Opposants légendaires</label><hr>
          <button class="validation" type="button">Ok</button>
          `,
          buttons: {
          }
        });
        e.render(true);
        $(document).ready(function () {
          document.getElementById("app-" + d.appId).style.height = "auto"
          $("[class=validation]").click(ev2 => {
            let id_ev = ev.currentTarget.id
            let variable = []
            for (let env = 1; env < 12; env++) {
              if (document.getElementById("zone" + env).checked) {
                variable.push(document.getElementById("zone" + env).name)
              }
            }
            document.getElementById(id_ev).value = variable
            e.close()
          })
        })
      })
    })
    //-------------------------
  }

  static async listrencontre(monstres, level, zone, trait, type, consnom, listfamille) {
    var rencontresN = []
    var rencontresM = []
    var monstres = monstres
    var list = ''
    let i = 0
    let firstchar = ""
    for (let levelCust of level) {
      var zoneCusts = zone[i][0].split(',')
      if (zoneCusts.length == 1 && zoneCusts[0] == "") { zoneCusts = [] }
      var traitCusts = trait[i][0].split(',')
      if (traitCusts.length == 1 && traitCusts[0] == "") { traitCusts = [] }
      var typeCusts = type[i][0].split(',')
      if (typeCusts.length == 1 && typeCusts[0] == "") { typeCusts = [] }
      var flag1 = 0
      var flag2 = 0
      var flag3 = false
      var rencontres = []
      let xpmax = levelCust[1]
      let xpmin = levelCust[0]
      let flagtest = false
      let compteurtest = 0
      while (!flagtest) {
        xpmax = parseInt(levelCust[1]) + compteurtest
        xpmin = parseInt(levelCust[0]) - compteurtest
        for (let monstre of monstres) {
          flag1 = 0
          flag2 = 0
          flag3 = false
          if (monstre.data.attributes.xp.value <= xpmax && monstre.data.attributes.xp.value >= xpmin) {
            for (let zoneCust of zoneCusts) {
              monstre.items.forEach(item => {
                if (item.data.name == zoneCust) { flag1++ }
              })
            }
            for (let traitCust of traitCusts) {
              monstre.items.forEach(item => {
                if (item.data.name == traitCust) { flag2++ }
              })
            }
            for (let typeCust of typeCusts) {
              if (monstre.data.attributes.categorie == typeCust) { flag3 = true }
            }
            if (typeCusts.length == 0) { flag3 = true }
          }
          if (flag1 == zoneCusts.length && flag2 == traitCusts.length && flag3 == true) {
            if (consnom == true && firstchar != "") {
              if (monstre.name.split("|")[0].replace(/ /g, '') == firstchar) {
                rencontres.push(monstre)
              }
            } else {
              rencontres.push(monstre)
            }
          }
        }
        compteurtest++
        if (compteurtest == 11) { flagtest = true }
        if (rencontres.length != 0) { flagtest = true }
      }
      if (rencontres.length == 0) {
        rencontresN.push("vide")
      } else {
        let alea = Math.floor(Math.random() * rencontres.length)
        let aleamonstre = rencontres[alea]
        if (consnom == true && firstchar == "") {
          firstchar = aleamonstre.name.split("|")[0].replace(/ /g, '')
        }
        rencontresN.push(aleamonstre)
      }
      if (rencontresN.length == 1 && rencontresM.length == 0) {
        if (rencontresN[0] == "vide") {
          consnom = false;
          listfamille = false;
        }
        rencontresM = rencontresN
        rencontresN = []
      }
      i = i + 1
    }
    if (listfamille == true) {
      for (let monstre of monstres) {
        if (monstre.name != rencontresM[0].name && monstre.name.split("|")[0].replace(/ /g, '') == rencontresM[0].name.split("|")[0].replace(/ /g, '')) {
          rencontresM.push(monstre)
        }
      }
    }

    for (let r of rencontresM) {
      if (r == "vide") {
        list += '<li style="padding-bottom: 5px;display: flex;align-items: center;">Pas de résultat</li>';
      } else {
        list += '<li style="padding-bottom: 5px;display: flex;align-items: center;"><img src=' + r.img + ' style="width:60px;height:60px;">&nbsp;<a class="entity-link content-link" draggable="true" data-pack="naheulbeuk.bestiaire" data-id=' + r._id + '><i class="fas fa-suitcase"></i> ' + r.name + '</a>&nbsp;' + r.data.attributes.xp.value + ' XP</li>';
      }
    }
    list += '<hr>'
    for (let r of rencontresN) {
      if (r == "vide") {
        list += '<li style="padding-bottom: 5px;display: flex;align-items: center;">Pas de résultat</li>';
      } else {
        list += '<li style="padding-bottom: 5px;display: flex;align-items: center;"><img src=' + r.img + ' style="width:60px;height:60px;">&nbsp;<a class="entity-link content-link" draggable="true" data-pack="naheulbeuk.bestiaire" data-id=' + r._id + '><i class="fas fa-suitcase"></i> ' + r.name + '</a>&nbsp;' + r.data.attributes.xp.value + ' XP</li>';
      }
    }
    let ul = '<ul>' + list + '</ul>';
    let d = new Dialog({
      title: "Rencontre",
      content: ul,
      buttons: {}
    });
    d.render(true);
  }
}

