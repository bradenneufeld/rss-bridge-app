#!/bin/bash

set -eu

mkdir -p /app/data

echo "==> Changing permissions"
chmod 777 -R /app/data/cache
chown -R www-data:www-data /app/data/

echo "==> Staring RSS-Bridge"

APACHE_CONFDIR="" source /etc/apache2/envvars
rm -f "${APACHE_PID_FILE}"
exec /usr/sbin/apache2 -DFOREGROUND
