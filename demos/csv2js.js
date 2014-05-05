var fs = require('fs');
var csv = require('ya-csv');
var jschardet = require("jschardet");
var iconv = require('iconv-lite');


function cvs2json(filename){
    filename =filename || 'data';

    var csvIn = csv.createCsvFileReader('./'+filename+'.csv', {
            'separator': ',',
            'quote':   '"',
            'comment': '#',
            columnsFromHeader:true
        }),csvArray = [];
        console.log('start to read '+filename+'.cvs ...');
        csvIn.addListener('data',function(data){
            csvArray.push(data);
        });

        csvIn.addListener('end',function(){
            console.log('read '+filename+'.cvs over!');
        	fs.writeFileSync('./'+filename+'.js', 'var data='+JSON.stringify(csvArray) );
        });
}

var walk = function(dir) {
    var results = []
    var list = fs.readdirSync(dir)
    list.forEach(function(file) {
        file = dir + '/' + file
        var stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(walk(file))
        else results.push(file)
    })
    return results
}

walk('.').filter(function(file) {
    return /(.*)\.csv$/.test(file) && file.indexOf( 'node_modules' ) === -1;
}).forEach(function(f){
    //强行转换编码为utf8
    var rfs = fs.readFileSync('./'+f),encoding = jschardet.detect(rfs).encoding;
    if(encoding!=='utf-8')
    {
        fs.writeFileSync('./'+f,iconv.encode(iconv.decode(rfs,encoding),'utf-8'));
    }
    cvs2json(f.replace('.csv',''));
})


