#!/bin/bash

npm install
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
git add .
git commit -m "Deploy app"
git push origin master
