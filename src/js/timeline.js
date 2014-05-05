(function ( root ) {

    var $     = root.$ || root.jquery,
        d3    = root.d3,
        nv    = root.nv,
        _     = root._ ,
        utils = root.h8.charts.utils;

    root.h8.charts.register( 'timeline',function( el ) {

        var container = d3.select(el),
            svg = container.append('svg'),
            chart = nv.models.lineWithBrushChart()
                .x(function (d) {return d[0];})
                .y(function (d) {return d[1];})
                .width(container.style('width').replace('px', ''))
                .height(container.style('height').replace('px', ''))
                .margin({top:10,left:20,right:20,bottom:20})
                .showLegend(false)
                .playMode(1)
                .showBrushExtentLabel(false)
                .noData('暂无数据');

        var onFilter,multiLegend,duration=500,defaultStep=1,currentStep=defaultStep ,forceX=1/50;

        utils.fixOverFlow( container, svg, chart );

        var reset = function(option){
            chart.brush.clear();
            chart.brush.update( option );
            container.select('.reset').classed("hide",true);
            container.select('.pause').classed('hide',true);
        }

        var setTips = function( extent ) {
            var format = chart.xAxis.tickFormat();
            container.select( '.brush-extent' ).text( extent ? format( extent[ 0 ] ) + "~" + format( extent[ 1 ] ) : '' );
        };

        chart.tooltipContent(function (key, x , y ,object) {
            return ( multiLegend ? ( '<h3>' + key + '</h3>' ) : '' ) +
                '<p>' + y + " on " + d3.time.format('%Y-%m-%d')(new Date(object.point[0])) + '</p>'
        });

        chart.dispatch.on('brush.tips', _.throttle(function(e){
            if(e.silent)return;
            var isEmpty = !!chart.brush.empty();
            setTips( isEmpty ? null : e.extent );
            container.select('.reset').classed("hide", isEmpty);
        },20));

        chart.dispatch.on('brush.filter', _.throttle(function(e){
            if(e.silent)return;
            if(onFilter)onFilter.call(null, e.extent);
        },duration));

        chart.dispatch.on('startPlay',function(){
            container.select('.pause').classed('hide',false).classed('disable',false);;
            container.select('.reset').classed('hide',true);
        });

        chart.dispatch.on('stopPlay',function(){
            container.selectAll('.play').classed('disable',false);
            container.select('.pause').classed('hide',true).classed('disable',true);
            container.select('.reset').classed('hide',!!chart.brush.empty());
        });

        chart.dispatch.on('finishPlay',function(){
        });

        chart.dispatch.on('brushPlaying',function(e){
            setTips(e.extent);
            if(onFilter)onFilter.call(null, e.extent);
        });

        container.select( '.reset' ).on( 'click', function() {
            reset({silent:false});
        });

        container.select( '.reset').classed("hide",true);
        container.select( '.pause').classed("hide",true);

        container.selectAll( '.play' ).on( 'click', function() {
            var isPlaying = d3.select( this ).classed( 'disable' );
            currentStep = isPlaying ? currentStep + 1 : defaultStep;
            chart.step( function( xDomain, data ){ return ( xDomain[1] - xDomain[0] ) / data.length * currentStep; } );
            if ( isPlaying ) return;
            chart.stop();
            d3.select(this).classed('disable',true);
            chart.playMode( +this.className.match(/mode(\d)/)[1] );
            chart.play();
        });

        container.select( '.pause' ).on( 'click', function() {
            chart.stop();
        });

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
                var valueFormat = _.isFunction( formats.value ) ? formats.value : _.values( formats.value )[ 0 ];
                var groupFormat = _.isFunction( formats.group ) ? formats.group : formats.group[ 0 ];
                chart.yAxis.tickFormat( valueFormat );
                chart.xAxis.tickFormat( groupFormat );
                return this;
            },
            values: function (values,isReset) {
                var results = utils.transformData( values );
                var datum   = results.outputs;
                multiLegend = results.multiLegend;

                var xDomain = d3.extent(datum[0].values,function(d){return d[0]});
                var xRange = +xDomain[1]-(+xDomain[0]);
                chart.forceX([+xDomain[0]-xRange*forceX,+xDomain[1]+xRange*forceX]);

                //chart.showLegend(multiLegend);
                svg.datum( datum )
                    .transition().duration(duration)
                    .call(chart);

                if(isReset)reset({silent: true});
                return this;
            },
            forceX:function( _forceX ){
                forceX = _forceX;
                return this;
            },
            remove: function () {
                svg.remove();
                return this;
            },
            duration: function( _duration ) {
                duration = _duration;
                chart.transitionDuration( duration );
                return this;
            },
            defaultStep: function( _defaultStep ) {
                defaultStep = _defaultStep;
                return this;
            },
            defaultSpan: function( defaultSpan ) {
                chart.initStep( function( brushStep ){ return defaultSpan * brushStep; } );
                return this;
            }
        };
    });

})(this);
