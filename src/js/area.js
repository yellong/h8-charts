(function ( root ) {

    var $     = root.$ || root.jquery,
        d3    = root.d3,
        nv    = root.nv,
        _     = root._ ,
        utils = root.h8.charts.utils;

    root.h8.charts.register( 'area', function (el) {
        var container = d3.select(el),
            svg = container.append('svg'),
            chart = nv.models.stackedAreaChart()
                .x( function( d ) { return d[ 0 ]; } )
                .y( function( d ) { return d[ 1 ]; } )
                .height( parseInt( container.style( 'height' ) ) )
                .noData( '暂无数据' );

        var onFilter,multiLegend,duration=1200,valueFormat = d3.format( ',.0f' ), groupFormat;

        utils.fixOverFlow( container, svg, chart );

        var reset = function(option){
//            chart.brush.clear();
//            chart.brush.update( option );
            container.select( '.reset').classed("hide",true);
        }
//
//        chart.tooltipContent(function (key, x , y ,object) {
//            return ( multiLegend ? ( '<h3>' + key + '</h3>' ) : '' ) +
//                '<p>' + y + " on " + d3.time.format('%Y-%m-%d')(new Date(object.point[0])) + '</p>'
//        });
//
//        chart.dispatch.on('brush.out', _.debounce(function(e){
//            if(e.silent)return;
//            container.select( '.reset').classed("hide",chart.brush.empty());
//            if(onFilter)onFilter.call(null, e.extent);
//        },500) );
//
//        container.select( '.reset').on( 'click', function() {
//           reset({silent:false});
//        });
//
//        container.select( '.reset').classed("hide",true);

        return {
            colors: function (colors) {
                chart.color(colors);
                return this;
            },
            resize: function (width, height) {
                chart.width(width).height( height );
                utils.fixOverFlow( container, svg, chart );
                svg.transition().duration(duration).call( chart );
                return this;
            },
            onSelect: function (callback) {
                onFilter = callback;
                return this;
            },
            formats: function (formats) {
                valueFormat = _.isFunction( formats.value ) ? formats.value : _.values( formats.value )[ 0 ];
                groupFormat = _.isFunction( formats.group ) ? formats.group : formats.group[ 0 ];
                chart.yAxis.tickFormat( valueFormat );
                chart.xAxis.tickFormat( groupFormat );
                return this;
            },
            values: function (values,isReset) {
                var results = utils.transformData( values );
                var datum   = results.outputs;
                multiLegend = results.multiLegend;
                chart.showLegend(multiLegend);
                chart.showControls(false);
                svg.datum( datum )
                    .transition().duration(duration)
                    .call(chart);
//                chart.brush.update();
                if(isReset)reset();
                return this;
            },
            remove: function () {
                svg.remove();
                return this;
            },
            duration: function( _duration ) {
                duration = _duration;
                return this;
            }
        };
    });
})(this);
