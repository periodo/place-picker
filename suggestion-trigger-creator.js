'use strict'

const h = require('react-hyperscript')
const styled = require('styled-components').default
const { KEY_CODES } = require('@zendeskgarden/react-selection')
const { FauxInput, Input } = require('@zendeskgarden/react-textfields')
const { Tag, Close } = require('@zendeskgarden/react-tags')
const { Anchor } = require('@zendeskgarden/react-buttons')

const SpacedTag = styled(Tag)`
  margin: 2px;
`

const MoreAnchor = styled(Anchor)`
  margin: 2px !important;
`

const isDefined = x => (typeof(x) !== 'undefined')

const focused = (isFocused, isOpen, tagFocusedKey) => (
  isOpen || isDefined(tagFocusedKey) || isFocused
)

const hidden = (selectedKeys, isFocused, isOpen, tagFocusedKey) => (
  (selectedKeys.size > 0) &&
  (! focused(isFocused, isOpen, tagFocusedKey))
)

const deleteTag = (key, selectedKeys, onSelectionChange, onFocusChange) => {
  const newSelectedKeys = new Set(selectedKeys)
  newSelectedKeys.delete(key)
  onSelectionChange(newSelectedKeys)
  onFocusChange(undefined)
}

const renderTags = (
  isFocused,
  selectedKeys,
  renderSelectedKey,
  onSelectionChange,
  tagFocusedKey,
  onFocusChange,
  getTagProps
) => {
  const keys = Array.from(selectedKeys)

  const keyToTag = key => h(
    SpacedTag,
    getTagProps({ key, focused: tagFocusedKey === key }),
    [
      renderSelectedKey(key),
      h(Close, {
        onClick: () => deleteTag(
          key, selectedKeys, onSelectionChange, onFocusChange
        )
      })
    ]
  )

  if (isFocused) {
    return keys.map(keyToTag)
  }

  // render unfocused view
  const tags = keys.slice(0, 4).map(keyToTag)
  if (keys.length > 4) {
    tags.push(h(
      MoreAnchor,
      {tabIndex: -1, key: 'more-anchor'},
      `+ ${keys.length - 4} more`
    ))
  }
  return tags
}

const keyDownHandler = (
  selectedKeys,
  onSelectionChange,
  tagFocusedKey,
  onFocusChange
) => e => {
  if (e.keyCode === KEY_CODES.DELETE || e.keyCode === KEY_CODES.BACKSPACE) {
    let keyToDelete = undefined
    if (tagFocusedKey !== undefined) {
      keyToDelete = tagFocusedKey
    }
    else if (e.target.value === '') {
      const keys = Array.from(selectedKeys)
      keyToDelete = keys[keys.length - 1]
    }
    if (keyToDelete !== undefined) {
      deleteTag(keyToDelete, selectedKeys, onSelectionChange, onFocusChange)
    }
  }
}

module.exports = (
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
) => ({
  getTriggerProps,
  getInputProps,
  getTagProps,
  triggerRef,
  inputRef,
  isOpen,
  tagFocusedKey
}) => (
  h(FauxInput,
    getTriggerProps({
      open: isOpen,
      small: true,
      select: true,
      tagLayout: true,
      focused: focused(isFocused, isOpen, tagFocusedKey),
      inputRef: ref => {
        setWrapperRef(ref)
        triggerRef(ref)
      }
    }),
    [
      renderTags(
        focused(isFocused, isOpen, tagFocusedKey),
        selectedKeys,
        renderSelectedKey,
        onSelectionChange,
        tagFocusedKey,
        onFocusChange,
        getTagProps
      ),
      h(
        Input,
        getInputProps(
          getFieldInputProps({
            bare: true,
            innerRef: inputRef,
            value: inputValue,
            onChange: e => setQuery(e.target.value),
            onKeyDown: keyDownHandler(
              selectedKeys,
              onSelectionChange,
              tagFocusedKey,
              onFocusChange
            ),
            placeholder: (selectedKeys.size > 0) ? undefined : placeholder,
            onFocus: () => setFocused(true),
            onBlur: () => setFocused(false),
            style: Object.assign(
              { margin: '0 2px', flexGrow: 1, width: 60 },
              hidden(selectedKeys, isFocused, isOpen, tagFocusedKey)
                ? { opacity: 0, height: 0, minHeight: 0 }
                : {}
            )
          },
          { isDescribed: false })
        )
      )
    ]
  )
)
