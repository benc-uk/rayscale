#!/bin/bash

# Compile TypeScript
echo "*** Transpiling TypeScript..."
node node_modules/typescript/bin/tsc

# Trap exit/sigterm and close down all processes
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

echo "*** Starting $1 tracers..."

# Start up tracers
for i in `seq 1 $1`;
do
  tracerPort=$((8549+$i))
  export PORT=$tracerPort
  node dist/server.js &
  sleep 0.1
done 

# Hold and wait
echo "*** Press [CTRL+C] to terminate all tracers"
sleep infinity
