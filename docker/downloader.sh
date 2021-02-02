#!/usr/bin/env bash

# Read from the environment the which version to download
# Defaults to "latest"
VERSION=${VERSION:-"latest"}

# A helper function for scoped logging
function log {
  echo "[DOWNLOADER] $1"
}

# Make sure that `GITHUB_API_TOKEN` is defined
if [[ -z "$GITHUB_API_TOKEN" ]]; then
  log "Missing GITHUB_API_TOKEN environment variable"
  exit 1
fi

AUTH="Authorization: token $GITHUB_API_TOKEN"

# If version is "latest", resolve the latest version number
if [[ "$VERSION" == "latest" ]]; then
    VERSION=$(curl --cacert /etc/ssl/certs/ca-certificates.crt -H "$AUTH" https://api.github.com/repos/stampery-labs/aragon-govern-discord-integration/releases/latest | sed -En "s/.*\"tag_name\": \"([0-9|\.]+)\",/\1/p" | head -1)
fi

# The URL of the release file, and the name that will be used when downloaded
URL="https://api.github.com/repos/stampery-labs/aragon-govern-discord-integration/tarball/$VERSION"
FILENAME="release.tar.gz"

# Download and extract release bundle
log "Downloading version $VERSION ('$FILENAME') from '$URL'. This may take a few seconds..."
curl --cacert /etc/ssl/certs/ca-certificates.crt -LH "$AUTH" -o "/tmp/$FILENAME" "$URL" &&
tar -zxf "/tmp/$FILENAME" --directory "/tmp/" &&
mv /tmp/stampery-labs-aragon-govern-discord-integration-* /data/source &&
# Clean after ourselves
rm -f "/tmp/$FILENAME" &&
# Show success or error message
log "Succesfully downloaded and extracted '$FILENAME'" ||
log "Error downloading and installing version $VERSION"