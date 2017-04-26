var fs = require('fs'),
    JSONStream = require('JSONStream'),
    stringify = require('csv-stringify'),
    es = require('event-stream');
var t_dict = fs.readFileSync('./data/dic.json'); //refer dictiony source
var dict = JSON.parse(t_dict);

var setheading = function () {
    var heading = [['descriptions', 'stock', 'publisher', 'time', 'rise', 'drop', 'increase_rate_t+1', 'increase_rate_t+2', 'increase_rate_t+3', 'increase_rate_t+4', 'increase_rate_t+5', 'tday_price', 't1day_price', 't2day_price', 't3day_price', 't4day_price', 't5day_price', 'tday_volume', 't_1day_volume', 't_2day_volume', 't_3day_volume', 't_4day_volume', 't_5day_volume', 'author'].concat(dict[0]).concat(dict[1])] // dictiony notation added
    // try{
    // heading = heading.toString();
    // } catch (err){ console.log(err)}
    console.log('setheading')
    stringify(heading, function (err, output) {
        var chunk = ['descriptions', 'stock', 'publisher', 'time', 'rise', 'drop', 'increase_rate_t+1', 'increase_rate_t+2', 'increase_rate_t+3', 'increase_rate_t+4', 'increase_rate_t+5', 'tday_price', 't1day_price', 't2day_price', 't3day_price', 't4day_price', 't5day_price', 'tday_volume', 't_1day_volume', 't_2day_volume', 't_3day_volume', 't_4day_volume', 't_5day_volume', 'author'].concat(dict[0]).concat(dict[1]) // dictiony notation added
        fs.open('./codeblock.csv', 'w+', function (err, fd) {
            fs.write(fd, output, 0, function (err, bytes) {
                console.log("Successful Write DATA");
                stringify(chunk, function (err, output) {
                    fs.open('./codeblock.csv', 'a+', function (err, fd) {
                        fs.write(fd, output, 0, function (err, bytes) {
                            console.log("Successful Write DATA");
                        });
                    });
                });
            });
        });

    });
    //console.log(data.author);
}

setheading();