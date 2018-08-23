#!/bin/bash
node ./node_modules/.bin/tsc
cp -R ./src/assets/* ./build/assets
sshpass -p raspberry scp -r build pi@pizero:./enail-magic/
sshpass -p raspberry scp package.json pi@pizero:./enail-magic/
sshpass -p raspberry ssh -t -f pi@pizero bash -c "./enail-magic/restart.sh"
