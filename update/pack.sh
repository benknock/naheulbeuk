#!/bin/bash
cd ../packs
for f in *
do
    cd ./$f
    fvtt package pack $f
    rm -r _source
    cd ..
done

