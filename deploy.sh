#!/bin/sh
cd $HOME
wget -O $3.tar.gz https://gitlab.com/api/v4/projects/$1/repository/archive?private_token=$2
tar zxf $3.tar.gz
cp -R *-master-*/* $3
rm -r $3.tar.gz *-master-*
cd $3
npm install
sudo pm2 reload app