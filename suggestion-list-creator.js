'use strict'

const h = require('react-hyperscript')
const styled = require('styled-components').default
const { MenuView, HeaderItem, Item, Separator } = require(
  '@zendeskgarden/react-menus')

const NoItemsMessage = styled.div`
  margin: 16px;
  text-align: center;
`

const render = (
  suggestions,
  selectedKeys,
  getSectionSuggestions,
  renderSectionTitle,
  getItemProps,
  focusedKey
) => {

  const toMenuItems = (menuItems, section) => {
    menuItems.push(h(HeaderItem, renderSectionTitle(section)))
    getSectionSuggestions(section)
      .sort((a,b) => a[2].localeCompare(b[2]))
      .forEach(([key, suggestion]) => {
        menuItems.push(
          h(
            Item,
            getItemProps({
              key,
              focused: focusedKey === key,
              checked: selectedKeys.has(key)
            }),
            suggestion
          )
        )
      })
    menuItems.push(h(Separator))
    return menuItems
  }

  const menuItems =  suggestions.reduce(toMenuItems, [])
  return menuItems.length === 0
    ? h(NoItemsMessage, 'No items found')
    : menuItems
}

module.exports = (
  suggestions,
  selectedKeys,
  getSectionSuggestions,
  renderSectionTitle,
  wrapperRef
) => (
  {getMenuProps, getItemProps, placement, focusedKey}) => {
  return h(MenuView,
    getMenuProps({
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
        render(
          suggestions,
          selectedKeys,
          getSectionSuggestions,
          renderSectionTitle,
          getItemProps,
          focusedKey
        )
      )
    ]
  )
}
