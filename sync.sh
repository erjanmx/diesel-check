#!/bin/bash

cd /home/emx/projects/ipchecker-node/
/usr/bin/git pull
/usr/bin/git add -A 
/usr/bin/git commit -am "Update db.json"
/usr/bin/git push -u origin master
