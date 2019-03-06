'use strict'

const { useState } = require('react')
const h = require('react-hyperscript')

const { TextGroup } = require(
  '@zendeskgarden/react-textfields')
const { FieldContainer } = require(
  '@zendeskgarden/react-selection')
const { AutocompleteContainer } = require(
  '@zendeskgarden/react-autocomplete')

const suggestionListCreator = require('./suggestion-list-creator')
const suggestionTriggerCreator = require('./suggestion-trigger-creator')

module.exports = function({
  placeholder,
  suggestions,
  selectedKeys,
  renderSelectedKey,
  renderSectionTitle,
  getSectionSuggestions,
  onFocusChange,
  onSelectionChange,
  onSuggestionsRequested
}) {

  const [inputValue, setInputValue] = useState('')
  const [focusedKey, setFocusedKey] = useState(undefined)
  const [tagFocusedKey, setTagFocusedKey] = useState(undefined)
  const [isFocused, setFocused] = useState(false)
  const [isOpen, setOpen] = useState(false)
  const [wrapperRef, setWrapperRef] = useState(undefined)

  const setQuery = query => {
    setInputValue(query)
    onSuggestionsRequested(query)
  }

  const onSelect = key => {
    const newSelectedKeys = new Set(selectedKeys)
    if (newSelectedKeys.has(key)) {
      newSelectedKeys.delete(key)
    } else {
      newSelectedKeys.add(key)
    }
    setInputValue('')
    onSelectionChange(newSelectedKeys)
    return true // returning true keeps the menu open
  }

  const onStateChange = newState => {
    const oldFocus = focusedKey || tagFocusedKey
    const newFocus = newState.focusedKey || newState.tagFocusedKey
    if (newFocus !== oldFocus) {
      onFocusChange(newFocus)
    }
    Object.keys(newState).forEach(key => {
      if (key === 'focusedKey') {
        setFocusedKey(newState.focusedKey)

      } else if (key === 'tagFocusedKey') {
        setTagFocusedKey(newState.tagFocusedKey)

      } else if (key === 'isOpen') {
        setOpen(newState.isOpen)
        if (! newState.isOpen) {
          setQuery('')
        }
      }
    })
  }

  return (
    h(FieldContainer, [
      ({ getInputProps: getFieldInputProps }) => (
        h(TextGroup, {style: {maxWidth: 400, minHeight: 300}}, [
          h(AutocompleteContainer,
            {
              isOpen,
              tagFocusedKey,
              focusedKey,
              onSelect,
              onStateChange,
              trigger: suggestionTriggerCreator(
                placeholder,
                inputValue,
                setQuery,
                selectedKeys,
                renderSelectedKey,
                onSelectionChange,
                isFocused,
                setFocused,
                onFocusChange,
                setWrapperRef,
                getFieldInputProps
              )
            },
            [
              suggestionListCreator(
                suggestions,
                selectedKeys,
                getSectionSuggestions,
                renderSectionTitle,
                wrapperRef
              )
            ]
          ) // end AutocompleteContainer
        ]) // end TextGroup
      )
    ]) // end FieldContainer
  )
}
