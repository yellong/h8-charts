( function( root ) {
    var $ = root.$ || root.jQuery;

    root.h8.charts.register('count',function( el ) {
        var $container = $( el ),
            onReset = null;

        $container.find( '.reset' ).on( 'click', function() {
            onReset && onReset();
        });

        return {
            values: function( values ) {
                $container.find( '.selected' ).text( values.selected );
                $container.find( '.total' ).text( values.total );
                return this;
            },
            onReset: function( _onReset ) {
                onReset = _onReset;
                return this;
            },
            remove: function() {
                $container.find( 'span' ).remove();
                return this;
            }
        };
    });

})(this);
