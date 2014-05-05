(function( root ) {

    var $     = root.$ || root.jquery,
        d3    = root.d3,
        nv    = root.nv,
        _     = root._ ,
        utils = root.h8.charts.utils;

    root.h8.charts.register( 'bar', function( el ) {
        var container = d3.select( el ),
            svg       = container.append( 'svg' ),
            chart     = nv.models.multiBarHorizontalChart()
                .x( function( d ) { return d[ 0 ]; } )
                .y( function( d ) { return d[ 1 ]; } )
                .height( parseInt( container.style( 'height' ) ) )
                .showControls( true )
                .showLegend( true )
                .noData( '暂无数据' )
                .tooltipContent( function( key, x, y, e, graph ) {
                    return '<h3>' + x + ( multiLegend ? '-' + key : '' ) + '</h3><p>' + valueFormat( e.value ) + '</p>';
                });

        chart.multibar.stacked( true );
        utils.fixOverFlow( container, svg, chart );
        chart.controls.key( function( d ) {
            switch( d.key ) {
                case 'Stacked': return '堆积图';
                case 'Grouped': return '分组图';
            }
        }).rightAlign( false );

        var onFilter, onColor, filteredMappings = {}, filtered, size, duration = 500, valueFormat = d3.format( ',.0f' ), groupFormat, multiLegend, colors;

        var resetColors = function() {
            filteredMappings = {};
            filtered = size;
            container.selectAll( '.nv-bar' ).classed( 'unselect', false );
            container.select( '.reset' ).classed( 'hide', true );
        };

        var addLabels = function() {
            var rangeBand = chart.multibar.xScale().rangeBand();
            container.selectAll( '.nv-bar' ).each( function( d ) {
                d3.select( this ).select( 'text' )
                    .attr( 'dy', '.32em' )
                    .attr( 'x', '5' )
                    .attr( 'y', rangeBand / 2 )
                    .text( chart.x()( d ) );
            });
        };

        var selectHacks = function() {
            if ( filtered !== size ) {
                container.selectAll( '.nv-bar' ).each( function( datum ) {
                    filteredMappings[ datum[ 0 ] ] || d3.select( this ).classed( 'unselect', true );
                });
            }
            if ( onColor ) {
                container.selectAll( '.nv-bar' ).each( function( datum ) {
                    var color = onColor && onColor( datum ) || '';
                    d3.select( this ).style( 'fill', color ).style( 'stroke', color );
                });
            }
            multiLegend || addLabels();
        };

        chart.dispatch.on( 'stateChange.out', function() {
            _.defer( function() { selectHacks(); });
        });

        chart.multibar.dispatch.on( 'elementClick', function( e ) {
            var key = e.point[ 0 ], index = e.pointIndex;
            if ( onFilter ) {
                if ( filtered === size ) {
                    filteredMappings[ key ] = { filtered: true, index: index };
                    container.selectAll( '.nv-bar' ).classed( 'unselect', true );
                    container.selectAll( '.nv-bar:nth-child(' + size + 'n+' + ( index + 1 ) + ')' ).classed( 'unselect', false );
                    filtered = 1;
                } else if ( filtered === 1 && filteredMappings[ key ] && filteredMappings[ key ].filtered ) {
                    delete filteredMappings[ key ];
                    container.selectAll( '.nv-bar' ).classed( 'unselect', false );
                    filtered = size;
                } else {
                    var oldState = filteredMappings[ key ] && filteredMappings[ key ].filtered ;
                    container.selectAll( '.nv-bar:nth-child(' + size + 'n+' + ( index + 1 ) + ')' ).classed( 'unselect', oldState );
                    if ( oldState ) {
                        --filtered;
                        delete filteredMappings[ key ];
                    } else {
                        if ( ++filtered === size ) filteredMappings = {};
                        else filteredMappings[ key ] = { filtered: true, index: index };
                    }
                }
                container.select( '.reset' ).classed( 'hide', filtered === size );
                onFilter.apply( null, _.keys( filteredMappings ) );
            }
        });

        container.select( '.reset' ).on( 'click', function() {
            resetColors();
            onFilter();
        });

        container.select( '.reset').classed("hide",true);

        return {
            colors: function( _colors ) {
                colors = _colors;
                return this;
            },
            onColor: function( _onColor ) {
                onColor = _onColor;
                return this;
            },
            resize: function( width, height ) {
                chart.width( width ).height( height );
                utils.fixOverFlow( container, svg, chart );
                svg.transition().duration( duration ).call( chart );
                selectHacks();
                return this;
            },
            onSelect: function( onSelect ) {
                onFilter = onSelect;
                return this;
            },
            formats: function( formats ) {
                valueFormat = _.isFunction( formats.value ) ? formats.value : _.values( formats.value )[ 0 ];
                groupFormat = _.isFunction( formats.group ) ? formats.group : formats.group[ 0 ];
                chart.yAxis.tickFormat( valueFormat );
                chart.xAxis.tickFormat( groupFormat );
                return this;
            },
            values: function( values, reset ) {
                reset && resetColors();
                var results = utils.transformData( values );
                var datum   = results.outputs;
                multiLegend = results.multiLegend;
                if ( !size ) {
                    if ( !( size = filtered = _.size( values ) ) ) return;
                    if ( !multiLegend ) {
                        _.defer( function() { container.select( '.nv-multiBarHorizontalChart' ).classed( 'single-legend', true ); } );
                        chart.showControls( false ).showLegend( false ).margin( { top: 10 } );
                    }
                }
                if ( colors ) {
                    if ( datum.length === 1 ) datum[ 0 ].color = colors[ 1 ];  // for softer color
                    else _.each( datum, function( d, i ) {
                        d.color = colors[ i % colors.length ];
                    });
                }
                svg.datum( datum ).transition().duration( duration ).call( chart );
                selectHacks();
                return this;
            },
            duration: function( _duration ) {
                duration = _duration;
                return this;
            },
            remove: function() {
                container.classed( 'label-reverse', false );
                svg.remove();
                return this;
            },
            labelReverse: function( flag ) {
                container.classed( 'label-reverse', flag );
                return this;
            },
            tooltip: function( tooltip ) {
                chart.tooltipContent( tooltip );
                return this;
            },
            label: function( label ) {
                chart.x( label );
                return this;
            }
        };
    });

})( this );

