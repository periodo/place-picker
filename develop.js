'use strict'

const { render } = require('react-dom')
const { Provider, connect } = require('react-redux')
const { createStore } = require('redux')
const h = require('react-hyperscript')
const { ThemeProvider } = require('@zendeskgarden/react-theming')

const indexFeatures = (features, gazetteer) => {
  gazetteer.features.forEach(feature => {
    features[feature.id] = feature
  })
  return features
}

const gazetteers = Object.values(require('./places').graphs)
const features = gazetteers.reduce(indexFeatures, {})

const featureFocused = key => ({type: 'FEATURE_FOCUSED', key})
const featuresSelected = keys => ({type: 'FEATURES_SELECTED', keys})
const suggestionsRequested = query => ({type: 'SUGGESTIONS_REQUESTED', query})

const capitalize = s => s.replace(/(?:^|\s)\S/g, a => a.toUpperCase())

const renderSuggestion = (suggestion, match) => {
  const begin = match.search(suggestion)
  if (begin < 0) {
    return h('span', suggestion)
  } else {
    return h('span', [
      suggestion.slice(0, begin),
      h('strong', capitalize(match.query)),
      suggestion.slice(begin + match.query.length)
    ])
  }
}

const escapeRegexCharacters = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const matcher = query => {
  const trimmedQuery = query.trim()
  const escapedQuery = escapeRegexCharacters(trimmedQuery)
  if (escapedQuery === '') {
    return {
      // match everything on empty query
      test: () => true,
      search: () => -1
    }
  }
  const regex = new RegExp('\\b' + escapedQuery, 'i')
  return {
    test: s => regex.test(s),
    search: s => s.search(regex),
    query: trimmedQuery
  }
}

const matches = query => {
  const match = matcher(query)

  return (matched, feature) => {
    const add = (key, label) => {
      matched.push([key, renderSuggestion(label, match), label])
      return matched
    }

    if (! (feature && feature.properties)) {
      return matched
    }
    if (match.test(feature.properties.title)) {
      return add(feature.id, feature.properties.title)
    }
    if (! feature.names) {
      return matched
    }
    for (let name of feature.names) {
      if (match.test(name.toponym)) {
        return add(feature.id, name.toponym)
      }
    }
    return matched
  }
}

const getSuggestions = (query = '') => gazetteers
  .map(gazetteer => ({
    title: gazetteer.title,
    suggestions: gazetteer.features.reduce(matches(query), [])
  }))
  .filter(section => section.suggestions.length > 0)


const keysToFeatures = keys => {
  const o = {}
  keys.forEach(key => { o[key] = features[key] })
  return o
}

const initialState = {
  suggestions: getSuggestions(),
  selectedFeatures: {},
  focusedFeature: undefined
}

const app = (state = initialState, action) => {
  switch (action.type) {
  case 'FEATURE_FOCUSED':
    return {...state, ...{focusedFeature: features[action.key]}}
  case 'FEATURES_SELECTED':
    return {...state, ...{selectedFeatures: keysToFeatures(action.keys)}}
  case 'SUGGESTIONS_REQUESTED':
    return {...state, ...{suggestions: getSuggestions(action.query)}}
  default:
    return state
  }
}

const store = createStore(
  app,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

const MultiSelect = connect(
  ({suggestions, selectedFeatures}) => (
    {
      placeholder: 'Search for a place name',
      suggestions,
      selectedKeys: new Set(Object.keys(selectedFeatures)),
      renderSelectedKey: key => selectedFeatures[key].properties.title,
      renderSectionTitle: section => section.title,
      getSectionSuggestions: section => section.suggestions,
    }
  ),
  dispatch => (
    {
      onFocusChange: key => dispatch(featureFocused(key)),
      onSelectionChange: keys => dispatch(featuresSelected(keys)),
      onSuggestionsRequested: query => dispatch(suggestionsRequested(query))
    }
  )
)(require('./MultiSelect'))

const Map = connect(
  ({selectedFeatures, focusedFeature}) => ({
    features: Object.values(selectedFeatures),
    focusedFeature
  }),
)(require('./Map'))

const FeatureLabel = connect(
  ({focusedFeature}) => ({feature: focusedFeature})
)(require('./FeatureLabel'))

render(
  h(ThemeProvider, [
    h(Provider, {store},
      [
        h(Map, {key: 1}),
        h(FeatureLabel, {key: 2}),
        h(MultiSelect, {key: 3})
      ]
    )
  ]),
  document.body.appendChild(document.createElement('div'))
)
