export const registerHandlebarsHelpers = function() {
  /**
   * @name customRoll
   * @description
   * 
   * @returns 
   */

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
  });

  //Log une variable
  Handlebars.registerHelper("log", function (value) {
    console.log(value)
  });

  //Opération mathématique 1 opérateur
  Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    return {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": (lvalue * 100) * (rvalue * 100) / 10000,
      "/": Math.ceil(lvalue / rvalue),
      ":": lvalue / rvalue,
      "%": lvalue % rvalue
    }[operator];
  });

  //Opération mathématique 2 opérateurs
  Handlebars.registerHelper("math2", function (lvalue, operator, rvalue, operator2, rvalue2) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    rvalue2 = parseFloat(rvalue2);
    let operation1 = {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": (lvalue * 100) * (rvalue * 100) / 10000,
      "/": Math.ceil(lvalue / rvalue),
      ":": lvalue / rvalue,
      "%": lvalue % rvalue
    }[operator];
    let operation2 = {
      "+": operation1 + rvalue2,
      "-": operation1 - rvalue2,
      "*": (operation1 * 100) * (rvalue2 * 100) / 10000,
      "/": Math.ceil(operation1 / rvalue2),
      ":": operation1 / rvalue2,
      "%": operation1 % rvalue2
    }[operator2];
    return operation2
  });

  //Opération mathématique 3 opérateurs
  Handlebars.registerHelper("math3", function (lvalue, operator, rvalue, operator2, rvalue2, operator3, rvalue3) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    rvalue2 = parseFloat(rvalue2);
    rvalue3 = parseFloat(rvalue3);
    let operation1 = {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": (lvalue * 100) * (rvalue * 100) / 10000,
      "/": Math.ceil(lvalue / rvalue),
      ":": lvalue / rvalue,
      "%": lvalue % rvalue
    }[operator];
    let operation2 = {
      "+": operation1 + rvalue2,
      "-": operation1 - rvalue2,
      "*": (operation1 * 100) * (rvalue2 * 100) / 10000,
      "/": Math.ceil(operation1 / rvalue2),
      ":": operation1 / rvalue2,
      "%": operation1 % rvalue2
    }[operator2];
    let operation3 = {
      "+": operation2 + rvalue3,
      "-": operation2 - rvalue3,
      "*": (operation2 * 100) * (rvalue3 * 100) / 10000,
      "/": Math.ceil(operation2 / rvalue3),
      ":": operation2 / rvalue3,
      "%": operation2 % rvalue3
    }[operator2];
    return operation3
  });

  //Opération mathématique arrondi en dessous
  Handlebars.registerHelper("arrondi", function (lvalue) {
    lvalue = parseFloat(lvalue);
    var value = Math.ceil(lvalue * 100) / 100
    return value
  });

  //Opération mathématique arrondi le plus proche
  Handlebars.registerHelper("arrondiProche", function (lvalue) {
    lvalue = parseFloat(lvalue);
    var value = Math.round(lvalue * 1000) / 1000
    return value
  });

  //Premier character d'une variable
  Handlebars.registerHelper('first', function (val1) {
    var val1 = val1;
    return val1.slice(0, 1);
  });

  //Variable sans le premier character
  Handlebars.registerHelper('first2', function (val1) {
    var val1 = val1;
    return val1.slice(1, val1.length);
  });

  //Test égalité
  Handlebars.registerHelper('equals', function (val1, val2) {
    var val1 = val1;
    var val2 = val2;
    if (val1 == "false") { val1 = false };
    if (val1 == "true") { val1 = true };
    if (val2 == "false") { val2 = false };
    if (val2 == "true") { val2 = true };
    return val1 == val2;
  });

  //Test non égalité
  Handlebars.registerHelper('equalsnot', function (val1, val2) {
    var val1 = val1;
    var val2 = val2;
    if (val1 == "false") { val1 = false };
    if (val1 == "true") { val1 = true };
    if (val2 == "false") { val2 = false };
    if (val2 == "true") { val2 = true };
    return val1 != val2;
  });

  //Test égalité avec OU
  Handlebars.registerHelper('equalsor', function (val1, val2, val3, val4) {
    var val1 = val1;
    var val2 = val2;
    var val3 = val3;
    var val4 = val4;
    var result = false;
    if (val1 == "false") { val1 = false };
    if (val1 == "true") { val1 = true };
    if (val2 == "false") { val2 = false };
    if (val2 == "true") { val2 = true };
    if (val3 == "false") { val3 = false };
    if (val3 == "true") { val3 = true };
    if (val4 == "false") { val4 = false };
    if (val4 == "true") { val4 = true };
    if (val1 == val2 || val3 == val4) { result = true }
    return result;
  });

  //Test égalité avec ET
  Handlebars.registerHelper('equalsand', function (val1, val2, val3, val4) {
    var val1 = val1;
    var val2 = val2;
    var val3 = val3;
    var val4 = val4;
    var result = false;
    if (val1 == "false") { val1 = false };
    if (val1 == "true") { val1 = true };
    if (val2 == "false") { val2 = false };
    if (val2 == "true") { val2 = true };
    if (val3 == "false") { val3 = false };
    if (val3 == "true") { val3 = true };
    if (val4 == "false") { val4 = false };
    if (val4 == "true") { val4 = true };
    if (val1 == val2 && val3 == val4) { result = true }
    return result;
  });

  //Test si un objet a un bonus
  Handlebars.registerHelper('bonus', function (item) {
    let flag_bonus = true
    let testArray = [item.system.cou,item.system.int,item.system.cha,item.system.ad,item.system.fo,item.system.att,item.system.prd,item.system.pr,item.system.prm,item.system.mvt,item.system.rm,item.system.att_arme_jet,item.system.degat_arme_jet,item.system.mphy,item.system.mpsy,item.system.esq,item.system.degat_arme_cac,item.system.cha_ignorempsy,item.system.nb_pr_ss_encombrement,item.system.autre]
    for (let testValue of testArray) {
      if (testValue!="-" && testValue!=0 && testValue!="" && testValue!="0"){flag_bonus=false}
    }
    return flag_bonus
  });

  //Calcul du déplacement en fonction des PR
  Handlebars.registerHelper('deplacement', function (val1, val11, val2, val3, val4) {
    var calc = val1 + val11 + val2 - val3;
    var calc1 = 0;
    var calc2 = 0;
    if (calc <= 1) {
      calc1 = 8;
      calc2 = 12;
    } else if (calc == 2) {
      calc1 = 6;
      calc2 = 10;
    } else if (calc <= 4) {
      calc1 = 4;
      calc2 = 8;
    } else if (calc == 5) {
      calc1 = 4;
      calc2 = 6;
    } else if (calc == 6) {
      calc1 = 3;
      calc2 = 4;
    } else if (calc == 7) {
      calc1 = 2;
      calc2 = 3;
    } else if (calc > 7) {
      calc1 = 1;
      calc2 = 2;
    }
    calc1 = Math.max(0, Math.ceil(calc1 + (calc1 * val4 / 100)))
    calc2 = Math.max(0, Math.ceil(calc2 + (calc2 * val4 / 100)))
    calc = "(" + calc1 + "m/" + calc2 + "m)"
    return calc;
  });

  //Sauvegarder l'acteur dans une variable pour être lû dans les boucles for
  if (typeof actor_data != 'object') { var actor_data };
  Handlebars.registerHelper("save_actor", function (value) {
    actor_data = value
  });

  //Lire l'acteur sauvegarder dans la variable de save_actor
  Handlebars.registerHelper("read_actor", function (value) {
    var actor_details = "actor_data.system" + value
    actor_details = eval(actor_details)
    if (actor_details.toString().substring(0, 1) != "-" && /^[0-9]/.test(actor_details)) { actor_details = "+" + actor_details }
    if (actor_details == "+0") {
      return
    } else {
      return actor_details
    }
  });

  //Renvoie le nombre d'items de l'acteur sauvegardé dans save_actor en fonction de la recherche (sac, bourse, divers, potions...)
  Handlebars.registerHelper("read_items_actor", function (value) {
    let compteur = 0
    for (let itemActor of actor_data.items){
      if (itemActor.system.stockage!=undefined){
        let arme_armure_pas_equipe = true
        if ((itemActor.type=="arme" || itemActor.type=="armure") && itemActor.system.equipe==true){arme_armure_pas_equipe=false}
        if (arme_armure_pas_equipe && value=="sac" && itemActor.system.stockage=="sac") {compteur++}
        if (arme_armure_pas_equipe && value=="nosac" && itemActor.system.stockage=="nosac") {compteur++}
        if (arme_armure_pas_equipe && value=="bourse" && itemActor.system.stockage=="bourse") {compteur++}
        if (arme_armure_pas_equipe && value=="divers" && itemActor.system.stockage=="sac" && (itemActor.type=="sac" || itemActor.system.categorie=="Divers" || itemActor.system.categorie=="")) {compteur++}
        if (arme_armure_pas_equipe && value=="livres" && itemActor.system.stockage=="sac" && itemActor.system.categorie=="Livres") {compteur++}
        if (arme_armure_pas_equipe && value=="potions" && itemActor.system.stockage=="sac" && itemActor.system.categorie=="Potions") {compteur++}
        if (arme_armure_pas_equipe && value=="ingredients" && itemActor.system.stockage=="sac" && itemActor.system.categorie=="Ingrédients") {compteur++}
        if (arme_armure_pas_equipe && value=="armes" && itemActor.system.stockage=="sac" && itemActor.system.categorie=="Armes") {compteur++}
        if (arme_armure_pas_equipe && value=="armures" && itemActor.system.stockage=="sac" && itemActor.system.categorie=="Armures") {compteur++}
        if (arme_armure_pas_equipe && value=="nourritures" && itemActor.system.stockage=="sac" && itemActor.system.categorie=="Nourritures") {compteur++}
        if (arme_armure_pas_equipe && value=="richesses" && itemActor.system.stockage=="sac" && itemActor.system.categorie=="Richesses") {compteur++}
        if (arme_armure_pas_equipe && value=="perso" && itemActor.system.stockage=="sac" && itemActor.system.categorie=="Objets personnels") {compteur++}
        if (arme_armure_pas_equipe && value=="armes-hs" && itemActor.system.stockage=="nosac" && itemActor.type=="arme" && itemActor.system.arme_autre==false) {compteur++}
        if (arme_armure_pas_equipe && value=="sacs-hs" && itemActor.system.stockage=="nosac" && itemActor.type=="sac") {compteur++}
        if (arme_armure_pas_equipe && value=="autres-hs" && itemActor.system.stockage=="nosac" && itemActor.type!="sac" && (itemActor.type!="arme" || itemActor.system.arme_autre==true)) {compteur++}
      }
    }
    return compteur
  });

  //Calculer le test d'ingéniosité non spécialiste
  Handlebars.registerHelper("ingeniositeMalus", function (difficulte,malus) {
    var actor_ad = actor_data.system.abilities.ad.value+actor_data.system.abilities.ad.bonus+actor_data.system.abilities.ad.bonus_man
    var actor_int = actor_data.system.abilities.int.value+actor_data.system.abilities.int.bonus+actor_data.system.abilities.int.bonus_man
    var actor_ingeniosite = Math.ceil((parseInt(actor_ad)+parseInt(actor_int))/2)
    var actor_diff = actor_ingeniosite - difficulte
    if (Math.sign(actor_diff)==-1){
      actor_ingeniosite=actor_ingeniosite+actor_diff
    }
    if (malus.substring(0,1)=="-"){
      actor_ingeniosite=actor_ingeniosite+parseInt(malus)
    } else {
      actor_ingeniosite = 0
    }
    return actor_ingeniosite
  });

  //Calculer le test d'ingéniosité  spécialiste
  Handlebars.registerHelper("ingeniosite", function (difficulte) {
    var actor_ad = actor_data.system.abilities.ad.value+actor_data.system.abilities.ad.bonus+actor_data.system.abilities.ad.bonus_man
    var actor_int = actor_data.system.abilities.int.value+actor_data.system.abilities.int.bonus+actor_data.system.abilities.int.bonus_man
    var actor_ingeniosite = Math.ceil((parseInt(actor_ad)+parseInt(actor_int))/2)
    var actor_diff = actor_ingeniosite - difficulte
    actor_ingeniosite=actor_ingeniosite+actor_diff
    return actor_ingeniosite
  });

  //Calculer le poids d'un conteneur
  Handlebars.registerHelper("poidconteneur", function (item) {
    var poid = item.system.poidconteneur
    for (let itemFind of item.system.items){
      poid = poid + itemFind.system.weight*itemFind.system.quantity
    }
    if (item.system.conteneur._id==undefined) {
      item.update({"system.weight":poid})
    }
    return poid
  });

  //Replace attr dans les fiches de personnage
  Handlebars.registerHelper("replaceAttr", function (val1, val2, val3, val4){
    let txt = ""
    for (let val of [val1, val2, val3, val4]) {
      if (typeof(val)=="string") {
        if (txt != "") { txt = txt + "+"}
        txt = txt + val
      }
    }
    let formula = game.naheulbeuk.macros.replaceAttr(txt, actor_data)
    return formula
  })

  //Poids total PNJ
  Handlebars.registerHelper("poids_pnj", function (actor) {
    let poids = 0
    for (let item of actor.items){
      if (item.system.weight!=undefined){
        poids = poids + item.system.weight*item.system.quantity
      }
    }
    return poids;
  });
}