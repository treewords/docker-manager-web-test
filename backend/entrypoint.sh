#!/bin/sh
# Set correct permissions on the data directory
chown -R appuser:appgroup /usr/src/app/data
# Execute the main container command
exec "$@"
