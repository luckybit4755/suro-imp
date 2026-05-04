#!/usr/bin/env node

import { Smasher } from '../../src/lib/index.js';
import { Rules }   from '../../src/lib/model/Rules.js';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

const GRID = parseInt( process.argv[2] ?? '28' );
const OUT  = process.argv[3] ?? path.resolve( __dirname, '../../voxel-scene.html' );

// 4 height tiers: 0=gap/water  1=floor  2=raised  3=peak
// adjacent tiles may differ by at most 1 height — this creates
// smooth terrain where every height transition IS a stair step
const COUNT = 4;
const adj = Array.from( { length: COUNT }, ( _, i ) => {
	const s = new Set();
	if ( i > 0 )         s.add( i - 1 );
	s.add( i );
	if ( i < COUNT - 1 ) s.add( i + 1 );
	return s;
} );

const rules   = new Rules( [ adj, adj ] );
const smasher = new Smasher( rules );

console.log( `rolling ${GRID}×${GRID} voxel terrain...` );
const map = smasher.createMap( [ GRID, GRID ] );

if ( !map.broke ) console.warn( 'warning: WFC did not fully collapse' );

// collect cell data + build grid for ASCII preview
const HEIGHT_CHARS = [ '~', '.', '^', '#' ];
const cells = [];
const rows  = [];

for ( const [ tile, rel ] of map.all() ) {
	const r = rel[ 0 ], c = rel[ 1 ];
	if ( !rows[ r ] ) rows[ r ] = [];
	rows[ r ][ c ] = tile.value;
	cells.push( { x: c, z: r, h: tile.value } );
}

console.log( '\nterrain preview  (~ gap  . floor  ^ raised  # peak):' );
for ( const row of rows ) {
	console.log( row.map( h => HEIGHT_CHARS[ h ] ).join( '' ) );
}

fs.writeFileSync( OUT, buildHTML( cells, GRID ) );
console.log( `\n→ ${OUT}` );
console.log( 'open in a browser — drag to orbit, scroll to zoom' );

// ---------------------------------------------------------------------------

function buildHTML( cells, gridSize ) {
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>suro-imp voxel POC</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { overflow:hidden; background:#000; font-family:monospace; }
    #hud {
      position:absolute; top:12px; left:14px; color:#eee;
      font-size:12px; line-height:1.8; pointer-events:none;
      text-shadow:0 1px 3px #000;
    }
    #legend span { display:inline-block; width:10px; height:10px; margin-right:4px; vertical-align:middle; border-radius:2px; }
  </style>
</head>
<body>
<div id="hud">
  suro-imp voxel POC — drag to orbit · scroll to zoom · right-drag to pan
  <div id="legend">
    <span style="background:#1a4a8e"></span>gap &nbsp;
    <span style="background:#d4b86a"></span>floor &nbsp;
    <span style="background:#5ab85a"></span>raised &nbsp;
    <span style="background:#d0d0d8"></span>peak
  </div>
</div>
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const GRID  = ${gridSize};
const CELLS = ${JSON.stringify( cells )};
const cx = GRID / 2 - 0.5;
const cz = GRID / 2 - 0.5;

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x87ceeb );
scene.fog = new THREE.FogExp2( 0x87ceeb, 0.018 );

// camera
const camera = new THREE.PerspectiveCamera( 55, innerWidth / innerHeight, 0.1, 500 );
camera.position.set( cx - GRID * 0.6, GRID * 0.55, cz + GRID * 0.9 );

// renderer
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( devicePixelRatio );
renderer.setSize( innerWidth, innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

// controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( cx, 0, cz );
controls.enableDamping = true;
controls.dampingFactor  = 0.08;

// lighting
const sun = new THREE.DirectionalLight( 0xfffbe0, 1.3 );
sun.position.set( GRID, GRID * 1.4, GRID * 0.5 );
sun.castShadow = true;
sun.shadow.mapSize.set( 2048, 2048 );
const sc = GRID * 0.8;
Object.assign( sun.shadow.camera, { left:-sc, right:sc, top:sc, bottom:-sc, near:1, far:GRID*4 } );
scene.add( sun );
scene.add( new THREE.AmbientLight( 0x8899bb, 0.55 ) );
scene.add( new THREE.HemisphereLight( 0x87ceeb, 0x4a3a20, 0.4 ) );

// water plane for gaps
const water = new THREE.Mesh(
  new THREE.PlaneGeometry( GRID + 6, GRID + 6 ),
  new THREE.MeshLambertMaterial( { color: 0x1a4a8e, transparent: true, opacity: 0.82 } )
);
water.rotation.x = -Math.PI / 2;
water.position.set( cx, -0.02, cz );
scene.add( water );

// shared geometry — slightly inset so you can see the stacking
const boxGeo = new THREE.BoxGeometry( 0.94, 1, 0.94 );

// side and top materials per tier
const SIDE = [
  null,
  new THREE.MeshLambertMaterial( { color: 0xb8924a } ), // floor  - brown
  new THREE.MeshLambertMaterial( { color: 0x2e7a2e } ), // raised - dark green
  new THREE.MeshLambertMaterial( { color: 0x8a8a94 } ), // peak   - stone
];
const TOP = [
  null,
  new THREE.MeshLambertMaterial( { color: 0xd4b86a } ), // floor top  - sand
  new THREE.MeshLambertMaterial( { color: 0x5ab85a } ), // raised top - grass
  new THREE.MeshLambertMaterial( { color: 0xd8d8e0 } ), // peak top   - snow/pale stone
];

for ( const { x, z, h } of CELLS ) {
  if ( h === 0 ) continue;
  for ( let y = 0; y < h; y++ ) {
    const mesh = new THREE.Mesh( boxGeo, y === h - 1 ? TOP[h] : SIDE[h] );
    mesh.position.set( x, y + 0.5, z );
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    scene.add( mesh );
  }
}

function animate() {
  requestAnimationFrame( animate );
  controls.update();
  renderer.render( scene, camera );
}
animate();

window.addEventListener( 'resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( innerWidth, innerHeight );
} );
</script>
</body>
</html>`;
}
