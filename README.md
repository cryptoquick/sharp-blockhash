# sharp-blockhash

Image perceptual hash calculation with sharp and blockhash. Used to compare similar images.

# Usage:

Fully compatible with `sharp`'s API. Can be used in the same way of `sharp` with additional `blockhash` calculation.

```javascript
const shash = require('sharp-blockhash');
const hammingDistance = require('hamming-distance');
const devNull = require('dev-null');
const fs = require('fs');

// input: file, output: promise
Promise.all([
  shash('test/sample/orig.jpg').toBlockhash(),
  shash('test/sample/attacked-compressed.jpg').toBlockhash()
]).then(function (hashes) {
  return hammingDistance(hashes[0].toString('hex'), hashes[1].toString('hex'));
})

// input: file, output: stream (of the converted image data) with sharp's build-in method resize called
let hash = shash('test/sample/solid.png');
hash.resize(800, 600).toBlockhash();
hash.pipe(devNull());
(new Promise((resolve, reject) => {
  hash.on('blockhash', resolve)
    .on('error', reject);
})).then(hash => console.log(hash));

// input: stream, output: stream (of the converted image data) with sharp's build-in method grayscale called
hash = shash();
hash.grayscale().toBlockhash();
fs.createReadStream('test/sample/solid.png').pipe(hash).pipe(devNull());
(new Promise(function (resolve, reject) {
  hash.on('blockhash', resolve)
    .on('error', reject);
})).then(hash => console.log(hash));

// call with blockhash options
hash = shash({ blockhashBits: 8, blockHashMethod: 2 });
//...
// or
shash().toBlockhash({ blockhashBits: 8, blockHashMethod: 2 });
```

# Credit:

https://github.com/skedastik/ghash

https://github.com/pwlmaciejewski/imghash

https://github.com/lovell/sharp
