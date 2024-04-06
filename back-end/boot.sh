#!/bin/bash

while true; do
    flask db upgrade
    if [ "$?" == "0" ]; then
        break
    fi
    echo "Failed to apply the migration to the database, retrying in 3 secs..."
    sleep 3
done
flask deploy
exec gunicorn madblog:app -c gunicorn.conf.py
