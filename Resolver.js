var fs = require('fs');
var stringify = require('csv-stringify');

var t_result = fs.readFileSync('../result.json'); //refer news source
var t_dict = fs.readFileSync('./dic.json'); //refer dictiony source
var t_stocks = fs.readFileSync('./stocks.json'); //refer stock data
var result = JSON.parse(t_result);
var dict = JSON.parse(t_dict); //convert to json
var stocks = JSON.parse(t_stocks);

const possibility = 0; // for word evaluation
const increase_rate = 0.07; // for price premium rate
const accurate_rate = 0.4; // for rate of recommand stock rise #for reference

String.prototype.appearNumOfArray = function (arr, options) { //extend array function
    var turns = 0;
    var iv_arr = new Array(arr.length); // store words columns
    iv_arr.fill(0);
    //console.log(iv_arr);
    for (var i = 0; i < arr.length; i++) {
        //var index = this.indexOf(arr[i]);
        turns += (this.split(arr[i])).length - 1;
        if (this.indexOf(arr[i]) != -1) {
            iv_arr[i] = 1;
        }
        // if (options && this.indexOf(arr[i])!=-1) { // if have this word
        //     iv_arr[dict[0].length-1 + this.indexOf(arr[i])+1] = 1;
        // } else if (this.indexOf(arr[i])!=-1) {
        //     iv_arr[this.indexOf(arr[i])] = 1
        // }
        // if (index > -1) {
        //     result_arr.push(index);
        // }
    }
    var turn = [
        turns,
        iv_arr
    ]
    return turn;
}

Date.prototype.diff = function (date) {
    return (this.getTime() - date.getTime()) / (24 * 60 * 60 * 1000);
}

function stockPriceFromData(sid, time, offset) {
    var x_offset = stocks[0].indexOf(sid), price;
    //console.log(sid, x_offset);
    var origin_date = new Date('2016-03-15');
    time = new Date(time);
    var y_offset = 5 * Math.floor(time.diff(origin_date)) / 7;
    //console.log('x: '+Math.floor(y_offset + offset - 12));

    if ((y_offset + offset - 12) <= 249 && stocks[Math.floor(y_offset + offset - 13)][x_offset]) {
        //console.log('finding: '+stocks[Math.floor(y_offset + offset - 13)][0]);
        price = stocks[Math.floor(y_offset + offset - 13)][x_offset];
    }
    else
        price = 0;
    //console.log('price: '+price+'y: '+Math.floor(y_offset + offset-10));
    return parseFloat(price); //return stock price
}

function rateOfRecommand(up, down) {
    return up / (up + down);
}

function zeroPadding(num, n) { //add prefix zero with total n
    return Array(n - ('' + num).length + 1).join(0) + num;
}

function resolveSentence() {

    var re = /([^\u3002]*[\uff08]\d+[\uff09][^\u3002]*)[\u3002]/g; //根据股票号码所在的句子进行断句
    var pe = /[\uff08]\d+[\uff09]/g;
    var extract_result = [];
    for (var i = 0; i < result.length - 1; i++) { // number of news loop

        var matchs, sentences = [], submatch, recom_listrate = [], sentence_rate = [];
        var increase_num = 0, total_len; //count for increase stocks
        // if (result[i].time=='2017-03-15')
        //     continue;
        matchs = re.exec(result[i].content);
        if ((result[i].content.match(pe)) == null) {
            result[i].rise = 0;
            result[i].drop = 0;
            continue; // if no stock id; continue loop
        }
        var ori_date = new Date('2017-03-15');
        var now_date = new Date(result[i].time);
        //console.log("ori:%s, now:%s",ori_date,now_date)
        if (now_date.getTime() == ori_date.getTime())
            continue;

        total_len = result[i].content.match(pe).length;
        while (matchs != null) { //match the substring
            var count = (matchs[0].match(pe)).length; //have many id in the same substring
            sentences.push(matchs[0]);

            for (var x = 0; x < count - 1; x++) {
                sentences.push(matchs[0]); // added the same substring in result
            }
            matchs = re.exec(result[i].content); //contine match next substring
        }

        for (var j = 0; j < sentences.length; j++) { // number of sentences loop
            var numOfDown = sentences[j].appearNumOfArray(dict[1], 1);
            var numOfUp = sentences[j].appearNumOfArray(dict[0], 0);
            var rate = rateOfRecommand(numOfUp[0], numOfDown[0]);
            // result[i].rise = numOfUp;
            // result[i].drop = numOfDown;
            //console.log('rate: '+rate);
            var ids = sentences[j].match(pe).map(e => {
                return zeroPadding(e.slice(1, -1), 5).concat('.HK'); // remove '（）' add.HK
            }) //get id of stocks
            //console.log(ids);
            sentence_rate.push(rate);
            var time = new Date(result[i].time), offset_from = 0, offset_to = 1;
            if (time == 6) {
                offset_from = -1;
                offset_to = 2;
            } else if (time == 0) {
                offset_from = -2;
                offset_to = 1
            }
            //if (rate > possibility) { //word evaluation possibility
            for (var n = 0; n < ids.length; n++) { // 
                var t1 = stockPriceFromData(ids[n], result[i].time, offset_from)//time t1
                var t2 = stockPriceFromData(ids[n], result[i].time, offset_to);//t+1

                var inc_ratio = t1 == 0 ? 0 : (t2 - t1) / t1;
                if (inc_ratio == -1)
                    console.log("t1:%s, t2:%s, inc:%s, id:%s, date:%s", t1, t2, inc_ratio, ids[n], time);
                //result[i].increase_rate = (t2 - t1) / t1;
                if (inc_ratio >= increase_rate) { //calculate premium rate
                    increase_num++;
                }
                var element = [
                    sentences[j],
                    ids[n],
                    result[i].time,
                    numOfUp[0],
                    numOfDown[0],
                    inc_ratio,
                    result[i].author
                ];
                //element.concat()
                //console.log(numOfUp[1])
                extract_result.push(element.concat(numOfUp[1]).concat(numOfDown[1]));
            }// for ids
            //} // if should find price
            //console.log(sentences[j] + ': ' + numOfDown + ':' + numOfUp);
        }// for sen
        recom_listrate.push(sentence_rate);
        //console.log(increase_num/ total_len);
        //recom_listrate[i].acc_rate = increase_num/(total_len);
        if (increase_num / (total_len) >= accurate_rate) {
            console.log('CAUTION! Suspected Case in ' + result[i].pubName + ', From ' + result[i].author + ', With accurate of ' + increase_num / (total_len));
        }
    }//for news
}
exports.resolveSentence = resolveSentence;

var heading = ['descriptions', 'stock', 'time', 'rise', 'drop', 'increase_rate', 'author'].concat(dict[0]).concat(dict[1]) // dictiony notation added
extract_result.unshift(heading); //added heading to the top of the prepare csv array


//input = [ [ '1', '2', '3', '4' ], [ 'a', 'b', 'c', 'd' ] ];
stringify(extract_result, function (err, output) {
    fs.open('./extract_resultTEST.csv', 'w+', function (err, fd) {
        fs.write(fd, output, 0, function (err, bytes) {
            console.log("Successful Write");
        });
    });
});

//var format = JSON.stringify(result);

//fs.write('./extract_result.json', result, 'a+');
