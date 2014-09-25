(function( window, $, undefined ) {
	'use strict';

	var cueSuccess  = $.fn.cuePlaylist.defaults;

	$.extend( mejs.MepDefaults, {
		cueId: 'cue',
		cueSignature: ''
	});

	$.extend( MediaElementPlayer.prototype, {
		cueHistory: null,

		buildcuehistory: function( player, controls, layers, media ) {
			var isLoaded = false,
				$container = player.container.closest( player.options.cueSelectors.playlist ),
				currentTime, history;

			history = player.cueHistory = new History( player.options.cueId, player.options.cueSignature );
			currentTime = history.get( 'currentTime' );

			media.addEventListener( 'play', function() {
				history.set( 'trackIndex', player.cueCurrentTrack );
				history.set( 'status', 'playing' );
			});

			media.addEventListener( 'pause', function() {
				history.set( 'status', 'paused' );
			});

			media.addEventListener( 'timeupdate', function() {
				history.set( 'currentTime', media.currentTime );
			});

			// @todo Account for autoplay.
			$container.on( 'success.cue', function( e, media, domObject, player ) {
				var status;

				if ( history && undefined !== history.get( 'trackIndex' ) ) {
					status = history ? history.get( 'status' ) : '';
					player.cueSetCurrentTrack(
						history.get( 'trackIndex' ),
						( 'playing' === status ),
						currentTime || 0
					);
				}
			});
		},

	});

	function History( id, signature ) {
		var data = sessionStorage || {},
			signatureProp = id + '-signature';

		this.set = function( key, value ) {
			var prop = id + '-' + key;
			data[ prop ] = value;
		};

		this.get = function( key ) {
			var value,
				prop = id + '-' + key;

			if ( 'undefined' !== typeof data[ prop ] ) {
				value = data[ prop ];

				if ( 'currentTime' === key ) {
					value = parseFloat( value );
				} else if ( 'status' === key ) {
					value = ( 'playing' === value ) ? 'playing' : 'paused';
				} else if ( 'trackIndex' === key ) {
					value = parseInt( value, 10 );
				}
			}

			return value;
		};

		this.clear = function() {
			var prop;

			for ( prop in data ) {
				if ( data.hasOwnProperty( prop ) && 0 === prop.indexOf( id + '-' ) ) {
					delete data[ prop ];
				}
			}
		};

		// Clear the history if the signature changed.
		if ( 'undefined' === typeof data[ signatureProp ] || data[ signatureProp ] !== signature ) {
			this.clear();
		}

		data[ signatureProp ] = signature;
	}

})( this, jQuery );
