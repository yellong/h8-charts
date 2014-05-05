(function( root ) {

    var $     = root.$ || root.jquery,
        d3    = root.d3,
        nv    = root.nv,
        _     = root._ ,
        utils = root.h8.charts.utils;

    root.h8.charts.register( 'pie', function( el ) {

        var container = d3.select( el ),
            svg       = container.append( 'svg' ),
            duration  = 500,
            chart     = nv.models.pie()
                .x( function( d ) { return d.key; } )
                .y( function( d ) { return d.value; } )
                .pieLabelsOutside( false )
                .donut( false )
                .donutRatio( 0.3 )
                .width( parseInt( container.style( 'width' ) ) )
                .height( parseInt( container.style( 'height' ) ) )
                .margin( { top: 5, right: 0, bottom: 20, left: 0 } );

        var onFilter, filteredMappings = {}, filtered, size, labelFormat = function( d ) { return d; }, valueFormat = d3.format( ',.0f' );

        chart.dispatch.on( 'elementMouseover.tooltip', function( e ) {
            nv.tooltip.show( e.pos, '<h3>' + labelFormat( e.label ) + '</h3><p>' + valueFormat( e.value ) + '</p>', e.value < 0 ? 'n' : 's' );
        }).on( 'elementMouseout.tooltip', function( e ) {
            nv.tooltip.cleanup();
        }).on( 'elementClick', function( e ) {
            if ( onFilter ) {
                if ( filtered === size ) {
                    filteredMappings[ e.label ] = true;
                    container.selectAll( '.nv-slice' ).classed( 'unselect', true );
                    container.select( '.nv-slice:nth-child(' + ( e.index + 1 ) + ')' ).classed( 'unselect', false );
                    filtered = 1;
                } else if ( filtered === 1 && filteredMappings[ e.label ] ) {
                    delete filteredMappings[ e.label ];
                    container.selectAll( '.nv-slice' ).classed( 'unselect', false );
                    filtered = size;
                } else {
                    var oldState = filteredMappings[ e.label ];
                    container.select( '.nv-slice:nth-child(' + ( e.index + 1 ) + ')' ).classed( 'unselect', oldState );
                    if ( oldState ) {
                        --filtered;
                        delete filteredMappings[ e.label ];
                    } else {
                        if ( ++filtered === size ) filteredMappings = {};
                        else filteredMappings[ e.label ] = true;
                    }
                }
                container.select( '.reset' ).classed( 'hide', filtered === size );
                onFilter.apply( null, _.keys( filteredMappings ) );
            }
        });

        var resetColors = function() {
            filteredMappings = {};
            filtered = size;
            container.selectAll( '.nv-slice' ).classed( 'unselect', false );
            container.select( '.reset' ).classed( 'hide', true );
        };

        container.select( '.reset' ).on( 'click', function() {
            resetColors();
            onFilter();
        });

        container.select( '.reset').classed("hide",true);

        return {
            colors: function( colors ) {
                chart.color( colors );
                return this;
            },
            resize: function( width, height ) {
                chart.width(width).height( height );
                svg.transition().duration( duration ).call( chart );
                return this;
            },
            onSelect: function( onSelect ) {
                onFilter = onSelect;
                return this;
            },
            formats: function( formats ) {
                labelFormat = formats.group;
                valueFormat = formats.value;
                chart.labelFormat( labelFormat );
                return this;
            },
            values: function( values, reset ) {
                reset && resetColors();
                size || ( size = filtered = _.size( values ) );
                svg.datum( [ values ] )  // data要反映空白数据的key，才能占颜色位置, 和color一样，放外层做
                    .transition().duration( duration )
                    .call( chart );
                return this;
            },
            remove: function() {
                svg.remove();
                return this;
            },
            duration: function( _duration ) {
                duration = _duration;
                return this;
            },
            donut: function( donut ) {
                chart.donut( donut );
                if ( size ) svg.transition().duration( duration ).call( chart );
                return this;
            },
            donutRatio: function( ratio ) {
                chart.donut( !!ratio );
                chart.donutRatio( ratio );
             // chart.showLabels( showLabel );  // nv sucks...
                svg.selectAll( '.nv-label text' ).style( 'opacity', ratio < 0.6 ? '1' : '0' );
                if ( size ) svg.transition().duration( duration ).call( chart );
                return this;
            }
        };
    });

})( this );

