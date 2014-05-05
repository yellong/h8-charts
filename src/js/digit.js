( function( root ) {

    var $     = root.$ || root.jquery,
        _     = root._ ,
        utils = root.h8.charts.utils;

    root.h8.charts.register('digit',function( el ) {

        var $container = $( el ),
            duration = 500,
            valueFormats = null,
            defaultValueFormat = d3.format( ',.0f' );

        var animate = function( $el, value, valueFormat ) {
            var $data = $el.data(), step = 10, rate = duration / step;
            $data.nextValue == null && ( $data.nextValue = 0 );
            var delta = ( value - $data.nextValue ) / ( step - 1 );
            clearTimeout( $data.handler );
            $data.handler = setTimeout( function() {
                $el.text( valueFormat( $data.nextValue ) );
                if ( --step ) {
                    $data.nextValue = $data.nextValue + delta;
                    if ( $data.nextValue < 0.001 && $data.nextValue > -0.001 ) $data.nextValue = 0;
                    $data.handler = setTimeout( arguments.callee, rate );
                }
            }, 0 );
        };

        $container.css( 'font-size', $container.height() );

        return {
            resize: function( width, height ) {
                $container.css( 'font-size', height );
                return this;
            },
            formats: function( formats ) {
                valueFormats = formats.value;
                return this;
            },
            values: function( values ) {
                var value = _.isArray( values ) ? values[ 0 ].value : _.pick( values, 'selected', 'total' );
                if ( _.isObject( value ) ) {
                    _.each( value, function( value, key ) {
                        animate( $container.find( '.' + key ), value, valueFormats && valueFormats[ key ] || defaultValueFormat );
                    });
                } else {
                    animate( $container.find( '.number' ), value, valueFormats || defaultValueFormat );
                }
                return this;
            },
            duration: function( _duration ) {
                duration = _duration;
                return this;
            },
            remove: function() {
                $container.css( 'font-size', '' );
                $container.find( '.number, .description' ).remove();
                return this;
            }
        };
    });

})(this);
