#!/bin/bash
cd ../packs
touch all.txt
for f in *.db
do
    echo "$f"
    touch test2.txt
    if [ $(echo "$f") != "macros.db" ] && [ $(echo "$f") != "sorts-item.db" ] && [ $(echo "$f") != "non-tries.db" ] && [ $(echo "$f") != "bestiaire-items.db" ] && [ $(echo "$f") != "bestiaire.db" ] && [ $(echo "$f") != "notes.db" ] && [ $(echo "$f") != "tableauxcritiquesmaladresses.db" ] && [ $(echo "$f") != "tableaux.db" ] && [ $(echo "$f") != "tableauxape.db" ] && [ $(echo "$f") != "tableauxsoldat.db" ]
    then
        while read line; 
        do
            lenght=$(echo ${#line})
            line2=$(echo ${line:1:$lenght})
            comp='{"compendium":"'
            comp2='",'
            echo "$comp$f$comp2$line2" | sed 's/.db//' | sed 's/{"/{||||/g' | sed 's/"}/||||}/g' | sed 's/,"/,||||/g' | sed 's/",/||||,/g' | sed 's/:"/:||||/g' | sed 's/":/||||:/g' | sed 's/"//g' | sed 's/||||/"/g' | sed 's/", /, /g'>>test2.txt
        done < $f
        cat test2.txt>>all.txt
    fi
    rm test2.txt
done
allObj=$(cat all.txt)
finalallObj=$(echo "export const all_items_search = |||$allObj|||")
echo "$finalallObj" | sed 's/|||/`/g' > ../module/documents/items.gen.mjs
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
zip -r system.zip ../naheulbeuk/
mv .git ../naheulbeuk/