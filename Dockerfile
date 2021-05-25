FROM cloudron/base:3.0.0@sha256:455c70428723e3a823198c57472785437eb6eab082e79b3ff04ea584faf46e92

ARG RELEASE=2021-04-25

RUN mkdir -p /app/code
WORKDIR /app/code

COPY config.ini.php start.sh /app/pkg/

RUN \
# Install RSS-Bridge
    curl -Ls https://github.com/RSS-Bridge/rss-bridge/archive/${RELEASE}.tar.gz | tar -xzf - --strip 1 -C /app/code \
    && chown -R www-data.www-data /app/code

RUN rm -rf /app/code/cache && \
    ln -s /app/data/cache /app/code/cache && \
    ln -s /app/data/config.ini.php /app/code/config.ini.php

# configure apache
RUN rm /etc/apache2/sites-enabled/*
RUN sed -e 's,^ErrorLog.*,ErrorLog "|/bin/cat",' -i /etc/apache2/apache2.conf
COPY apache/mpm_prefork.conf /etc/apache2/mods-available/mpm_prefork.conf

RUN a2disconf other-vhosts-access-log
RUN a2enmod rewrite
COPY apache/rss-bridge.conf /etc/apache2/sites-enabled/rss-bridge.conf
RUN echo "Listen 8000" > /etc/apache2/ports.conf
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Configure mod_php
RUN a2enmod headers

CMD [ "/app/pkg/start.sh" ]
