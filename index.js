'use strict'

const { useState } = require('react')
const h = require('react-hyperscript')
const Autosuggest = require('react-autosuggest')

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/
// Regular_Expressions#Using_special_characters
const escapeRegexCharacters = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getSuggestions = (gazetteers, value) => {
  const escapedValue = escapeRegexCharacters(value.trim())

  if (escapedValue === '') {
    return []
  }

  const regex = new RegExp('^' + escapedValue, 'i')
  const matches = feature => {
    if (! (feature && feature.properties)) {
      return false
    }
    if (regex.test(feature.properties.title)) {
      return true
    }
    if (! feature.names) {
      return false
    }
    for (let name of feature.names) {
      if (regex.test(name.toponym)) {
        return true
      }
    }
    return false
  }

  return gazetteers
    .map(gazetteer => ({
      title: gazetteer.title,
      features: gazetteer.features.filter(matches)
    }))
    .filter(gazetteer => gazetteer.features.length > 0)
}

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
        suggestion => suggestion.properties.title,
      renderSuggestion:
        suggestion => h('div', suggestion.properties.title),
      renderSectionTitle:
        section => h('strong', section.title),
      getSectionSuggestions:
        section => section.features
    }
  )
}
