#!/bin/bash
cd ../packs
touch all.txt
listitem=("accessoires-magiques.db" "ape.db" "armes.db" "armespoudre.db" "armures.db" "bestiaire-items.db" "blessures-graves.db" "competences-b.db" "competences-h.db" "competences-a.db" "coups-speciaux.db" "couvre-chefs.db" "equipements-pour-mages.db" "equipements-pour-pretres.db" "folies.db" "immobilier.db" "ingredients.db" "instruments.db" "livres.db" "maladies.db" "objet-inge.db" "maps.db" "metiers.db" "mutations.db" "objets-exclusifs.db" "origines.db" "pieges.db" "plan-inge.db" "potions-poisons.db" "prieres-pretres-adathie.db" "prieres-paladins-braav.db" "prieres-paladins-niourgl.db" "prieres-pretres-niourgl.db" "prieres-paladin-dlul.db" "prieres-paladin-khornettoh.db" "prieres-paladin-slanoush.db" "prieres-pretre-dlul.db" "prieres-pretre-slanoush.db" "prieres-pretre-youclidh.db" "reliques.db" "services.db" "soldats-items.db" "soldats.db" "sorts-air.db" "sorts-chamane.db" "sorts-combat.db" "sorts-eau.db" "sorts-feu.db" "sorts-generaliste.db" "sorts-invocateur.db" "sorts-item.db" "sorts-meta.db" "sorts-necro.db" "sorts-terre.db" "sorts-thermo.db" "sorts-tzinntch.db" "specialites.db" "trucs.db")

listactor=("bestiaire.db" "montures.db" "pretires.fb")

for f in *.db
do
    echo "$f"
    touch test2.txt
    for list in ${listitem[*]}
    do
        if [ $(echo "$f") == $(echo "$list") ]
        then
            while read line; 
            do
                lenght=$(echo ${#line})
                line2=$(echo ${line:1:$lenght})
                comp='{"compendium":"'
                comp2='",'
                echo "$comp$f$comp2$line2" | sed 's/.db//' | sed 's/"} //g' | sed 's/} //g' | sed 's/]{/]/g' | sed 's/{"/{||||/g' | sed 's/"}/||||}/g' | sed 's/,"/,||||/g' | sed 's/",/||||,/g' | sed 's/:"/:||||/g' | sed 's/":/||||:/g' | sed 's/"//g' | sed 's/||||/"/g' | sed 's/", /, /g'>>test2.txt
            done < $f
            cat test2.txt>>all.txt
        fi
    done
    rm test2.txt
done
allObj=$(cat all.txt)
finalallObj=$(echo "export const all_items_search = |||$allObj|||")
echo "$finalallObj" | sed 's/|||/`/g' > ../module/documents/items.gen.mjs
rm all.txt

for f in *.db
do
    echo "$f"
    touch test2.txt
    for list in ${listactor[*]}
    do
        if [ $(echo "$f") == $(echo "$list") ]
        then
            while read line; 
            do
                lenght=$(echo ${#line})
                line2=$(echo ${line:1:$lenght})
                comp='{"compendium":"'
                comp2='",'
                echo "$comp$f$comp2$line2" | sed 's/.db//' | sed 's/"} //g' | sed 's/} //g' | sed 's/]{/]/g' | sed 's/{"/{||||/g' | sed 's/"}/||||}/g' | sed 's/,"/,||||/g' | sed 's/",/||||,/g' | sed 's/:"/:||||/g' | sed 's/":/||||:/g' | sed 's/"//g' | sed 's/||||/"/g' | sed 's/", /, /g'>>test2.txt
            done < $f
            cat test2.txt>>all.txt
        fi
    done
    rm test2.txt
done
allObj=$(cat all.txt)
finalallObj=$(echo "export const all_actors_search = |||$allObj|||")
echo "$finalallObj" | sed 's/|||/`/g' > ../module/documents/actors.gen.mjs
rm all.txt

cd ..
git add *
git commit -a

if [ -d ../updateNaheulbeuk ]; then
    rm -R ../updateNaheulbeuk
fi
mkdir ../updateNaheulbeuk
cd ../updateNaheulbeuk
mv ../naheulbeuk/.git/ .
cp ../naheulbeuk/system.json ./system.json
cd ..
zip -r system.zip naheulbeuk/
cd updateNaheulbeuk
mv ../system.zip .
mv .git ../naheulbeuk/
echo "done !"