# 页面模板 #
依赖jquery，underscore，d3

再引入h8-charts.min.css，h8.min.js，h8-charts.min.js

```
#!html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="utf-8"/>
    <title>your title</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="h8-charts.min.css"/>
    <script src="jquery.js"></script>
    <script src="underscore.js"></script>
    <script src="d3.js"></script>
    <script src="h8.min.js"></script>
    <script src="h8-charts.min.js"></script>
</head>
<body class="with-3d-shadow with-transitions"></body>
</html>
```

其中，body可以添加以下样式

with-3d-shadow：tooltip采用3D阴影

with-transitions：tooltip采用CSS3过渡

use-png-icons：采用PNG图标代替SVG图标（适用于某些旧服务器环境），不推荐

# 基础数据准备 #
下面准备了一些假数据。数据方面，建议整理成字符串，数字，时间（最好是长整数，效率高点），这样方便使用内置函子，而不需要写太多代码。
```
#!javascript
var records = [
    { name: 'Tom',   gender: 'male',    location: 'futian',   income: 100,   birthday: new Date( 2011, 0, 1 ).getTime() },
    { name: 'Jack',  gender: 'male',    location: 'nanshan',  income: 1000,  birthday: new Date( 1990, 2, 1 ).getTime() },
    { name: 'Kate',  gender: 'female',  location: 'luohu',    income: 6000,  birthday: new Date( 1981, 7, 1 ).getTime() },
    { name: 'Rose',  gender: 'female',  location: 'futian',   income: 15000, birthday: new Date( 1960, 4, 1 ).getTime() },
    { name: 'Marry', gender: 'ladyboy', location: 'longgang', income: 20000, birthday: new Date( 1990, 6, 1 ).getTime() },
    { name: 'Mike',  gender: 'male',    location: 'luohu',    income: 600,   birthday: new Date( 2000, 9, 1 ).getTime() }
];
```

# 构建联动集群 #
```
#!javascript
var charts = h8.charts( records );
```
或采用node.js进行后端计算
```
#!javascript
// 前端
var charts = h8.charts( 'records-id' );
// h8.server.url = '/h8';  // defaults

// 后端
var h8 = require( 'h8' );
var server = h8.server({
    getRecords: function( key, callback ) {
        if ( key === 'records-id' ) return callback( null, records );
        return callback( new Error( 'Get records failed!' ), [] );
    }
});

app.post( '/h8', function( req, res ) {
    server.receive( req.body, function( json ) {
        res.send( json );
    });
});

```

# 饼图 #
```
#!javascript
charts.pie({
    el: '#pie-chart-1',
    group: h8.groups.identity( 'location' ),         // 以'location'字段的字符特征进行分组
    value: h8.reduces.count()                        // 每个分组有多少条记录
});

charts.pie({
    el: '#pie-chart-2',
    group: h8.groups.identity( 'location' ),         // 以'location'字段的字符特征进行分组
    value: h8.reduces.count().distinct( 'gender' ),  // 每个分组数个数，并以'gender'字段去重
    donut: true                                      // 甜甜圈风格
});
```

# 条形图 #
```
#!javascript
charts.bar({
    el: '#bar-chart-1',
    group: h8.groups.identity( 'location' ),         // 以'location'字段的字符特征进行分组
    value: h8.reduces.sum( 'income' ),               // 每个分组对'income'字段求和
    top: 2                                           // 排序显示最大的前2个分组
});
```

# 柱状图 #
```
#!javascript
charts.column({
    el: '#column-chart-1',
    group: h8.groups.identity( 'location' ),                                           // 以'location'字段的字符特征进行分组
    value: {
        male:   h8.reduces.sum( 'income' ).focus( 'gender', 'male' ),                  // 每个分组对'income'字段求和，只关注'gender'为'male'的
        female: h8.reduces.sum( 'income' ).ignore( 'gender', 'ladyboy', 'male' )       // 每个分组对'income'字段求和，忽略'gender'为'ladyboy'和'male'的
    },
    ignoreWTF: true                                                                    // 不显示“未知”分组
});
```

# 图表扩展例子 #
```
#!javascript

h8.charts.register( 'pie', function( el ) {             // register your chart plugins
    return {                                            // init the chart within 'el' here and return these 'api'
        values:   function( results, reset ) {},        // refresh the chart with the results
        onSelect: function( callback ) {},              // when 'pie' slice is click by user, invoke 'callback( selection )'
        formats:  function() {},                        // you may need format functions for the results
        remove:   function() {}                         // remove the chart from 'el'
    };
});

var charts = h8.charts( array );                        // init an h8 instance

var pie = charts.pie({                                  // return the 'pie' plugin
    group: h8.groups.indentity( 'fieldA' ),             // or [ group1, group2 ] for multiple grouping
    value: h8.reduces.count(),                          // or { key1: reduce1, key2: reduce2 } for multiple reducing
    top: 5,                                             // [optional] 'top' for the 'first n', and 'bottom' for the 'last n'
    order: 'desc'                                       // [optional] 'asc' || 'desc' || yourfunction
});

pie.remove();                                           // destory this chart

charts.reset();                                         // reset all charts' selection

charts.removeAll();                                     // destory all charts

```
