var fs = require('fs');
var t_result = fs.readFileSync('./result.json'); //read news
var t_dict = fs.readFileSync('./dic.json'); //read news
var t_stocks = fs.readFileSync('./stocks.json'); //read news
var result = JSON.parse(t_result);
var dict = JSON.parse(t_dict); //convert to json
var stocks = JSON.parse(t_stocks);
const possibility = 0.3; // for word evaluation
const increase_rate = 0.07; // for price premium rate
const accurate_rate = 0.4; // for rate of recommand stock rise

String.prototype.appearNumOfArray = function (arr) { //extend array function
    var turns = 0;
    for (var i = 0; i < arr.length; i++) {
        //var index = this.indexOf(arr[i]);
        turns += (this.split(arr[i])).length - 1;
        // if (index > -1) {
        //     result_arr.push(index);
        // }
    }
    return turns;
}

Date.prototype.diff = function (date) {
    return (this.getTime() - date.getTime()) / (24 * 60 * 60 * 1000);
}

function stockPriceFromData(sid, time, offset) {
    var x_offset = stocks[0].indexOf(sid);
    //console.log('xoff: '+x_offset);
    var origin_date = new Date('2016/03/15');
    time = new Date(time);
    var y_offset = 5*Math.floor(time.diff(origin_date))/7;
    //console.log('yoff: '+y_offset);
    
    var price = stocks[Math.floor(y_offset + offset-10)][x_offset];
    //console.log('price: '+price+'y: '+Math.floor(y_offset + offset-10));
    return price? price: 0; //return stock price
}

function rateOfRecommand(up, down) {
    return up/(up+down);
}

var re = /([^\u3002]*[\uff08]\d+[\uff09][^\u3002]*)[\u3002]/g; //根据股票号码所在的句子进行断句
var pe = /[\uff08]\d+[\uff09]/g;
for (var i = 0; i < result.length; i++) { // number of news loop

    var matchs, sentences = [], submatch, recom_listrate = [], sentence_rate=[];
    var increase_num = 0,total_len; //count for increase stocks
    matchs = re.exec(result[i].content);
    if((result[i].content.match(pe))==null) {
        continue; // if no stock id; continue loop
    }
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
        var numOfDown = sentences[j].appearNumOfArray(dict[1]);
        var numOfUp = sentences[j].appearNumOfArray(dict[0]);
        var rate = rateOfRecommand(numOfUp, numOfDown);
        //console.log('rate: '+rate);
        var ids = sentences[j].match(pe).map(e=> {
            return e.slice(1,-1).concat('.HK'); // remove '（）' add.HK
        }) //get id of stocks
        //console.log(ids);
        sentence_rate.push(rate);
        
        if (rate > possibility) { //word evaluation possibility
            for (var n = 0; n < ids.length; n++) { // 
                var t1 = stockPriceFromData(ids[n], result[i].time,0)//time t1
                var t2 = stockPriceFromData(ids[n],result[i].time,1);//t+1
                //console.log("t1t2:"+t1+' '+t2);
                if ((t2-t1)/t1 >= increase_rate) { //calculate premium rate
                    increase_num++;
                }
            }// for ids
        } // if should find price
        //console.log(sentences[j] + ': ' + numOfDown + ':' + numOfUp);
    }// for sen
    recom_listrate.push(sentence_rate);
    //console.log(increase_num/ total_len);
    //recom_listrate[i].acc_rate = increase_num/(total_len);
    if (increase_num/(total_len) >= accurate_rate) {
        console.log('CAUTION! Suspected Case in '+result[i].pubName+', From '+result[i].author+', With accurate of '+increase_num/(total_len));
    }
}//for news