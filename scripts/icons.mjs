import sharp from 'sharp';
const src = 'public/icon.svg';
await sharp(src).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(src).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(src).resize(180, 180).png().toFile('public/apple-touch-icon.png');
// maskable: add safe padding on the yellow background
await sharp(src).resize(400, 400).extend({ top: 56, bottom: 56, left: 56, right: 56, background: '#FFC93C' }).png().toFile('public/icon-512-maskable.png');
console.log('icons ok');
