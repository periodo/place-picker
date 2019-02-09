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
  const matches = feature => regex.test(feature.properties.title)

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
    onChange: (event, { newValue }) => setValue(newValue)
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
        ({suggestion}) => onFeaturePicked(suggestion),
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
