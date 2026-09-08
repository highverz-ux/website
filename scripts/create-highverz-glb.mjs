import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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
let index = 0;
let command = '';
while (index < tokens.length) {
  if (/^[MLZ]$/i.test(tokens[index])) command = tokens[index++].toUpperCase();
  if (command === 'Z') { shape.closePath(); command = ''; continue; }
  const x = Number(tokens[index++]);
  const y = Number(tokens[index++]);
  if (command === 'M') {
    shape.moveTo(x, -y);
    command = 'L';
  } else if (command === 'L') {
    shape.lineTo(x, -y);
  }
}

const scene = new THREE.Scene();
scene.name = 'Highverz Unified Hero Model';
const model = new THREE.Group();
model.name = 'Highverz_HV_Sculpture';
scene.add(model);

const logoFront = new THREE.MeshPhysicalMaterial({
  name: 'HV_Front_Metal',
  color: 0x111719,
  metalness: 0.88,
  roughness: 0.27,
  clearcoat: 0.38,
  clearcoatRoughness: 0.2,
});
const logoSides = new THREE.MeshPhysicalMaterial({
  name: 'HV_Edges_Cyan_Reflective_Metal',
  color: 0x087f8d,
  metalness: 0.9,
  roughness: 0.3,
});

const logoGeometry = new THREE.ExtrudeGeometry(shape, {
  depth: 24,
  bevelEnabled: true,
  bevelSegments: 4,
  bevelSize: 5,
  bevelThickness: 5,
  curveSegments: 12,
});
logoGeometry.computeBoundingBox();
const center = new THREE.Vector3();
logoGeometry.boundingBox.getCenter(center);
logoGeometry.translate(-center.x, -center.y, -center.z);
logoGeometry.scale(0.0052, 0.0052, 0.0052);

const logo = new THREE.Mesh(logoGeometry, [logoFront, logoSides]);
logo.name = 'Official_Highverz_HV_Logo';
logo.position.set(0, 0.68, 0.16);
logo.rotation.set(0.035, -0.08, 0);
logo.castShadow = true;
logo.receiveShadow = true;
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

const pedestalTop = new THREE.Mesh(new RoundedBoxGeometry(5, 0.045, 1.34, 3, 0.035), platformTopMaterial);
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
}, { binary: true });
