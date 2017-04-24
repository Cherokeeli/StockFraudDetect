var fs = require('fs'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    fs = require('fs'),
    stringify = require('csv-stringify');
    rj = require('Resolver');

var getStream = function () {
    var jsonData = '../result_final.json',
        stream = fs.createReadStream(jsonData, { encoding: 'utf8' }),
        parser = JSONStream.parse('*');
    return stream.pipe(parser);
};

getStream()
    .pipe(es.mapSync(function (data) {
        console.log(data.author);
    }));