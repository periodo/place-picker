'use strict'

const h = require('react-hyperscript')

const description = feature => feature.descriptions
  ? feature.descriptions
    .map(description => description.value)
    .join(' | ')
  : ''

const names = (feature, title) => feature.names
  ? feature.names
    .filter(name => name.toponym !== title)
    .map(name => name.toponym)
    .join(' | ')
  : ''

module.exports = function({feature}) {
  if (feature && feature.properties && feature.properties.title) {
    return h('section', [
      h('h1', {key: 1}, feature.properties.title),
      h('p', {key: 2}, names(feature, feature.properties.title)),
      h('p', {key: 3}, description(feature))
    ])
  } else {
    return null
  }
}
