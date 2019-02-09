'use strict'

const regl = require('regl')             // functional webgl api
const resl = require('resl')             // streaming resource loader
//const glsl = require('glslify')        // modules for opengl shading language
const mixmap = require('mixmap')         // webgl mapping library
const createMesh = require('earth-mesh') // geojson -> webgl triangles

// oes_element_index_uint adds support for unsigned ints
// to the WebGLRenderingContext
const mix = mixmap(regl, { extensions: ['oes_element_index_uint'] })
const map = mix.create()

const tileFragmentShader = `
  precision highp float;
  uniform sampler2D texture;
  varying vec2 vtcoord;
  void main () {
    float q = 1.0/32.0;
    vec3 c = vec3(max(mod(vtcoord.x,q),mod(vtcoord.y,q))*0.4+0.4);
    vec4 tc = texture2D(texture,vtcoord);
    gl_FragColor = vec4(c*(1.0-tc.a)+tc.rgb*tc.a,0.5+tc.a*0.5);
  }
`
// glsl`
//   precision highp float;
//   #pragma glslify: hsl2rgb = require('glsl-hsl2rgb')
//   uniform float id;
//   uniform sampler2D texture;
//   varying vec2 vtcoord;
//   void main () {
//     float h = mod(id/8.0,1.0);
//     float s = mod(id/4.0,1.0)*0.5+0.25;
//     float l = mod(id/16.0,1.0)*0.5+0.25;
//     vec3 c = hsl2rgb(h,s,l);
//     vec4 tc = texture2D(texture,vtcoord);
//     gl_FragColor = vec4(c*(1.0-tc.a)+tc.rgb*tc.a,0.5+tc.a*0.5);
//   }
// `
const tileVertexShader = `
  precision highp float;
  attribute vec2 position;
  uniform vec4 viewbox;
  uniform vec2 offset;
  uniform float zindex, aspect;
  attribute vec2 tcoord;
  varying vec2 vtcoord;
  void main () {
    vec2 p = position + offset;
    vtcoord = tcoord;
    gl_Position = vec4(
      (p.x - viewbox.x) / (viewbox.z - viewbox.x) * 2.0 - 1.0,
      ((p.y - viewbox.y) / (viewbox.w - viewbox.y) * 2.0 - 1.0) * aspect,
      1.0/(2.0+zindex), 1);
  }
`
// `
//   precision highp float;
//   attribute vec2 position;
//   uniform vec4 viewbox;
//   uniform vec2 offset;
//   uniform float zindex;
//   attribute vec2 tcoord;
//   varying vec2 vtcoord;
//   void main () {
//     vec2 p = position + offset;
//     vtcoord = tcoord;
//     gl_Position = vec4(
//       (p.x - viewbox.x) / (viewbox.z - viewbox.x) * 2.0 - 1.0,
//       (p.y - viewbox.y) / (viewbox.w - viewbox.y) * 2.0 - 1.0,
//       1.0/(1.0+zindex), 1);
//   }
// `

// regl config for drawing tiles
const drawTile = map.createDraw({
  frag: tileFragmentShader,
  vert: tileVertexShader,
  // variables for fragment and vertex shaders
  uniforms: {
    // unique tile id
    id: map.prop('id'),
    // map layer / level
    zindex: map.prop('zindex'),
    // the raster tile
    texture: map.prop('texture')
  },
  // variables for vertex shader
  attributes: {
    position: map.prop('points'),
    tcoord: [0,1, 0,0, 1,1, 1,0] // sw, se, nw, ne
  },
  // array data for triangle primitive
  elements: [0,1, 2,1, 2,3],
  // color blending
  blend: {
    enable: true,
    func: { src: 'src alpha', dst: 'one minus src alpha' }
  }
})

// three levels of tiles from Natural Earth II with shaded relief and water
const tileManifest = require('./tiles/manifest.json')
const tiles = [ {}, {}, {} ]
tileManifest.forEach((file, id) => {
  const level = Number(file.split('/')[0])
  const bbox = file.split('/')[1].replace(/\.jpg$/,'').split('x').map(Number)
  tiles[level][id+'!'+file] = bbox
})

map.addLayer({
  // provide appropriate tiles based on zoom
  viewbox: (bbox, zoom, cb) => {
    zoom = Math.round(zoom)
    if (zoom < 2) {
      cb(null, tiles[0])
    } else if (zoom < 4) {
      cb(null, tiles[1])
    } else {
      cb(null, tiles[2])
    }
  },
  // add a tile
  add: (key, bbox) => {
    const [idString, file] = key.split('!')
    var level = Number(file.split('/')[0])
    var prop = {
      id: Number(idString),
      key,
      zindex: 2 + level,
      texture: map.regl.texture(),
      points: [
        bbox[0], bbox[1], // sw
        bbox[0], bbox[3], // se
        bbox[2], bbox[1], // nw
        bbox[2], bbox[3]  // ne
      ]
    }
    drawTile.props.push(prop)
    map.draw()
    // load tile image
    resl({
      manifest: { tile: { type: 'image', src: 'tiles/'+file } },
      onDone: (assets) => {
        prop.texture = map.regl.texture(assets.tile)
        map.draw()
      }
    })
  },
  remove: key => {
    drawTile.props = drawTile.props.filter(p => p.key !== key)
  }
})

// regl config for drawing triangles
const drawTriangle = map.createDraw({
  frag: `
    void main () {
      gl_FragColor = vec4(1.0,0.0,1.0,0.4);
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
      if (feature) display(feature)
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
