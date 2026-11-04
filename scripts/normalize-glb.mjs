import fs from 'node:fs';
import path from 'node:path';

const [,, src, dst, targetWidthArg] = process.argv;
if (!src || !dst) { console.error('usage: normalize-glb.mjs <src.glb> <dst.glb> [targetWidth]'); process.exit(1); }
const targetWidth = Number(targetWidthArg ?? 1.9);

const buf = fs.readFileSync(src);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a glb');
let off = 12, json = null, bin = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
  const chunk = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8'));
  else if (type === 0x004e4942) bin = Buffer.from(chunk);
  off += 8 + len;
}
if (!json) throw new Error('no json chunk');
const g = json;

const mul = (a, b) => {
  const r = new Array(16).fill(0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)
    for (let k = 0; k < 4; k++) r[i * 4 + j] += a[k * 4 + j] * b[i * 4 + k];
  return r;
};
const trs = (n) => {
  if (n.matrix) return n.matrix;
  const [tx, ty, tz] = n.translation ?? [0, 0, 0];
  const [qx, qy, qz, qw] = n.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale ?? [1, 1, 1];
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
};
const xform = (m, p) => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
];

const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
const walk = (idx, parent) => {
  const n = g.nodes[idx];
  const world = mul(parent, trs(n));
  if (n.mesh !== undefined) {
    for (const prim of g.meshes[n.mesh].primitives) {
      const acc = g.accessors[prim.attributes.POSITION];
      if (!acc.min || !acc.max) continue;
      for (const c of [[acc.min[0], acc.min[1], acc.min[2]], [acc.max[0], acc.max[1], acc.max[2]],
        [acc.min[0], acc.max[1], acc.min[2]], [acc.min[0], acc.min[1], acc.max[2]],
        [acc.max[0], acc.max[1], acc.min[2]], [acc.max[0], acc.min[1], acc.max[2]],
        [acc.min[0], acc.max[1], acc.max[2]], [acc.max[0], acc.min[1], acc.min[2]]]) {
        const p = xform(world, c);
        for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]); }
      }
    }
  }
  for (const c of n.children ?? []) walk(c, world);
};
const scene = g.scenes[g.scene ?? 0];
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
for (const r of scene.nodes) walk(r, I);

const width = max[0] - min[0];
const s = targetWidth / width;
const cx = (min[0] + max[0]) / 2, cy = min[1], cz = (min[2] + max[2]) / 2;

g.nodes.push({
  name: 'normalized-root',
  rotation: [0, 1, 0, 0],
  scale: [s, s, s],
  translation: [s * cx, -s * cy, s * cz],
  children: [...scene.nodes],
});
scene.nodes = [g.nodes.length - 1];

let imgs = 0;
for (const img of g.images ?? []) {
  if (!img.uri || /^data:/.test(img.uri)) continue;
  const bytes = fs.readFileSync(path.resolve(path.dirname(src), img.uri));
  const pad = (4 - (bin.length % 4)) % 4;
  if (pad) bin = Buffer.concat([bin, Buffer.alloc(pad)]);
  g.bufferViews.push({ buffer: 0, byteOffset: bin.length, byteLength: bytes.length });
  bin = Buffer.concat([bin, bytes]);
  img.bufferView = g.bufferViews.length - 1;
  img.mimeType = img.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
  delete img.uri;
  imgs++;
}
if (bin) g.buffers[0].byteLength = bin.length;

const jsonBuf = Buffer.from(JSON.stringify(g), 'utf8');
const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
const jsonChunk = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);
const binPad = bin ? (4 - (bin.length % 4)) % 4 : 0;
const binChunk = bin ? Buffer.concat([bin, Buffer.alloc(binPad, 0)]) : null;
const total = 12 + 8 + jsonChunk.length + (binChunk ? 8 + binChunk.length : 0);
const out = Buffer.alloc(total);
out.writeUInt32LE(0x46546c67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(total, 8);
out.writeUInt32LE(jsonChunk.length, 12); out.writeUInt32LE(0x4e4f534a, 16);
jsonChunk.copy(out, 20);
if (binChunk) {
  const o = 20 + jsonChunk.length;
  out.writeUInt32LE(binChunk.length, o); out.writeUInt32LE(0x004e4942, o + 4);
  binChunk.copy(out, o + 8);
}
fs.writeFileSync(dst, out);
console.log(JSON.stringify({ dst, embeddedImages: imgs, scale: +s.toFixed(4), width: +(width * s).toFixed(3), height: +((max[1]-min[1])*s).toFixed(3), length: +((max[2]-min[2])*s).toFixed(3) }));
