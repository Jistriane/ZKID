#!/bin/bash
set -e

echo "Building zkid-sdk..."
cd ../../sdk/zkid-sdk
npm install
npm run build

echo "Building frontend..."
cd ../../frontend/zkid-app
npm run build
