#!/bin/bash
#https://github.com/foundryvtt/foundryvtt-cli
cd ../packs
for f in *
do
    cd $f
    fvtt package pack $f
    rm -r _source
    cd ..
done

