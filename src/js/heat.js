( function( root ) {

    var $     = root.$ || root.jquery,
        d3    = root.d3,
        nv    = root.nv,
        _     = root._ ,
        utils = root.h8.charts.utils;

    root.h8.charts.register('heat',function( el ) {

        var container = d3.select(el),
            svg = container.append('svg'),
            chart = nv.models.matrix()
                .getKey(function (d) {return d.key;})
                .getColor(function (d) {return d.value;})
                .width(container.style('width').replace('px', ''))
                .height(container.style('height').replace('px', ''))
                .margin({top:10,left:0,right:0,bottom:10})
                .showLabels(true)
                .cellWidth(48)
                .cellPaddding(8)
                .noData('暂无数据');

        var onFilter,singleSeries=false,filtered,size,filteredMappings = {},duration=1200,fm={},labelFormat,valueFormater;

        chart.tooltipContent(function(group,key,color){
            return "<h3>"+labelFormat(key)+"</h3><p>"+valueFormater(color)+"</p>";
        });

        var reset = function(option){
            option = _.extend({silent:true},option);
            filteredMappings = {};
            filtered = size;
            container.selectAll( '.nv-cell' ).classed( 'unselect', false );
            container.select( '.reset' ).classed( 'hide', true );
            if(onFilter && !option.silent)onFilter();
        }

        container.select( '.reset').on( 'click', function() {
            reset({silent:false});
        });

        var transformData = function(inputs){
            if ( !size ) {
                if ( !( size = filtered = _.size( inputs ) ) ) return [];
            }
            return [{key:'defs',values:inputs}];
        }

        chart.dispatch.on('elementClick.out',function(e){
            var key = e.point.key;
            if ( onFilter ) {
                if ( filtered === size ) {
                    filteredMappings[ key ] = {filtered:true,index: e.pointIndex};
                    container.selectAll( '.nv-cell' ).classed( 'unselect', true );
                    container.selectAll( '.nv-cell:nth-child(' + size + 'n+' + ( e.pointIndex + 1 ) + ')' ).classed( 'unselect', false );
                    filtered = 1;
                } else if ( filtered === 1 && filteredMappings[ key ] && filteredMappings[ key ].filtered ) {
                    delete filteredMappings[ key ];
                    container.selectAll( '.nv-cell' ).classed( 'unselect', false );
                    filtered = size;
                } else {
                    var oldState = filteredMappings[ key ] && filteredMappings[ key ].filtered ;
                    container.selectAll( '.nv-cell:nth-child(' + size + 'n+' + ( e.pointIndex + 1 ) + ')' ).classed( 'unselect', oldState );
                    if ( oldState ) {
                        --filtered;
                        delete filteredMappings[ key ];
                    } else {
                        if ( ++filtered === size ) filteredMappings = {};
                        else filteredMappings[ key ] = {filtered:true ,index:e.pointIndex};
                    }
                }
                container.select( '.reset' ).classed( 'hide', filtered === size );
                onFilter.apply( null, _.keys( filteredMappings ) );
            }
        });

        return {
            resize: function( width, height ) {
                chart.width(width).height(height);
                svg.transition().duration(duration).call(chart);
                return this;
            },
            onSelect: function( onSelect ) {
                onFilter = onSelect;
                return this;
            },
            formats: function( formats ) {
                labelFormat = formats.group;
                valueFormater = formats.value;
                chart.labelFormat( labelFormat );
                return this;
            },
            values: function( values, isReset ) {
                svg.datum( transformData(values) )
                    .transition().duration(duration)
                    .call(chart);
                if(isReset)reset();
                return this;
            },
            colors: function( colors ) {
                chart.colors( colors );
                return this;
            },
            duration: function( _duration ) {
                duration = _duration;
                return this;
            },
            remove: function() {
                svg.remove();
                return this;
            },
            tooltip: function( tooltip ) {
                chart.tooltipContent( tooltip );
                return this;
            },
            label: function( label ) {
                chart.labelContent( label );
                return this;
            },
            showLabels: function( showLabels ) {
                chart.showLabels( showLabels );
                return this;
            }
        };
    });

})(this);