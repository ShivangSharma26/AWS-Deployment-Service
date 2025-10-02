#!/usr/bin/bash

# Exporting the environment variable to be used by the Node.js script
export GIT_REPOSITORY__URL="$GIT_REPOSITORY__URL"

# Clone the repository to the output directory
git clone "$GIT_REPOSITORY__URL" /home/app/output

# Execute the Node.js script. 'exec' replaces the current shell process with the node process.
exec node script.js