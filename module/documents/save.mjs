//---------------------------
let list = '';
let i = 1;
let j = 1;
let levelFinal=[];
let zoneFinal=[];
let traitFinal=[];

let d = new Dialog({
  title: "Rencontre",
  content:`
  <form>
    Choisissez l'XP de votre rencontre.<br/>
    Ordre de grandeur :<br/>
    - 4 aventuriers de niveau 1 -> 0-20 XP<br/>
    - 4 aventuriers de niveau 2 -> 20-40 XP<br/>
    - 4 aventuriers de niveau 3 -> 40-60 XP<br/>
    - 4 aventuriers de niveau 5 -> 80-100 XP<br/>
    - 4 aventuriers de niveau 10 -> 180-200 XP<br/>
    - 4 aventuriers de niveau 15 -> 280-300 XP<br/>
    <hr>
    <div style="display:flex">
      <div style="flex:2">Plage d'XP</div>
      <div style="flex:1">Traits</div>
      <div style="flex:1">Zone</div>
    </div>
    <div style="display:flex">
      <input name="a1" id="a1" type="text" value=1>
      <input name="b1" id="b1" type="text" value=10>
      <input name="c1" id="c1" type="text" value="" class="zone">
      <input name="d1" id="d1" type="text" value="" class="trait">
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
        while (j!=(i+1)) {
          levelFinal.push([html.find('input[name="a'+j+'"]').val(),html.find('input[name="b'+j+'"]').val()])
          zoneFinal.push([html.find('input[name="c'+j+'"]').val()])
          traitFinal.push([html.find('input[name="d'+j+'"]').val()])
          j=j+1
        }
        game.naheulbeuk.macros.listrencontre(levelFinal,zoneFinal,traitFinal)  
      }
    }
  }
});
d.render(true);
$(document).ready(function() {
  document.getElementById("app-"+d.appId).style.height="auto"
  $("[class=afficher]").click(ev => {
    i=i+1
    var res = $("[id=result]");
    let xpmin=[]
    let xpmax=[]
    let zone=[]
    let trait=[]
    if (i!=2){
      for (let z = 2; z < i; z++){
        xpmin.push(document.getElementById("a"+z).value)
        xpmax.push(document.getElementById("b"+z).value)
        trait.push(document.getElementById("c"+z).value)
        zone.push(document.getElementById("d"+z).value)
      }
    }
    res[0].innerHTML = '';
    list += `
    <div class="test" style="display:flex">
      <input name="a`+i+`" id="a`+i+`" type="text" value=`+$("[name=a1]")[0].value+`>
      <input name="b`+i+`" id="b`+i+`" type="text" value=`+$("[name=b1]")[0].value+`>
      <input class="zoneAd" name="c`+i+`" id="c`+i+`" type="text" value="`+$("[name=c1]")[0].value+`">
      <input class="traitAd"name="d`+i+`" id="d`+i+`" type="text" value="`+$("[name=d1]")[0].value+`">
    </div>
    `
    res[0].innerHTML = res[0].innerHTML+list;
    if (i!=2){
      for (let z = 2; z < i; z++){
        document.getElementById("a"+z).value=xpmin[z-2]
        document.getElementById("b"+z).value=xpmax[z-2]
        document.getElementById("c"+z).value=trait[z-2]
        document.getElementById("d"+z).value=zone[z-2]
      }
    }
    document.getElementById("app-"+d.appId).style.height="auto"
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
      $(document).ready(function() {
        document.getElementById("app-"+d.appId).style.height="auto"
        $("[class=validation]").click(ev2 => {
          let id_ev = ev.currentTarget.id
          let variable=[]
          for (let env = 1; env < 38; env++){
            if (document.getElementById("zone"+env).checked){
              variable.push(document.getElementById("zone"+env).name)
            }
          }
          document.getElementById(id_ev).value=variable
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
        <button class="validation" type="button">Ok</button>
        `,
        buttons: {
        }
      });
      e.render(true);
      $(document).ready(function() {
        document.getElementById("app-"+d.appId).style.height="auto"
        $("[class=validation]").click(ev2 => {
          let id_ev = ev.currentTarget.id
          let variable=[]
          for (let env = 1; env < 25; env++){
            if (document.getElementById("zone"+env).checked){
              variable.push(document.getElementById("zone"+env).name)
            }
          }
          document.getElementById(id_ev).value=variable
          e.close()
        })
      })
    })
  })
  $("[class=afficherd6]").click(ev => {
    let alea = Math.floor(Math.random() * 6)+1
    while (alea!=0){
      i=i+1
      var res = $("[id=result]");
      let xpmin=[]
      let xpmax=[]
      let zone=[]
      let trait=[]
      if (i!=2){
        for (let z = 2; z < i; z++){
          xpmin.push(document.getElementById("a"+z).value)
          xpmax.push(document.getElementById("b"+z).value)
          trait.push(document.getElementById("c"+z).value)
          zone.push(document.getElementById("d"+z).value)
        }
      }
      res[0].innerHTML = '';
      list += `
      <div class="test" style="display:flex">
        <input name="a`+i+`" id="a`+i+`" type="text" value=`+$("[name=a1]")[0].value+`>
        <input name="b`+i+`" id="b`+i+`" type="text" value=`+$("[name=b1]")[0].value+`>
        <input class="zoneAd" name="c`+i+`" id="c`+i+`" type="text" value="`+$("[name=c1]")[0].value+`">
        <input class="traitAd" name="d`+i+`" id="d`+i+`" type="text" value="`+$("[name=d1]")[0].value+`">
      </div>
      `
      res[0].innerHTML = list;
      if (i!=2){
        for (let z = 2; z < i; z++){
          document.getElementById("a"+z).value=xpmin[z-2]
          document.getElementById("b"+z).value=xpmax[z-2]
          document.getElementById("c"+z).value=trait[z-2]
          document.getElementById("d"+z).value=zone[z-2]
        }
      }
      document.getElementById("app-"+d.appId).style.height="auto"
      alea = alea -1;
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
      $(document).ready(function() {
        document.getElementById("app-"+d.appId).style.height="auto"
        $("[class=validation]").click(ev2 => {
          let id_ev = ev.currentTarget.id
          let variable=[]
          for (let env = 1; env < 38; env++){
            if (document.getElementById("zone"+env).checked){
              variable.push(document.getElementById("zone"+env).name)
            }
          }
          document.getElementById(id_ev).value=variable
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
        <button class="validation" type="button">Ok</button>
        `,
        buttons: {
        }
      });
      e.render(true);
      $(document).ready(function() {
        document.getElementById("app-"+d.appId).style.height="auto"
        $("[class=validation]").click(ev2 => {
          let id_ev = ev.currentTarget.id
          let variable=[]
          for (let env = 1; env < 25; env++){
            if (document.getElementById("zone"+env).checked){
              variable.push(document.getElementById("zone"+env).name)
            }
          }
          document.getElementById(id_ev).value=variable
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
      <button class="validation" type="button">Ok</button>
      `,
      buttons: {
      }
    });
    e.render(true);
    $(document).ready(function() {
      document.getElementById("app-"+d.appId).style.height="auto"
      $("[class=validation]").click(ev2 => {
        let id_ev = ev.currentTarget.id
        let variable=[]
        for (let env = 1; env < 25; env++){
          if (document.getElementById("zone"+env).checked){
            variable.push(document.getElementById("zone"+env).name)
          }
        }
        document.getElementById(id_ev).value=variable
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
    $(document).ready(function() {
      document.getElementById("app-"+d.appId).style.height="auto"
      $("[class=validation]").click(ev2 => {
        let id_ev = ev.currentTarget.id
        let variable=[]
        for (let env = 1; env < 38; env++){
          if (document.getElementById("zone"+env).checked){
            variable.push(document.getElementById("zone"+env).name)
          }
        }
        document.getElementById(id_ev).value=variable
        e.close()
      })
    })
  })
})
//-------------------------