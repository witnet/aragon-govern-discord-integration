#!/usr/bin/env bash
echo "┏━━━ LINT: prettier-standard **/*.ts ━━━━━━━"
yarn lerna run lint --stream --concurrency 1