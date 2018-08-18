call node_modules\.bin\tsc
xcopy src\profiles\profiles.json build\profiles\profiles.json /y
pscp -pw raspberry -r build pi@pizero:./enail-magic
pscp -pw raspberry package.json pi@pizero:./enail-magic
plink -pw raspberry pi@pizero bash -c "./enail-magic/restart.sh"
