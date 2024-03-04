#!/bin/bash
#https://github.com/foundryvtt/foundryvtt-cli
cd ../packs
for f in *
do
    cd ./$f
    rm -r _source
    fvtt package unpack $f
    cd ..
done

