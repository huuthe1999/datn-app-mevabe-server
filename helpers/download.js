const fs = require('fs');
const request = require('request');

module.exports =  download = (uri, filename, callback) => {
  request.head(uri, async (err, res, body) => {
    // console.log('content-type:', res.headers['content-type']);
    // console.log('content-length:', res.headers['content-length']);

    await request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};