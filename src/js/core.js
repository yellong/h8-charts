(function() {
    var root = this;
    h8.charts = function( options ) {
        if ( _.isString( options ) || _.isArray( options ) ) options = { datasource: options };
        var $ = root.jQuery || root.Zepto || root.ender || root.$;
        if ( !$ ) throw new Error( 'jQuery || Zepto || Ender is needed.' );
        if ( !options.datasource ) throw new Error( 'datasource is needed.' );
        if ( !options.send ) options.send = _.isArray( options.datasource ) ? ( h8.localServer || ( h8.localServer = h8.server() ) ).receive :
            function( data, callback ) {
                $.ajax({
                    type: "POST",
                    url: h8.server.url || '/h8',
                    data: data,
                    dataType: 'json',
                    success: callback
                });
            };

        var serverWTF = null, clientWTF = h8.WTF;

        var cluster = {
            client: h8.client( options ),
            charts: {},
            removeAll: function() {
                _.invoke( this.charts, 'remove' );
            },
            reset: function() {
                var that = this;
                this.client.reset( function( results ) {
                    that.repaint( results, true );
                });
            },
            repaint: function( results, reset ) {
                if ( results.WTF ) serverWTF = results.WTF;
                _.each( this.charts, function( chart, id ) {
                    var group = results.groups[ id ];
                    if ( group ) chart.repaint( group.children, reset );
                    else if ( id.indexOf( 'count' ) > -1 )  chart.repaint( results, reset );
                });
            }
        };

        $( window ).on( 'beforeunload', function() {
            cluster.client.teardown();
        });

        var getFormatter = function( formatter ) {
            return function( key ) {
                return _.isEqual( key, serverWTF ) ? clientWTF : ( formatter ? formatter( key ) : key );
            };
        };

        _.each( h8.charts.plugins, function( name ) {
            cluster[ name ] = function( options ) {
                var defaults = ( h8.charts.options || h8.charts.configs || h8.charts.option || h8.charts.config || {} );
                options = _.defaults( options, defaults[ name ], defaults.defaults, { formats: {} } );
                var chartId = _.uniqueId( name + '_' ), reduces = {};

                if ( options.group ) {
                    if ( _.isArray( options.group ) ) {  // multiple grouping
                        options.formats.group = options.formats.value || [];
                        _.each( options.group, function( funcs, index ) {
                            options.formats.group[ index ] = getFormatter( options.formats.group[ index ] || options.group[ index ].format );
                        });
                    } else {
                        options.formats.group = getFormatter( options.formats.group || options.group.format );
                    }
                }
                if ( options.value ) {
                    if ( _.has( options.value, 'memo' ) ) {
                        options.formats.value = getFormatter( options.formats.value || options.value.format );
                        reduces[ _.uniqueId( 'reduce_' ) ] = { funcs: options.value };
                    } else {  // multiple reducing
                        options.formats.value = options.formats.value || {};
                        _.each( options.value, function( funcs, key ) {
                            options.formats.value[ key ] = getFormatter( options.formats.value[ key ] || options.value[ key ].format );
                            reduces[ _.uniqueId( 'reduce_' ) ] = { key: key, funcs: funcs };
                        });
                    }
                }

                var ignoreRepaint = false;  // for better performance
                options.onSelect = function() {
                    cluster.client.select( chartId, _.toArray( arguments ), function() {
                        ignoreRepaint = true;
                        cluster.repaint.apply( cluster, arguments );
                    });
                };

                options.onReset = _.bind( cluster.reset, cluster );

                var chart = h8.charts[ name ]( _.omit( options, 'group', 'value', 'order', 'top', 'bottom' ) );

                chart.settings = function() {
                    return {
                        groups: options.group ? [ { id: chartId, funcs: options.group, order: options.order, top: options.top, bottom: options.bottom } ] : [],
                        reduces: _.map( reduces, function( tuple, id ) {
                            return _.extend( { id: id, groupId: chartId }, tuple );
                        })
                    };
                };

                cluster.charts[ chartId ] = chart;
                ( cluster.unrender || ( cluster.unrender = [] ) ).push( chartId );
                _.defer( function() {  // make all charts's initialization in one request
                    if ( _.isEmpty( cluster.unrender ) ) return;
                    var settings = { groups: [], reduces: [] }, chartId = null;
                    while ( chartId = cluster.unrender.pop() ) {
                        if ( !cluster.charts[ chartId ] ) continue;
                        var current = cluster.charts[ chartId ].settings();
                        Array.prototype.push.apply( settings.groups,  current.groups );
                        Array.prototype.push.apply( settings.reduces, current.reduces );
                    }
                    cluster.client.setup( settings, _.bind( cluster.repaint, cluster ) );
                });

                chart.repaint = function( values, reset ) {
                    if ( ignoreRepaint ) return ignoreRepaint = false;
                    if ( options.ignoreWTF ) values = _.reject( values, function( pointer ) {
                        if ( pointer.children ) pointer.children = _.reject( pointer.children, arguments.callee );
                        return pointer.key === serverWTF;
                    });
                    this.values( values, reset );
                };

                chart._remove = chart.remove;

                chart.remove = function() {
                    if ( !cluster.charts[ chartId ] ) return;
                    delete cluster.charts[ chartId ];
                    this._remove();
                    ( cluster.unremove || ( cluster.unremove = [] ) ).push( chartId );
                    _.defer( function() {  // make all charts's destruction in one request
                        var unremoveSize = _.size( cluster.unremove );
                        if ( !unremoveSize ) return;
                        var removeAll = unremoveSize > 1 && _.isEmpty( cluster.charts ), chartId = null;
                        if ( removeAll ) cluster.client.teardown();
                        else while ( chartId = cluster.unremove.pop() ) {
                            cluster.client.teardown( { groups: [ chartId ] }, _.bind( cluster.repaint, cluster ) );
                        }
                    });
                };

                return chart;
            };
        });

        return cluster;
    };

    h8.charts.plugins = [];

    h8.charts.register = function( name, func ) {
        if( !_.isString( name ) || !_.isFunction( func ) ) throw new Error( 'arguments error!' );
        h8.charts.plugins.push( name );
        return h8.charts[ name ] = function( options ) {
            if ( !options ) throw new Error( 'options is needed.' );
            if ( !options.el ) return arguments.callee.call( this, { el: options } );
            var namespace = 'h8-charts h8-' + name;
            var el = $( options.el ).addClass( namespace )[ 0 ];
            var plugin = func.call( el, el );
            _.each( _.omit( options, 'el', 'values' ), function( option, key ) {
                plugin[ key ] && plugin[ key ]( option );
            });
            if ( options.values ) plugin.values( options.values );  // let 'values' invoke in the last
            plugin.remove = _.wrap( plugin.remove, function( func ) {
                $( el ).removeClass( namespace );
                return func.apply( plugin, _.rest( arguments ) );
            });
            return plugin;
        };
    };
}).call( this );

(function() {
    h8.charts.colors = {
        discrete:       [ "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf" ],
        transition:     [ "#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#74c476", "#a1d99b", "#c7e9c0", "#9e9ac8", "#bcbddc", "#dadaeb", "#fd8d3c", "#fdae6b", "#fdd0a2" ],
        pureTransition: [ "#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c" ]
    };
    h8.charts.configs = {
        defaults: {
            duration : 500,
            colors: h8.charts.colors.transition
        },
        pie: {},
        line: {},
        area: {},
        bar: {
            labelReverse:false
        },
        bubble: {
            showLabels: true,
            scale: 'auto',
            colors: h8.charts.colors.discrete
        },
        radar: {},
        heat: {
            showLabels: true,
            colors: h8.charts.colors.pureTransition
        },
        digit: {},
        timeline: {
            defaultStep: 1,
            defaultSpan: 10,
            forceX: 0.02
        }
    };

}).call( this );

(function() {
    h8.charts.utils = {
        fixOverFlow: function( container, svg, chart ) {
            var defaultOverflow = 100,
                newWidth = parseInt( container.style( 'width' ) ) + defaultOverflow * 2;
            svg.style( 'margin-left', -defaultOverflow + 'px' )
                .style( 'width', newWidth + 'px' );
            chart.width( newWidth )
                .margin( { right: defaultOverflow, left: defaultOverflow } );
        },

        transformData: function( inputs ) {
            var outputs     = [],
                mappings    = {},
                probe       = function( d ){ return +d ? +d : d; },
                multiLegend = false;
            _.each( inputs, function( input, index ) {
                if ( _.isObject( input.value ) ) {   // multiple reduce
                    _.each( input.value, function( v , k ) {
                        var list = mappings[ k ] || ( mappings[ k ] = [] );
                        list[ index ] = [ input.key, probe( v ) ];
                    });
                    multiLegend = true;
                } else {  // single reduce
                    if ( _.isEmpty( input.children ) ) {
                        outputs[ index ] = [ input.key, input.value ];
                    } else {
                        _.each( input.children, function( child ) {
                            var list = mappings[ child.key ] || ( mappings[ child.key ] = [] );
                            list[ index ] = [ input.key, probe( child.value ) ];
                        });
                        multiLegend = true;
                    }
                }
            });
            outputs = multiLegend ? _.map( mappings, function( list, key ) {
                var i = inputs.length;
                while( i-- ) list[ i ] || ( list[ i ] = [ inputs[ i ].key, 0 ] );
                return {
                    key: key,
                    values: list
                };
            }) : [{
                key: 'default_legend',
                values: outputs
            }];
            return {
                multiLegend: multiLegend,
                outputs: outputs
            };
        }
    };
}).call( this );

(function() {
    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };

    // get a reference to the d3.selection prototype,
    // and keep a reference to the old d3.selection.on
    var d3_selectionPrototype = d3.selection.prototype,
        d3_on = d3_selectionPrototype.on;

    // rewrite the d3.selection.on function to shim the events with wrapped
    // callbacks
    d3_selectionPrototype.on = function(evt, selector, callback, useCapture) {
        if(typeof selector==="string"){
            callback = wrap.call(null, callback,selector);
            return d3_on.call(this, evt, callback, useCapture);
        }
        useCapture = callback;
        callback = selector;
        return d3_on.call(this, evt, callback, useCapture);
    };

    function wrap(callback,selector) {
        return function() {
            var target = d3.event.srcElement || d3.event.target;
            var i;
            if((i=d3.select(this).selectAll(selector)[0].indexOf(target)) !== -1)
            {
                return callback.call(target,target.__data__,i);
            }
        };
    };
}).call( this );