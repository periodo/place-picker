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

tiles:
	dat clone \
	dat://db9c54fd4775da34109c9afd366cac5d3dff26c6a3902fc9c9c454193b543cbb \
	$@

####

develop: node_modules places.json tiles
	$(NPM_BIN)/budo develop.js --css styles.css --live --open

clean:
	rm places.json
	rm -rf dist
	rm -rf node_modules

.PHONY: develop clean
