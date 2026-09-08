import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import Offset from 'polygon-offset';

const root = process.cwd();
const svg = fs.readFileSync(path.join(root, 'assets/highverz-hv-logo.svg'), 'utf8');
const output = path.join(root, 'public/models/highverz-hv.glb');

// GLTFExporter expects the browser FileReader API when writing a binary GLB.
// Node has Blob/arrayBuffer but not FileReader, so provide the tiny adapter
// needed for this export script.
if (!globalThis.FileReader) {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.();
      });
    }
  };
}

// The official HV mark is a single M/L/Z path. Rebuilding that path as a
// THREE.Shape keeps the exported mesh faithful to the supplied brand asset.
const d = svg.match(/<path[^>]*d="([^"]+)"/i)?.[1];
if (!d) throw new Error('Official HV path was not found.');

const tokens = d.match(/[MLZ]|-?\d*\.?\d+/gi) || [];
const shape = new THREE.Shape();
const pathPoints = [];
let index = 0;
let command = '';
while (index < tokens.length) {
  if (/^[MLZ]$/i.test(tokens[index])) command = tokens[index++].toUpperCase();
  if (command === 'Z') { shape.closePath(); command = ''; continue; }
  const x = Number(tokens[index++]);
  const y = Number(tokens[index++]);
  if (command === 'M') {
    shape.moveTo(x, -y);
    pathPoints.push([x, -y]);
    command = 'L';
  } else if (command === 'L') {
    shape.lineTo(x, -y);
    pathPoints.push([x, -y]);
  }
}

// Keep the inset consistent around concave corners; centroid scaling would
// pinch the inner V and distort the groove width.
const GROOVE_INSET = 13;
const GROOVE_DEPTH = 18;
const GROOVE_RECESS = 0.018;
const insetRings = new Offset().data(pathPoints).padding(GROOVE_INSET);
const insetPoints = insetRings
  .slice()
  .sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)))[0];
if (!insetPoints?.length) throw new Error('Unable to create the inset HV groove path.');

function polygonArea(points) {
  return points.reduce((area, point, pointIndex) => {
    const next = points[(pointIndex + 1) % points.length];
    return area + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2;
}

const insetShape = new THREE.Shape();
insetPoints.forEach(([x, y], pointIndex) => {
  if (pointIndex === 0) insetShape.moveTo(x, y);
  else insetShape.lineTo(x, y);
});
insetShape.closePath();

const scene = new THREE.Scene();
scene.name = 'Highverz Unified Hero Model';
const model = new THREE.Group();
model.name = 'Highverz_HV_Sculpture';
scene.add(model);

const logoMetal = new THREE.MeshPhysicalMaterial({
  name: 'HV_Opaque_Gunmetal',
  color: 0x2a2e33,
  metalness: 0.9,
  roughness: 0.35,
  clearcoat: 0.24,
  clearcoatRoughness: 0.18,
});
const logoGlow = new THREE.MeshStandardMaterial({
  name: 'HV_Recessed_Cyan_Glow',
  color: 0x22d3ee,
  emissive: 0x22d3ee,
  emissiveIntensity: 2.8,
  toneMapped: false,
  metalness: 0.05,
  roughness: 0.28,
});

function createLogoGeometry(sourceShape, depth) {
  const geometry = new THREE.ExtrudeGeometry(sourceShape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 5,
    bevelThickness: 5,
    curveSegments: 12,
  });
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(0.0052, 0.0052, 0.0052);
  geometry.computeBoundingBox();
  return geometry;
}

const logoGeometry = createLogoGeometry(shape, 24);
const grooveGeometry = createLogoGeometry(insetShape, GROOVE_DEPTH);
const logo = new THREE.Group();
logo.name = 'Official_Highverz_HV_Logo';

const outerMesh = new THREE.Mesh(logoGeometry, logoMetal);
outerMesh.name = 'hv-metal';
const grooveMesh = new THREE.Mesh(grooveGeometry, logoGlow);
grooveMesh.name = 'hv-glow';
grooveMesh.position.z = -GROOVE_RECESS;

// Align the outer shell's lowest point exactly with the top surface of the
// existing plinth. The inset is intentionally smaller and remains recessed.
const PEDESTAL_TOP_Y = -1.0;
const PEDESTAL_TOP_HEIGHT = 0.045;
const logoY = PEDESTAL_TOP_Y + PEDESTAL_TOP_HEIGHT / 2 - logoGeometry.boundingBox.min.y;
logo.position.set(0, logoY, 0.16);
logo.rotation.set(0.035, -0.08, 0);
outerMesh.castShadow = true;
outerMesh.receiveShadow = true;
grooveMesh.castShadow = false;
grooveMesh.receiveShadow = false;
logo.add(outerMesh, grooveMesh);
model.add(logo);

const platformMaterial = new THREE.MeshPhysicalMaterial({
  name: 'Pedestal_Graphite_Concrete',
  color: 0x151b1d,
  metalness: 0.42,
  roughness: 0.6,
});
const platformTopMaterial = new THREE.MeshPhysicalMaterial({
  name: 'Pedestal_Top_Reflective_Surface',
  color: 0x26383b,
  metalness: 0.64,
  roughness: 0.34,
});

const pedestal = new THREE.Mesh(new RoundedBoxGeometry(5.15, 0.35, 1.45, 4, 0.08), platformMaterial);
pedestal.name = 'Architectural_Pedestal_Body';
pedestal.position.y = -1.2;
pedestal.castShadow = true;
pedestal.receiveShadow = true;
model.add(pedestal);

const pedestalTop = new THREE.Mesh(new RoundedBoxGeometry(5, PEDESTAL_TOP_HEIGHT, 1.34, 3, 0.035), platformTopMaterial);
pedestalTop.name = 'Architectural_Pedestal_Top';
pedestalTop.position.y = -1.0;
pedestalTop.castShadow = true;
pedestalTop.receiveShadow = true;
model.add(pedestalTop);

model.position.y = -0.1;
model.scale.setScalar(1);

fs.mkdirSync(path.dirname(output), { recursive: true });
const exporter = new GLTFExporter();
exporter.parse(scene, (result) => {
  fs.writeFileSync(output, Buffer.from(result));
  console.log(`Created ${output}`);
}, (error) => {
  console.error(error);
  process.exitCode = 1;
}, {
  // GLTFExporter preserves the scene graph; there is no mergeMeshes option.
  binary: true,
});
