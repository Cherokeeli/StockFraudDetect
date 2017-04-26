var fs = require('fs');
var stringify = require('csv-stringify');

//var t_result = fs.readFileSync('../result.json'); //refer news source
var t_dict = fs.readFileSync('./data/dic.json'); //refer dictiony source
var t_stocks = fs.readFileSync('./data/stocks.json'); //refer stock data
var t_volume =fs.readFileSync('./data/stocks_volume.json');
//var result = JSON.parse(t_result);
var dict = JSON.parse(t_dict); //convert to json
var stocks = JSON.parse(t_stocks);
var volume = JSON.parse(t_volume);

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

function indexDataFromJson(sid, time, offset, stocks) {
    console.log("offset"+offset);
    var x_offset = stocks[0].indexOf(sid),price=0;
    offset = offset*(24*60*60*1000);
    var set_time = new Date((new Date(time)).getTime()+offset);
    // console.log("comptime ",set_time.getFullYear(),set_time.getMonth(),set_time.getDate());
    //var comp_time = new Date(stocks[6][0]);
    //console.log(set_time.getDay(),comp_time.getDay());
    for (var i = 2; i < stocks.length; i++) {
        var comp_time = new Date(new Date(stocks[i][0]));
       // console.log("comptime ",set_time.getFullYear(),comp_time.getFullYear(),set_time.getMonth(),comp_time.getMonth(),set_time.getDate(),comp_time.getDate());
        if ((set_time.getFullYear()==comp_time.getFullYear())&&(set_time.getMonth()==comp_time.getMonth())&&(set_time.getDate()==comp_time.getDate())) {
            console.log("Now the time is "+stocks[i][0]);
            //console.log("comptime ",set_time.getFullYear(),comp_time.getFullYear(),set_time.getMonth(),comp_time.getMonth(),set_time.getDay(),comp_time.getDay());
            return stocks[i][x_offset];
        }
    }
    // var origin_date = new Date('2016-03-15');
    // time = new Date(time);
    // var y_offset = 5 * Math.ceil(time.diff(origin_date) / 7 ) + Math.ceil(time.diff(origin_date)%7);
    // console.log('diff: '+y_offset);
    // console.log(y_offset + offset - 18,x_offset);
    // if ((y_offset + offset - 18) <= 249 && typeof stocks[Math.floor(y_offset + offset - 18)][x_offset] != 'undefined') {
    //     //console.log('finding: '+stocks[Math.floor(y_offset + offset - 13)][0]);
    //     price = stocks[Math.floor(y_offset + offset - 18)][x_offset];
    //     console.log("Now the time is "+stocks[Math.floor(y_offset + offset-18)][0]);
    // }
    // else
    //     price = 0;
    //console.log('price: '+price+'y: '+Math.floor(y_offset + offset-10));
    //return parseFloat(price); //return stock price
}


function rateOfRecommand(up, down) {
    return up / (up + down);
}

function zeroPadding(num, n) { //add prefix zero with total n
    return Array(n - ('' + num).length + 1).join(0) + num;
}

function resolveSentence(result, callback) {

    var re = /([^\u3002]*[\uff08]\d+[\uff09][^\u3002]*)[\u3002]/g; //根据股票号码所在的句子进行断句
    var pe = /[\uff08]\d+[\uff09]/g;
    var extract_result = [];

    var matchs, sentences = [], submatch, recom_listrate = [], sentence_rate = [];
    var increase_num = 0, total_len; //count for increase stocks
    // if (result[i].time=='2017-03-15')
    //     continue;
    matchs = re.exec(result.content);
    if ((result.content.match(pe)) == null) {
        result.rise = 0;
        result.drop = 0;
        return; // if no stock id; continue loop
    }
    var ori_date = new Date('2017-03-15');
    var now_date = new Date(result.time);
    //console.log("ori:%s, now:%s",ori_date,now_date)
    if (now_date.getTime() == ori_date.getTime())
        return;

    total_len = result.content.match(pe).length;
    while (matchs != null) { //match the substring
        var count = (matchs[0].match(pe)).length; //have many id in the same substring
        sentences.push(matchs[0]);

        for (var x = 0; x < count - 1; x++) {
            sentences.push(matchs[0]); // added the same substring in result
        }
        matchs = re.exec(result.content); //contine match next substring
    }

    for (var j = 0; j < sentences.length; j++) { // number of sentences loop
        var numOfDown = sentences[j].appearNumOfArray(dict[1], 1);
        var numOfUp = sentences[j].appearNumOfArray(dict[0], 0);
        var rate = rateOfRecommand(numOfUp[0], numOfDown[0]);
        // result[i].rise = numOfUp;
        // result[i].drop = numOfDown;
        //console.log('rate: '+rate);
        var ids = sentences[j].match(pe).map(e => {
            console.log(e);
            if (e.slice(1, -1).length>5) {
                return e.slice(1, -1);
            }
            return zeroPadding(e.slice(1, -1), 5).concat('.HK'); // remove '（）' add.HK
        }) //get id of stocks
        //console.log(ids);
        sentence_rate.push(rate);
        var time = new Date(result.time), offset_from, offset_to, offset_to2, offset_to3, offset_to4, offset_to5, offset_start, offset_end, offset_end2, offset_end3, offset_end4, offset_end5;
        console.log("time "+time.getDay());
        if (time.getDay() == 6) {
            offset_from = -1;
            offset_to = 2;
            offset_to2 = 3;
            offset_to3 = 4;
            offset_to4 = 5;
            offset_to5 = 6;
            offset_start = 2;
            offset_end = -1;
            offset_end2 = -2;
            offset_end3 = -3;
            offset_end4 = -4;
            offset_end5 = -5;
        } else if (time.getDay() == 0) {
            offset_from = -2;
            offset_to = 1;
            offset_to2 = 2;
            offset_to3 = 3;
            offset_to4 = 4;
            offset_to5 = 5;
            offset_start = 1;
            offset_end = -2;
            offset_end2 = -3;
            offset_end3 = -4;
            offset_end4 = -5;
            offset_end5 = -6;
        } else if (time.getDay() == 5) {
            offset_from= 0;
            offset_to = 3;
            offset_to2 = 4;
            offset_to3 = 5;
            offset_to4 = 6;
            offset_to5 = 7;
            offset_start = 0;
            offset_end = -1;
            offset_end2 = -2;
            offset_end3 = -3;
            offset_end4 = -4;
            offset_end5 = -7;
        } else if (time.getDay() == 1) {
            offset_from= 0;
            offset_to = 1;
            offset_to2 = 2;
            offset_to3 = 3;
            offset_to4 = 4;
            offset_to5 = 7;
            offset_start = 0;
            offset_end = -3;
            offset_end2 = -4;
            offset_end3 = -5;
            offset_end4 = -6;
            offset_end5 = -7;
        } else if (time.getDay() == 2) {
            offset_from= 0;
            offset_to = 1;
            offset_to2 = 2;
            offset_to3 = 3;
            offset_to4 = 6;
            offset_to5 = 7;
            offset_start = 0;
            offset_end = -1;
            offset_end2 = -4;
            offset_end3 = -5;
            offset_end4 = -6;
            offset_end5 = -7;
        } else if (time.getDay()==3) {
            offset_from= 0;
            offset_to = 1;
            offset_to2 = 2;
            offset_to3 = 5;
            offset_to4 = 6;
            offset_to5 = 7;
            offset_start = 0;
            offset_end = -1;
            offset_end2 = -2;
            offset_end3 = -5;
            offset_end4 = -6;
            offset_end5 = -7;
        } else if (time.getDay()==4) {
            offset_from= 0;
            offset_to = 1;
            offset_to2 = 4;
            offset_to3 = 5;
            offset_to4 = 6;
            offset_to5 = 7;
            offset_start = 0;
            offset_end = -1;
            offset_end2 = -2;
            offset_end3 = -3;
            offset_end4 = -6;
            offset_end5 = -7;
        }
        //if (rate > possibility) { //word evaluation possibili ty
        for (var n = 0; n < ids.length; n++) { // 
            console.log('idsn',ids[n]);
            var t1 = indexDataFromJson(ids[n], result.time, offset_from, stocks)//time t1 // stocks
            var t2 = indexDataFromJson(ids[n], result.time, offset_to, stocks);//t+1
            var t3 = indexDataFromJson(ids[n], result.time, offset_to2, stocks);//t+2
            var t4 = indexDataFromJson(ids[n], result.time, offset_to3, stocks);//t+3
            var t5 = indexDataFromJson(ids[n], result.time, offset_to4, stocks);//t+4
            var t6 = indexDataFromJson(ids[n], result.time, offset_to5, stocks);//t+5

            var v1 = indexDataFromJson(ids[n], result.time, offset_start, volume)//time t1 // stocks
            var v2 = indexDataFromJson(ids[n], result.time, offset_end, volume);//t+1
            var v3 = indexDataFromJson(ids[n], result.time, offset_end2, volume);//t+2
            var v4 = indexDataFromJson(ids[n], result.time, offset_end3, volume);//t+3
            var v5 = indexDataFromJson(ids[n], result.time, offset_end4, volume);//t+4
            var v6 = indexDataFromJson(ids[n], result.time, offset_end5, volume);//t+5

            var inc_ratio = isNaN((t2 - t1) / t1) ? '' : (t2 - t1) / t1;
            var inc_ratio2 = isNaN((t3 - t1) / t1) ? '' : (t3 - t1) / t1;
            var inc_ratio3 = isNaN((t4 - t1) / t1) ? '' : (t4 - t1) / t1;
            var inc_ratio4 = isNaN((t5 - t1) / t1) ? '' : (t5 - t1) / t1;
            var inc_ratio5 = isNaN((t6 - t1) / t1) ? '' : (t6 - t1) / t1;
            if (inc_ratio == -1)
                console.log("t1:%s, t2:%s, inc:%s, id:%s, date:%s", t1, t2, inc_ratio, ids[n], time);
            //result[i].increase_rate = (t2 - t1) / t1;
            if (inc_ratio >= increase_rate) { //calculate premium rate
                increase_num++;
            }
            var element = [
                sentences[j],
                ids[n],
                result.pubName,
                result.time,
                numOfUp[0],
                numOfDown[0],
                inc_ratio,
                inc_ratio2,
                inc_ratio3,
                inc_ratio4,
                inc_ratio5,
                t1,
                t2,
                t3,
                t4,
                t5,
                t6,
                v1,
                v2,
                v3,
                v4,
                v5,
                v6,
                result.author
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
    // if (increase_num / (total_len) >= accurate_rate) {
    //     console.log('CAUTION! Suspected Case in ' + result.pubName + ', From ' + result.author + ', With accurate of ' + increase_num / (total_len));
    // }
    callback(extract_result);
}
exports.resolveSentence = resolveSentence;


//extract_result.unshift(heading); //added heading to the top of the prepare csv array


//input = [ [ '1', '2', '3', '4' ], [ 'a', 'b', 'c', 'd' ] ];
// stringify(extract_result, function (err, output) {
//     fs.open('./extract_resultTEST.csv', 'w+', function (err, fd) {
//         fs.write(fd, output, 0, function (err, bytes) {
//             console.log("Successful Write");
//         });
//     });
// });

//var format = JSON.stringify(result);

//fs.write('./extract_result.json', result, 'a+');
