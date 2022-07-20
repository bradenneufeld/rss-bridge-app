#!/bin/bash

set -eu

mkdir -p /app/data/cache
mkdir -p /app/data/config

[[ ! -f /app/data/config.ini.php ]] && cp /app/pkg/config.ini.php /app/data/config.ini.php
[[ ! -f /app/data/config/nginx.conf ]] && cp /app/pkg/nginx.conf /app/data/config/nginx.conf
[[ ! -f /app/data/whitelist.txt ]] && echo "*" > /app/data/whitelist.txt

echo "==> Changing permissions"
chmod 777 -R /app/data/cache
chmod 777 -R /app/data/config
chown -R www-data:www-data /app/data/

echo "==> Staring RSS-Bridge"

APACHE_CONFDIR="" source /etc/apache2/envvars
rm -f "${APACHE_PID_FILE}"
exec /usr/sbin/apache2 -DFOREGROUND
