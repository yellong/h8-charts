( function( root ) {

    var $     = root.$ || root.jquery,
        d3    = root.d3,
        nv    = root.nv,
        _     = root._ ,
        utils = root.h8.charts.utils;

    root.h8.charts.register( 'bubble', function( el ) {
        var container = d3.select( el ),
            svg       = container.append( 'svg' ),
            chart     = nv.models.scatterChart()
                .sizeRange( [100,5000] )
                .showLabels(true)
                .showDistX(true)
                .showDistY(true)
                .useVoronoi(true)
                .width( parseInt( container.style( 'width' ) ) )
                .height( parseInt( container.style( 'height' ) ) )
                .showLegend( true )
                .margin({top: 20, right: 20, bottom: 60, left: 60})
                .tooltipContent(function(label,x,y,obj){
                    var result="";
                    if(obj.point.label===label){
                        result = "<h3>"+obj.point.label+"</h3>" +
                            ( obj.point.size ? "<p>"+sizeFormat(obj.point.size)+"</p>" : '' );
                    }else{
                        result="<h3>"+label+" - "+obj.point.label+"</h3>" +
                            ( obj.point.size ? "<p>"+sizeFormat(obj.point.size)+"</p>" : '' );
                    }
                    return result;
                });

        chart.zScale().clamp(true);

        var chartData=[];

        utils.fixOverFlow( container, svg, chart );

        var onFilter, filteredMappings = {}, explodedMappings = {}, filtered, exploded=0, size, colors, sizeFormat = function( d ) { return d;}, groupFormat = function(d){return d}, subGroupFormat = function(d){return d}, duration = 600,clampDomain = false;

        var autoDomain = function(){
            var xDomain = d3.extent(chartData,function(d){return d.x});
            var yDomain = d3.extent(chartData,function(d){return d.y});
            var sizeDomain = d3.extent(chartData,function(d){return d.size});
            chart.xDomain(xDomain);
            chart.yDomain(yDomain);
            chart.sizeDomain(sizeDomain);
            chart.xPadding(0.1);
            chart.yPadding(0.3);
        };

        var fixDomain, initFixDomain = function() {
            if ( !fixDomain ) {
                var xDomain = d3.extent(chartData,function(d){return d.x});
                var yDomain = d3.extent(chartData,function(d){return d.y});
                var sizeDomain = d3.extent(chartData,function(d){return d.size});
                fixDomain = function(){
                    chart.xDomain([0,xDomain[1]*1.1]);
                    chart.yDomain([0,yDomain[1]*1.2]);
                    chart.sizeDomain(sizeDomain);
                    chart.xPadding(0);
                    chart.yPadding(0);
                };
            }
        };

        var fixColorData = function(d,i){
            d.color =  colors[d.key] || chart.color().call({},{},i);
            if( !filteredMappings[d.key] && !_.isEmpty(filteredMappings)){
                d.color = "#ccc";
            }
            return d;
        }

        var fixAllColorData = function(){
            colors = colors || {};
                _.each(chartData,function(d,i){
                    colors[d.key] = colors[d.key] || chart.color()(d,i);
                    fixColorData(d,i);
                });
        }

        var fixAllExplodedMappings = function(){
            _.each(chartData,function(s,i){
                if(explodedMappings[s.key]){
                    transformSeries({
                        seriesIndex:i,
                        series:s,
                        point: s.values[0],
                        pointIndex: 0
                    },function(d){
                        return _.map(d.series._series,function(p){
                            return { x: p.value.x,y: p.value.y,size: p.value.s,key: p.key,label: p.key }
                        })
                    })
                }else{
                    transformSeries({
                        seriesIndex:i,
                            series:s,
                        point: s.values[0],
                        pointIndex: 0
                    },function(d){
                        return [{
                            key: d.series.key,
                            label:  d.series.key,
                            size: d.series.s,
                            s: d.series.s,
                            x: d.series.x,
                            y: d.series.y
                        }];
                    })
                }
            })
        }

        var fixSeriesColor = function(seriesIndex,selected){
            if( seriesIndex!=='all' ){
                container.selectAll( '.nv-group.nv-series-' + seriesIndex ).style( 'fill', selected?chart.color().call({},{},seriesIndex):'#ccc' );
                container.selectAll( '.nv-group.nv-series-' + seriesIndex ).style( 'stroke', selected?chart.color().call({},{},seriesIndex):'#ccc' );
            }else{
                container.selectAll( '.nv-group' ).style( 'fill', selected?function(d){
                    return chart.color().call({},{}, d.values[0].series );
                }:'#ccc' );
                container.selectAll( '.nv-group' ).style( 'stroke', selected?function(d){
                    return chart.color().call({},{},  d.values[0].series );
                }:'#ccc' );
            }
        }

        var transformSeries = function(e,getValues){
            chartData[e.seriesIndex] =  {
                key: e.series.key,
                values: getValues(e),
                _series: e.series._series,
                s:e.series.s,
                size:e.series.s,
                x:e.series.x,
                y:e.series.y,
                label:e.series.key
            }
            chartData[e.seriesIndex] = fixColorData(chartData[e.seriesIndex],e.seriesIndex);
            return chartData[e.seriesIndex];
        }

        var explode = function(e){
            transformSeries(e,function(d){
                return _.map(d.series._series,function(p){
                    return { x: d.point.x, y: d.point.y,size: +p.value.s.toFixed(2),key: subGroupFormat(p.key),label: subGroupFormat(p.key) }
                })
            });
            svg.datum(chartData).call( chart );
            transformSeries(e,function(d){
                var result = [];
                _.each(d.series._series,function(p){
                    if(+p.value.s.toFixed(2) !== 0){
                        result.push({
                            x: +p.value.x.toFixed(2),
                            y: +p.value.y.toFixed(2),
                            size: +p.value.s.toFixed(2),
                            key: subGroupFormat(p.key),label: subGroupFormat(p.key)
                        });
                    }
                });
                return result;
            });
            svg.datum(chartData).transition().duration( duration ).call( chart );
            explodedMappings[e.series.key] = true;
        }
        var collapse= function(e){
            transformSeries(e,function(d){
                return _.map(d.series._series,function(p){
                    return { x: d.series.x, y: d.series.y,size: +p.value.s.toFixed(2),key: subGroupFormat(p.key),label: subGroupFormat(p.key) }
                })
            });
            svg.datum(chartData).transition().duration( duration ).call( chart );
            transformSeries(e,function(d){
                return [{
                        key: d.series.key,
                        label: d.series.key,
                        size: d.series.s,
                        s: d.series.s,
                        x: d.series.x,
                        y: d.series.y
                }];
            });
            setTimeout(function(){
                svg.datum( chartData ).call( chart );
            },duration);
            explodedMappings[e.series.key] = false;
        }

        var removeTooltip = function(e){
            chart.dispatch.tooltipHide(d3.event);
            d3.select('.nv-chart-' + chart.scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distx-' + e.pointIndex)
                .attr('y1', 0);
            d3.select('.nv-chart-' + chart.scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-disty-' + e.pointIndex)
                .attr('x2', chart.distY.size());
        }

        var reset = function(){
            filteredMappings = {};
            explodedMappings = {};
            fixAllColorData();
            fixAllExplodedMappings();
            filtered = size = _.size(chartData);
            exploded = 0;
            if(!clampDomain){
                autoDomain();
            }else{
                fixDomain();
            }
            svg.datum(chartData);
            chart.update();
            container.select( '.reset' ).classed( 'hide', filtered === size && exploded === 0 );
        }

        chart.scatter.dispatch.on("elementDblClick.out",function(d){
            if(!d.series._series || d.series._series.length === 1)return;
            if( explodedMappings[d.series.key] ){
                collapse(d);
                exploded -- ;
            }else{
                explode(d);
                exploded ++ ;
            }
            container.select( '.reset' ).classed( 'hide', filtered === size && exploded === 0 );
        });

        chart.scatter.dispatch.on("elementClick.out", function(e){
            //移除tooltip
            removeTooltip(e);

            var series_key = e.series.key;

            //筛选
                if ( filtered === size ) {
                    filteredMappings[ series_key ] = true;
                    fixSeriesColor( 'all' , false);
                    fixSeriesColor( e.seriesIndex , true );
                    filtered = 1;
                } else if ( filtered === 1 && filteredMappings[ series_key ] ) {
                    delete filteredMappings[ series_key ];
                    fixSeriesColor( 'all' , true );
                    filtered = size;
                } else {
                    var oldState = filteredMappings[ series_key ];
                    fixSeriesColor(e.seriesIndex,!oldState);
                    if ( oldState ) {
                        --filtered;
                        delete filteredMappings[ series_key ];
                    } else {
                        if ( ++filtered === size ) {
                            filteredMappings = {};
                        }else {
                            filteredMappings[ series_key ] = true;
                        }
                    }
                }
                fixAllColorData();
                container.select( '.reset' ).classed( 'hide', filtered === size && exploded === 0 );
                if(onFilter){
                    onFilter.apply( null, _.keys( filteredMappings ) );
                }

        });

        chart.scatter.dispatch.on("elementMouseover.out",function(e){
            var group = d3.select(".nv-series-"+ e.seriesIndex);
            group.moveToFront().select(".nv-point-"+ e.pointIndex).moveToFront();
        });

        container.select(".reset").on("click",function(){
            reset.call(this,arguments);
            if(onFilter)onFilter.apply( null, _.keys( filteredMappings ) );
        });

        container.select('.lock').on('click',function(){
            container.select('.unlock').classed( 'hide', false );
            d3.select(this).classed( 'hide', true );
            clampDomain = true;
            fixDomain();
            svg.transition().duration( duration ).call( chart );
        });

        container.select('.unlock').on('click',function(){
            container.select('.lock').classed( 'hide', false );
            d3.select(this).classed( 'hide', true );
            clampDomain = false;
            autoDomain();
            svg.transition().duration( duration ).call( chart );
        })

        var onFilter = null;

        return {
            colors: function( colors ) {
                chart.color(colors);
                return this;
            },
            resize: function( width, height ) {
                chart.width(width).height( height );
                utils.fixOverFlow( container, svg, chart );
                svg.transition().duration( duration ).call( chart );
                return this;
            },
            tooltip:function(fn){
                chart.tooltipContent(fn);
                return this;
            },
            onSelect: function( onSelect ) {
                onFilter = onSelect;
                return this;
            },
            formats: function( formats ) {
                chart.xAxis.tickFormat( formats.value.x );
                chart.yAxis.tickFormat( formats.value.y );
                sizeFormat = formats.value.s;
                if (_.isFunction( formats.group )) {
                    groupFormat = formats.group;
                }else{
                    groupFormat =  formats.group[0];
                    subGroupFormat = formats.group[1];
                }
                return this;
            },
            values: function( values , isReset ) {

                if(!(filtered = size = _.size(values)))return;

               chartData = [];
               _.each(values,function(group,index){
                    var s =  +group.value.s || 0;
                        s = s.toFixed(2);
                    group.key = groupFormat( group.key );
                    var t = {
                        key:group.key,
                        s: +s,
                        size: +s,
                        x: +group.value.x.toFixed(2),
                        y: +group.value.y.toFixed(2),
                        label: groupFormat(group.key)
                    }
                    chartData.push( {
                        key:group.key,
                        values:[t] ,
                        _series:(group.children || null),
                        s:+s,
                        size:+s,
                        x:+group.value.x.toFixed(2),
                        y:+group.value.y.toFixed(2),
                        label: groupFormat(group.key),
                        color:(group.color || null)
                    });
                });

                fixAllColorData();
                fixAllExplodedMappings();

                initFixDomain();
                if(!clampDomain){
                    autoDomain();
                }else{
                    fixDomain();
                }

                svg.datum( chartData )
                    .transition().duration( duration )
                    .call( chart );

                if(isReset)reset();

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
            scale: function( mode ) {
                clampDomain = mode === 'fixed';
                container.select( clampDomain ? '.unlock' : '.lock').classed( 'hide', false );
                return this;
            },
            showLabels: function( showLabels ) {
                chart.showLabels( showLabels );
                return this;
            }
        };
    });

})(this);
