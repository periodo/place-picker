'use strict'

const { render } = require('react-dom')
const { Provider, connect } = require('react-redux')
const { createStore } = require('redux')
const h = require('react-hyperscript')

const gazetteers = Object.values(require('./places').graphs)

const featurePicked = feature => ({type: 'FEATURE_PICKED', feature})

const app = (state = {}, action) => {
  switch (action.type) {
  case 'FEATURE_PICKED':
    return {...state, ...{feature: action.feature}}
  default:
    return state
  }
}

const FeaturePicker = connect(
  null,
  dispatch => ({onFeaturePicked: id => dispatch(featurePicked(id))})
)(require('./index'))

const Map = connect(
  state => ({features: [state.feature]}),
)(require('./Map'))

render(
  h(Provider, {store: createStore(app)},
    [
      h(Map, {key: 1}),
      h(FeaturePicker, {key: 2, gazetteers}),
    ]
  ),
  document.body.appendChild(document.createElement('div'))
)
