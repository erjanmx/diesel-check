#!/bin/bash

#git reset --hard origin/master
#git pull

source ~/.nvm/nvm.sh
nvm install 12 && npm install && npm start

git add db/topics.json
git commit -m "Update topics"
git push origin master
