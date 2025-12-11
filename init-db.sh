#!/bin/bash
set -e

# This script runs only on first database initialization
# Configure pg_hba.conf to allow connections from any host with scram-sha-256 (PostgreSQL 16 default)
echo "host    all             all             0.0.0.0/0               scram-sha-256" >> "$PGDATA/pg_hba.conf"

