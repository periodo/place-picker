'use strict'

const { useState } = require('react')
const h = require('react-hyperscript')
const styled = require('styled-components').default

const { ThemeProvider } = require(
  '@zendeskgarden/react-theming')
const { MenuView, Item } = require(
  '@zendeskgarden/react-menus')
const { FauxInput, Input, TextGroup } = require(
  '@zendeskgarden/react-textfields')
const { KEY_CODES, FieldContainer } = require(
  '@zendeskgarden/react-selection')
const { Tag, Close } = require(
  '@zendeskgarden/react-tags')
const { Anchor } = require(
  '@zendeskgarden/react-buttons')
const { AutocompleteContainer } = require(
  '@zendeskgarden/react-autocomplete')

const NoItemsMessage = styled.div`
  margin: 16px;
  text-align: center;
`

const SpacedTag = styled(Tag)`
  margin: 2px;
`

const MoreAnchor = styled(Anchor)`
  margin: 2px !important;
`

const initialSelectedKeys = {
  Alfa: true,
  Bravo: true,
  Hotel: true,
  India: true,
  Juliett: true,
  November: true,
  Sierra: true,
  Yankee: true,
  Zulu: true
}

const natoPhonetics = [
  'Alfa',
  'Bravo',
  'Charlie',
  'Delta',
  'Echo',
  'Foxtrot',
  'Golf',
  'Hotel',
  'India',
  'Juliett',
  'Kilo',
  'Lima',
  'Mike',
  'November',
  'Oscar',
  'Papa',
  'Quebec',
  'Romeo',
  'Sierra',
  'Tango',
  'Uniform',
  'Victor',
  'Whiskey',
  'X-ray',
  'Yankee',
  'Zulu'
]

const stringContains = (original, comparison) => {
  const formattedOriginal = original.replace(/ /g, '').toLocaleLowerCase()
  const formattedComparison = comparison.replace(/ /g, '').toLocaleLowerCase()

  return (formattedOriginal.indexOf(formattedComparison) !== -1)
}

const getMatchingMenuItems = (
  searchValue, selectedValues, getItemProps, focusedKey
) => {
  const menuItems = natoPhonetics
    .filter(phonetic => stringContains(phonetic, searchValue))
    .map(phonetic => h(
      Item,
      getItemProps({
        key: phonetic,
        focused: focusedKey === phonetic,
        checked: selectedValues[phonetic],
        'aria-selected': selectedValues[phonetic]
      }),
      phonetic
    ))
  return menuItems.length === 0
    ? h(NoItemsMessage, 'No items found')
    : menuItems
}

module.exports = function() {
  const [inputValue, setInputValue] = useState('')
  const [selectedKeys, setSelectedKeys] = useState(initialSelectedKeys)
  const [isFocused, setFocused] = useState(false)
  const [isOpen, setOpen] = useState(false)
  const [focusedKey, setFocusedKey] = useState(undefined)
  const [tagFocusedKey, setTagFocusedKey] = useState(undefined)
  const [wrapperRef, setWrapperRef] = useState(undefined)

  const onSelect = key => {
    const newSelectedKeys = { ...selectedKeys }
    if (newSelectedKeys[key]) {
      delete newSelectedKeys[key]
    } else {
      newSelectedKeys[key] = true
    }
    setSelectedKeys(newSelectedKeys)
    setInputValue('')
    return true
  }

  const onStateChange = newState => {
    Object.keys(newState).forEach(key => {
      if (key === 'focusedKey') {
        setFocusedKey(newState.focusedKey)
      } else if (key === 'tagFocusedKey') {
        setTagFocusedKey(newState.tagFocusedKey)
      } else if (key === 'isOpen') {
        setOpen(newState.isOpen)
        if (! newState.isOpen) {
          setInputValue('')
        }
      }
    })
  }

  const onDeleteTag = key => {
    const newSelectedKeys = { ...selectedKeys }
    delete newSelectedKeys[key]
    setSelectedKeys(newSelectedKeys)
    setTagFocusedKey(undefined)
  }

  const renderTags = (isFocused, selectedKeys, tagFocusedKey, getTagProps) => {
    const keys = Object.keys(selectedKeys)

    const keyToTag = key => h(
      SpacedTag,
      getTagProps({ key, focused: tagFocusedKey === key }),
      [ key, h(Close, {onClick: () => onDeleteTag(key)}) ]
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

  const onKeyDown = e => {
    if (e.keyCode === KEY_CODES.DELETE || e.keyCode === KEY_CODES.BACKSPACE) {
      if (tagFocusedKey !== undefined) {
        onDeleteTag(tagFocusedKey)
        return
      }
      if (e.target.value === '') {
        const tags = Object.keys(selectedKeys)
        onDeleteTag(tags[tags.length - 1])
      }
    }
  }

  const isDefined = x => (typeof(x) !== 'undefined')

  const isEmpty = o => (Object.keys(o).length === 0)

  const focused = (isOpen, tagFocusedKey) => (
    isOpen || isDefined(tagFocusedKey) || isFocused
  )

  const hide = (isOpen, tagFocusedKey) => (
    (! isEmpty(selectedKeys)) &&
    (! focused(isOpen, tagFocusedKey))
  )

  const trigger = getFieldInputProps => ({
    getTriggerProps,
    getInputProps,
    getTagProps,
    triggerRef,
    inputRef,
    isOpen,
    tagFocusedKey
  }) => h(
    FauxInput,
    getTriggerProps({
      open: isOpen,
      small: true,
      select: true,
      tagLayout: true,
      focused: focused(isOpen, tagFocusedKey),
      inputRef: ref => {
        setWrapperRef(ref)
        triggerRef(ref)
      }
    }),
    [
      renderTags(
        focused(isOpen, tagFocusedKey),
        selectedKeys,
        tagFocusedKey,
        getTagProps
      ),
      h(
        Input,
        getInputProps(
          getFieldInputProps({
            bare: true,
            innerRef: inputRef,
            value: inputValue,
            onChange: e => setInputValue(e.target.value),
            onKeyDown,
            placeholder: isEmpty(selectedKeys) ? 'Place name' : undefined,
            onFocus: () => setFocused(true),
            onBlur: () => setFocused(false),
            style: Object.assign(
              { margin: '0 2px', flexGrow: 1, width: 60 },
              hide(isOpen, tagFocusedKey)
                ? { opacity: 0, height: 0, minHeight: 0 }
                : {}
            )
          },
          { isDescribed: false })
        )
      )
    ]
  )

  return (
    h(ThemeProvider, [
      //------------------------------------------------------------------------
      h(FieldContainer, [
        ({ getInputProps: getFieldInputProps }) => (
          //--------------------------------------------------------------------
          h(TextGroup, {style: {maxWidth: 400, minHeight: 300}}, [
            //------------------------------------------------------------------
            h(AutocompleteContainer, {
              isOpen,
              tagFocusedKey,
              focusedKey,
              onSelect,
              onStateChange,
              trigger: trigger(getFieldInputProps) }, [
              ({ getMenuProps, getItemProps, placement, focusedKey }) => {
                //--------------------------------------------------------------
                return h(MenuView, getMenuProps({
                  placement,
                  animate: true,
                  small: true,
                  style: {
                    width: wrapperRef
                      ? wrapperRef.getBoundingClientRect().width
                      : 0
                  }
                }), [
                  h('div', {style: {maxHeight: '150px', overflowY: 'auto'}},
                    getMatchingMenuItems(
                      inputValue,
                      selectedKeys,
                      getItemProps,
                      focusedKey
                    )
                  )
                ]) // end MenuView
                //--------------------------------------------------------------
              }
            ]) // end AutocompleteContainer
            //------------------------------------------------------------------
          ]) // end TextGroup
          //--------------------------------------------------------------------
        )
      ]) // end FieldContainer
      //------------------------------------------------------------------------
    ]) // end ThemeProvider
  )
}
