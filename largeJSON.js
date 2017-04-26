var fs = require('fs'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    fs = require('fs'),
    stringify = require('csv-stringify'),
    rj = require('./Resolver');
var t_dict = fs.readFileSync('./dic.json'); //refer dictiony source
//var result = JSON.parse(t_result);
var dict = JSON.parse(t_dict);

var getStream = function () {
    var jsonData = '../result_final.json', // input json file
        stream = fs.createReadStream(jsonData, { encoding: 'utf8' }),
        parser = JSONStream.parse('*');
    return stream.pipe(parser);
};

var setheading = function () {
    var heading = ['descriptions', 'stock', 'publisher', 'time', 'rise', 'drop', 'increase_rate_t+1', 'increase_rate_t+2', 'increase_rate_t+3', 'increase_rate_t+4', 'increase_rate_t+5','t0','t1','t2','t3','t4','t5', 'author'].concat(dict[0]).concat(dict[1]) // dictiony notation added
    // try{
    // heading = heading.toString();
    // } catch (err){ console.log(err)}
    console.log('setheading')
    stringify(heading, function (err, output) {
        fs.open('./stocknews.csv', 'a+', function (err, fd) {
            fs.write(fd, output, 0, function (err, bytes) {
                console.log("Successful Write HEADING");
                getStream()
                    .pipe(es.mapSync(function (data) {
                        if (data.time=='2016-03-14') return;
                        rj.resolveSentence(data, chunk => {
                            stringify(chunk, function (err, output) {
                                fs.open('./stocknews.csv', 'a+', function (err, fd) {
                                    fs.write(fd, output, 0, function (err, bytes) {
                                        console.log("Successful Write DATA");
                                    });
                                });
                            });
                        });
                        //console.log(data.author);

                    }));
            });
        });
    });
}

setheading();
