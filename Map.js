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

// regl config for drawing triangles
const drawTriangle = map.createDraw({
  frag: `
    void main () {
      gl_FragColor = vec4(0.976,0.800,0.388,0.3);
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

const display = geometry => {
  const mesh = createMesh(geometry)
  drawTriangle.props = [mesh.triangle]
  map.draw()

  const bbox = [180,90,-180,-90]
  for (var i = 0; i < mesh.triangle.positions.length; i++) {
    bbox[0] = Math.min(bbox[0], mesh.triangle.positions[i][0])
    bbox[1] = Math.min(bbox[1], mesh.triangle.positions[i][1])
    bbox[2] = Math.max(bbox[2], mesh.triangle.positions[i][0])
    bbox[3] = Math.max(bbox[3], mesh.triangle.positions[i][1])
  }
  zoomTo(map, {viewbox: bbox, duration: 500, padding: 1})
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

const Map = function(props) {
  let ref = React.createRef()
  React.useEffect(() => {
    for (let feature of (props.features || [])) {
      if (feature && feature.geometry) display(feature)
    }
    while (ref.current.firstChild) {
      ref.current.removeChild(ref.current.firstChild)
    }
    ref.current.appendChild(map.render(props))
  })
  return h('div', {ref})
}

module.exports = function({features}) {
  return [
    h(Mix, {key: 1}),
    h(Map, {key: 2, width: 600, height: 400, features})
  ]
}
