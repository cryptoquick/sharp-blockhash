// test

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var Promise = require('bluebird');
var shash = require('../index');
var fs = require('fs');
var devNull = require('dev-null');
var hammingDistance = require('hamming-distance');

chai.use(chaiAsPromised);
chai.should();

describe('shash', function () {
  it('should fail when given a bad input image', function () {
    return shash('test/sample/nonexistent.png').toBlockhash().should.eventually.be.rejected;
  });

  it('should succeed when given an a valid input image', function () {
    return shash('test/sample/solid.png').toBlockhash().should.eventually.be.fulfilled;
  });

  it('should return a one-out hash for a solid input image', function () {
    return shash('test/sample/solid.png')
      .toBlockhash()
      .should.eventually.equal('ffffffffffffffff');
  });

  it('should support stream input', function () {
    var hash = shash();
    fs.createReadStream('test/sample/solid.png').pipe(hash);
    return hash.toBlockhash().should.eventually.equal('ffffffffffffffff');
  });

  it('should support both stream input and stream output', function () {
    var hash = shash();
    hash.toBlockhash();
    fs.createReadStream('test/sample/solid.png').pipe(hash).pipe(devNull());
    var promise = new Promise(function (resolve, reject) {
      hash.on('blockhash', resolve)
        .on('error', reject);
    });
    return promise.should.eventually.equal('ffffffffffffffff');
  });

  it('should support file input and stream output', function () {
    var hash = shash('test/sample/solid.png');
    hash.toBlockhash();
    hash.pipe(devNull());
    var promise = new Promise(function (resolve, reject) {
      hash.on('blockhash', resolve)
        .on('error', reject);
    });
    return promise.should.eventually.equal('ffffffffffffffff');
  });

  it('should generate identical hashes for identical images', function () {
    return Promise.all([
      shash('test/sample/orig.jpg').toBlockhash(),
      shash('test/sample/orig-copy.jpg').toBlockhash()
    ]).then(function (hashes) {
      return hashes[0] === hashes[1];
    }).should.eventually.equal(true);
  });

  it('should generate very different hashes for very different images', function () {
    return Promise.all([
      shash('test/sample/orig.jpg').toBlockhash(),
      shash('test/sample/control.jpg').toBlockhash()
    ]).then(function (hashes) {
      return hammingDistance(hashes[0].toString('hex'), hashes[1].toString('hex'));
    }).should.eventually.be.above(16);
  });

  it('should generate similar hashes for similar images', function () {
    return Promise.all([
      shash('test/sample/orig.jpg').toBlockhash(),
      shash('test/sample/attacked-compressed.jpg').toBlockhash()
    ]).then(function (hashes) {
      return hammingDistance(hashes[0].toString('hex'), hashes[1].toString('hex'));
    }).should.eventually.be.below(8);
  });
});
