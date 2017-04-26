var fs = require('fs'),
    JSONStream = require('JSONStream'),
    es = require('event-stream'),
    stringify = require('csv-stringify'),
    rj = require('./Resolver');
var t_dict = fs.readFileSync('./data/dic.json'); //refer dictiony source
var dict = JSON.parse(t_dict); 

var getStream = function () {
    var jsonData = 'result_final.json', // input json file
        stream = fs.createReadStream(jsonData, { encoding: 'utf8' }),
        parser = JSONStream.parse('*');
    return stream.pipe(parser);
};

var setheading = function () {
    var heading = [['descriptions', 'stock', 'publisher', 'time', 'rise', 'drop', 'increase_rate_t+1', 'increase_rate_t+2', 'increase_rate_t+3', 'increase_rate_t+4', 'increase_rate_t+5','tday_price','t1day_price','t2day_price','t3day_price','t4day_price','t5day_price','tday_volume','t_1day_volume','t_2day_volume','t_3day_volume','t_4day_volume','t_5day_volume', 'author'].concat(dict[0]).concat(dict[1])] // dictiony notation added
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
