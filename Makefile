PROJECT_NAME := place-picker
NPM_BIN := node_modules/.bin
BROWSERIFY_ENTRY := src/index.js
JS_BUNDLE := dist/$(PROJECT_NAME).js

dist:
	mkdir -p $@

node_modules: package.json
	npm install

places.json:
	curl https://data.perio.do/graphs/places.json > $@

####

develop: node_modules places.json
	$(NPM_BIN)/budo develop.js --live --open

clean:
	rm places.json
	rm -rf dist
	rm -rf node_modules

.PHONY: develop clean
