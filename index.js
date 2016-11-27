var Sharp = require('sharp');
var Promise = require('bluebird');
var blockhash = require('blockhash');
var util = require('util');
var sharp = Promise.promisifyAll(require('sharp/build/Release/sharp'));

var defaultOptions = { blockhashBits: 8, blockhashMethod: 2 };

function setOptions(options) {
  if (!options) return;
  util._extend(this.options, defaultOptions);
  util._extend(this.options, options);
}

function getHash(options) {
  options = util._extend({}, options);
  util._extend(options, { formatOut: 'raw', fileOut: '', streamOut: false });
  return sharp.pipelineAsync(options)
    .then(function(data) {
      return sharp.metadataAsync(options).then(function (meta) {
        return blockhash.blockhashData({ width: meta.width, height: meta.height, data: data }, options.blockhashBits, options.blockhashMethod);
      });
    });
}

function SharpBlockhash(input, options) {
  if (!(this instanceof SharpBlockhash)) {
    return new SharpBlockhash(input, options);
  }
  if (input) {
    Sharp.call(this, input, options);
    setOptions.call(this, defaultOptions);
  }
  else {
    // Sharp.call(this);
  }
}
util.inherits(SharpBlockhash, Sharp);

SharpBlockhash.prototype._read = function () {
  var that = this;
  if (this.options.blockhashOut === true) {
    this.options.blockhashOut = false;
    if (this.options.streamIn) {
      // output=stream, input=stream
      this.on('finish', function() {
        getHash(that.options).then(function (hash) {
          that.emit('blockhash', hash);
        })
        .catch(function(err) {
          that.emit('error', err);
        });
      });
    } else {
      // output=stream, input=file/buffer
      getHash(this.options).then(function (hash) {
        that.emit('blockhash', hash);
      })
      .catch(function(err) {
        that.emit('error', err);
      });
    }
  }
  Sharp.prototype._read.call(this);
};

SharpBlockhash.prototype.toBlockhash = function (options, callback) {
  var that = this;
  if (typeof options === 'function' && callback === undefined) {
    options = undefined;
    callback = options;
  }
  setOptions.call(this, options);
  this.options.blockhashOut = true;

  if (typeof callback === 'function') {
    if (this.options.streamIn) {
      this.on('finish', function() {
        getHash(that.options).then(function(hash) {
          callback(null, hash);
        })
        .catch(callback);
      });
    }
  } if (!this.options.streamOut) {
    // output=promise
    if (this.options.streamIn) {
      // output=promise, input=stream
      return new Promise(function(resolve, reject) {
        that.on('finish', function() {
          getHash(that.options).then(resolve)
            .catch(reject);
        });
      });
    } else {
      // output=promise, input=file/buffer
      return getHash(that.options);
    }
  }
  return this;
};

module.exports = SharpBlockhash;
