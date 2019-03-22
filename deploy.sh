#!/bin/bash

npm run build
git branch -D master
git checkout -b master

for x in *
do
  if [ "$x" != "build" ] && [ "$x" != "deploy.sh" ]
  then
    rm -rf $x;
  fi
done;

cd build
mv * ../.
cd ..
rm -rf build
git push origin master
