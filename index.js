'use strict'

const { useState } = require('react')
const h = require('react-hyperscript')
const Autosuggest = require('react-autosuggest')

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/
// Regular_Expressions#Using_special_characters
const escapeRegexCharacters = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const matches = regex => (matched, feature) => {
  if (! (feature && feature.properties)) {
    return matched
  }
  if (regex.test(feature.properties.title)) {
    matched.push({...feature, match: feature.properties.title})
    return matched
  }
  if (! feature.names) {
    return matched
  }
  for (let name of feature.names) {
    if (regex.test(name.toponym)) {
      matched.push({...feature, match: name.toponym})
      return matched
    }
  }
  return matched
}

const getSuggestions = (gazetteers, value) => {

  const escapedValue = escapeRegexCharacters(value.trim())

  if (escapedValue === '') {
    return []
  }

  const regex = new RegExp('^' + escapedValue, 'i')

  return gazetteers
    .map(gazetteer => ({
      title: gazetteer.title,
      features: gazetteer.features.reduce(matches(regex), [])
    }))
    .filter(gazetteer => gazetteer.features.length > 0)
}

const capitalize = s => s.replace(/(?:^|\s)\S/g, a => a.toUpperCase())

module.exports = function({gazetteers, onFeaturePicked}) {

  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const inputProps = {
    placeholder: 'Search for a place name',
    value,
    onChange: (event, { newValue }) => {
      setValue(newValue)
    }
  }

  return h(
    Autosuggest, {
      suggestions,
      inputProps,
      multiSection:
        true,
      onSuggestionsFetchRequested:
        ({ value }) => setSuggestions(getSuggestions(gazetteers, value)),
      onSuggestionsClearRequested:
        () => setSuggestions([]),
      onSuggestionSelected:
        (event, {suggestion}) => onFeaturePicked(suggestion),
      onSuggestionHighlighted:
        ({suggestion}) => {
          if (suggestion !== null) {
            onFeaturePicked(suggestion)
          }
        },
      getSuggestionValue:
        suggestion => suggestion.match,
      renderSuggestion:
        (suggestion, {query}) => h('div', [
          h('strong', {key: 1}, capitalize(query)),
          suggestion.match.slice(query.length)
        ]),
      renderSectionTitle:
        section => h('strong', section.title),
      getSectionSuggestions:
        section => section.features
    }
  )
}
