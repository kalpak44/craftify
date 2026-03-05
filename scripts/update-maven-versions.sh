#!/usr/bin/env bash

repoPath="../backend"

mvn versions:update-parent \
  -f "${repoPath}/pom.xml" \
  -Dmaven.version.ignore=".*[^0-9.].*" \
  -DallowSnapshots=false \
  -DgenerateBackupPoms=false

mvn versions:update-properties \
  -f "${repoPath}/pom.xml" \
  -Dmaven.version.ignore=".*[^0-9.].*" \
  -DallowSnapshots=false \
  -DgenerateBackupPoms=false
