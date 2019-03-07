'use strict'

const regl = require('regl')             // functional webgl api
const mixmap = require('mixmap')         // webgl mapping library
const zoomTo = require('mixmap-zoom')
const mixtiles = require('mixmap-tiles')
const createMesh = require('earth-mesh') // geojson -> webgl triangles

// oes_element_index_uint adds support for unsigned ints
// to the WebGLRenderingContext
const mix = mixmap(regl, { extensions: ['oes_element_index_uint'] })
const map = mix.create()

// map tile loader
mixtiles(map, {
  path: '/tiles',
  layers: require('./tiles/layers.json'),
  load: require('mixmap-tiles/xhr')
})

const PURPLE = 'vec4(1.0,0.0,1.0,0.5)'
const YELLOW = 'vec4(1.0,1.0,0.0,0.5)'

// regl config for drawing triangles
const drawTriangle = color => map.createDraw({
  frag: `
    void main () {
      gl_FragColor = ${color};
    }
  `,
  uniforms: {
    zindex: 100
  },
  blend: {
    enable: true,
    func: { src: 'src alpha', dst: 'one minus src alpha' }
  },
  attributes: {
    position: map.prop('positions')
  },
  elements: map.prop('cells')
})

const drawFeatures = drawTriangle(YELLOW)
const drawFocusedFeature = drawTriangle(PURPLE)

const easing = require('eases/circ-in-out')

const length = bbox => {
  let lonDelta = bbox[2] - bbox[0]
  let latDelta = bbox[3] - bbox[1]
  if (lonDelta > 359) {
    return latDelta
  }
  return Math.max(lonDelta, latDelta)
}

const padding = bbox => Math.max(1,
  // the coefficients here were determined through trial & error
  Math.round((-0.68 * Math.log(length(bbox))) + 3.91)
)

const bbox = mesh => {
  const box = [180,90,-180,-90]
  for (let i = 0; i < mesh.triangle.positions.length; i++) {
    box[0] = Math.min(box[0], mesh.triangle.positions[i][0])
    box[1] = Math.min(box[1], mesh.triangle.positions[i][1])
    box[2] = Math.max(box[2], mesh.triangle.positions[i][0])
    box[3] = Math.max(box[3], mesh.triangle.positions[i][1])
  }
  return box
}

const display = (features, focusedFeature) => {
  const focusedFeatureId = focusedFeature ? focusedFeature.id : undefined
  const unfocusedFeatures = features.filter(
    f => (f.id !== focusedFeatureId) && f.geometry
  )
  let viewbox = undefined
  if (focusedFeature && focusedFeature.geometry) {
    const mesh = createMesh(focusedFeature)
    drawFocusedFeature.props = [mesh.triangle]
    viewbox = bbox(mesh)
  }
  if (unfocusedFeatures.length > 0) {
    const mesh = createMesh({features: unfocusedFeatures})
    drawFeatures.props = [mesh.triangle]
    if (viewbox === undefined) {
      viewbox = bbox(mesh)
    }
  }
  if (viewbox) {
    map.draw()
    zoomTo(map, {viewbox, duration: 750, padding: padding(viewbox), easing})
  }
}

const React = require('react')
const h = require('react-hyperscript')

const Mix = function() {
  let ref = React.createRef()
  React.useEffect(() => {
    ref.current.appendChild(mix.render())
  })
  return h('div', {ref})
}

const Map = function({
  width,
  height,
  features = [],
  focusedFeature
}) {
  let ref = React.createRef()
  React.useEffect(() => {
    while (ref.current.firstChild) {
      ref.current.removeChild(ref.current.firstChild)
    }
    display(features, focusedFeature)
    ref.current.appendChild(map.render({width, height}))
  })
  return h('div', {ref})
}

module.exports = function({features, focusedFeature}) {
  return [
    h(Mix, {key: 1}),
    h(Map, {key: 2, width: 400, height: 200, features, focusedFeature})
  ]
}
