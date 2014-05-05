( function( root ) {

    var $     = root.$ || root.jquery,
        d3    = root.d3,
        nv    = root.nv,
        _     = root._ ,
        utils = root.h8.charts.utils;

    root.h8.charts.register( 'radar',function( el ) {

        var container = d3.select(el),
            svg = container.append('svg'),
            chart = nv.models.radarChart()
                .width(container.style('width').replace('px', ''))
                .height(container.style('height').replace('px', ''))
                .noData('暂无数据');

        var areaTooltip = chart.areaTooltip();

        chart.areaTooltip(function(d){
            if(d.value === "defaults" || !d.value){
                d.value = "";
            }
            return areaTooltip(d);
        });

        var tooltip = chart.tooltip();

        chart.tooltip(function(label,rate,point){
            if(label === 'defaults' || !label){
                label = ""
            }
            return tooltip(label,rate,point);
        })


        var onFilter,colors,duration=1200;
        var reset = function(){}

        var transformData = function(values){
            if(!_.isArray(values)){
                values = [ { key:"defaults" ,value:values } ];
            }
            return _.map(values,function(v,i){
                return { "key" : v.key , "values" : _.map(v.value,function(value,key){
                    return {'label':key,'value':value};
                })}
            });
        }

        return {
            resize: function( width, height ) {
                svg.transition().duration(duration).call(chart.width(width).height(height));
                return this;
            },
            onSelect: function( onSelect ) {
                onFilter = onSelect;
                return this;
            },
            formats: function( formats ) {
                return this;
            },
            values: function( values, isReset ) {
                svg.datum( transformData(values) )
                    .transition().duration(duration)
                    .call(chart);
                isReset && reset();
                return this;
            },
            colors: function( _colors ) {
                colors = _colors;
                return this;
            },
            duration: function( _duration ) {
                duration = _duration;
                return this;
            },
            remove: function() {
                svg.remove();
                return this;
            }
        };
    });

})(this);