!/bin/bash

git reset --hard origin/master
git pull

npm start

git add db/topics.json
git commit -m "Update topics"
git push origin master
