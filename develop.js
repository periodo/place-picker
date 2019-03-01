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
  dispatch => ({onFeaturePicked: feature => dispatch(featurePicked(feature))})
)(require('./index'))

const Map = connect(
  state => ({features: [state.feature]}),
)(require('./Map'))

const Label = connect(
  state => ({feature: state.feature})
)(require('./Label'))

const store = createStore(
  app,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

render(
  h(Provider, {store},
    [
      h(Map, {key: 1}),
      h(Label, {key: 2}),
      h(FeaturePicker, {key: 3, gazetteers}),
    ]
  ),
  document.body.appendChild(document.createElement('div'))
)
