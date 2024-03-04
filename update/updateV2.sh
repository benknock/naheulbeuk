#!/bin/bash
cd ../packs

for f in *
do
    cd ./$f
    rm -r _source
    fvtt package unpack $f
    cd ..
done

touch all.txt
listitem=("accessoires-magiques" "ape" "armes" "armespoudre" "armures" "bestiaire-items" "blessures-graves" "competences-b" "competences-h" "competences-a" "coups-speciaux" "couvre-chefs" "equipements-pour-mages" "equipements-pour-pretres" "folies" "immobilier" "ingredients" "instruments" "livres" "maladies" "objet-inge" "maps" "metiers" "mutations" "objets-exclusifs" "origines" "pieges" "plan-inge" "potions-poisons" "prieres-pretres-adathie" "prieres-paladins-braav" "prieres-paladins-niourgl" "prieres-pretres-niourgl" "prieres-paladin-dlul" "prieres-paladin-khornettoh" "prieres-paladin-slanoush" "prieres-pretre-dlul" "prieres-pretre-slanoush" "prieres-pretre-youclidh" "reliques" "services" "soldats-items" "soldats" "sorts-air" "sorts-chamane" "sorts-combat" "sorts-eau" "sorts-feu" "sorts-generaliste" "sorts-invocateur" "sorts-item" "sorts-meta" "sorts-necro" "sorts-terre" "sorts-thermo" "sorts-tzinntch" "specialites" "trucs")
listactor=("bestiaire" "montures" "pretires" "pretires-soldats")

for list in ${listitem[*]}
do
    cd $list/_source
    for file in *
    do
        content=$(cat $file)
        lenght=$(echo ${#content})
        line2=$(echo ${content:1:$lenght})
        comp='{"compendium":"'
        comp2='", '
        echo "$comp$list$comp2$line2">>../../all.txt
    done
    cd ../..
done
allObj=$(cat all.txt)
finalallObj=$(echo "export const all_items_search = |||$allObj|||")
echo "$finalallObj" | sed 's/|||/`/g' > ../module/documents/items.gen.mjs
rm all.txt

for list in ${listactor[*]}
do
    cd $list/_source
    for file in *
    do
        content=$(cat $file)
        lenght=$(echo ${#content})
        line2=$(echo ${content:1:$lenght})
        comp='{"compendium":"'
        comp2='", '
        echo "$comp$list$comp2$line2">>../../all.txt
    done
    cd ../..
done
allObj=$(cat all.txt)
finalallObj=$(echo "export const all_items_search = |||$allObj|||")
echo "$finalallObj" | sed 's/|||/`/g' > ../module/documents/actors.gen.mjs
rm all.txt

for f in *
do
    cd ./$f
    rm -r _source
    cd ..
done

cd ..
git add *
git commit -a

if [ -d ../../updateNaheulbeuk ]; then
    rm -R ../../updateNaheulbeuk
fi
mkdir ../../updateNaheulbeuk
cd ../../updateNaheulbeuk
mv ../systems/naheulbeuk/.git/ .
cp ../systems/naheulbeuk/system.json ./system.json
cd ../systems
zip -r system.zip naheulbeuk/
cd ../updateNaheulbeuk
mv ../systems/system.zip .
mv .git ../systems/naheulbeuk/
echo "done !"