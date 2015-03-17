#!/bin/bash
# First, publish docs
rm -rf publish_docs || exit 0;
mkdir publish_docs
cp -R docs/* publish_docs
cd publish_docs
git init
git config user.name "ZeusJS Build Bot"
git config user.email "zeusjs.bot@gmail.com"
git add .
git commit -m "Deployed to Github Pages"
git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1

cd ..

# Then publish build artifacts
rm -rf .travis_build || exit 0;
mkdir .travis_build
cd .travis_build
git clone "https://${GH_TOKEN}@${GH_REF}"
cd widgets
git config user.name "ZeusJS Build Bot"
git config user.email "zeusjs.bot@gmail.com"
cp -R ../../dist/* dist
git add dist/sass/*.scss dist/html/*.html dist/css/*.css dist/js/*.js
git commit dist -m "Publish latest build artifacts"
git push "https://${GH_TOKEN}@${GH_REF}" > /dev/null 2>&1
