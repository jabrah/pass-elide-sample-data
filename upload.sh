#!/bin/bash

PREFIX="http://localhost:8080/api/v1"
ACCEPT="accept: application/vnd.api+json"
CONTENT_TYPE="Content-Type: application/vnd.api+json"

curl -X POST "http://localhost:8080/api/v1/journal" \
-H "accept: application/vnd.api+json" \
-H "Content-Type: application/vnd.api+json" \
-d '{ "data": }'

curl -X POST "$PREFIX/user" -H $ACCEPT -H $CONTENT_TYPE -d @data/users.json
curl -X POST "$PREFIX/journal" -H $ACCEPT -H $CONTENT_TYPE -d @data/journals.json
curl -X POST "$PREFIX/publication" -H $ACCEPT -H $CONTENT_TYPE -d @data/publications.json
curl -X POST "$PREFIX/repository" -H $ACCEPT -H $CONTENT_TYPE -d @data/repositories.json
curl -X POST "$PREFIX/policy" -H $ACCEPT -H $CONTENT_TYPE -d @data/policies.json
curl -X POST "$PREFIX/funder" -H $ACCEPT -H $CONTENT_TYPE -d @data/funders.json
curl -X POST "$PREFIX/grant" -H $ACCEPT -H $CONTENT_TYPE -d @data/grants.json
curl -X POST "$PREFIX/submission" -H $ACCEPT -H $CONTENT_TYPE -d @data/submissions.json

cat ./data/users.json | jq '.[]' --compact-output | curl -X POST "$PREFIX/funder" -H $ACCEPT -H $CONTENT_TYPE 
cat data/users.json | jq -c '.[]' | xargs -L1 -I'{}' curl -X POST http://localhost:8080/api/v1/user -H 'accept: application/vnd.api+json' -H 'Content-Type: application/vnd.api+json' -d '{}'