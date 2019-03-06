'use strict'

const h = require('react-hyperscript')
const styled = require('styled-components').default

const { TextGroup } = require('@zendeskgarden/react-textfields')
const { XL, MD, SM } = require('@zendeskgarden/react-typography')


const Box = styled(TextGroup)`
  max-width: 400px;
  min-height: 200px;
  background-color: #e9ebed;
`

const Title = styled(XL)`
  padding: 5px 10px;
`

const Names = styled(SM)`
  color: #777777;
  padding: 0 10px 5px;
`

const Description = styled(MD)`
  padding: 0 10px 5px;
`

const separator = h('span', ' | ')

const separate = array => array.reduce(
  (separated, value) => [...separated, value, separator], []
).slice(0, -1)

const description = feature => feature.descriptions
  ? separate(feature.descriptions.map(description => description.value))
  : []

const names = (feature, title) => feature.names
  ? separate(feature.names.map(n => n.toponym).filter(n => n !== title))
  : []

module.exports = function({feature}) {
  return h(
    Box,
    feature && feature.properties && feature.properties.title
      ?
      [
        h(Title, feature.properties.title),
        h(Names, names(feature, feature.properties.title)),
        h(Description, description(feature, feature.properties.title)),
      ]
      : []
  )
}
