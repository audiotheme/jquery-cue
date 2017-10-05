(function( window, $, undefined ) {
	'use strict';

	var historySuccess, originalSuccess,
		mePlayerInit = MediaElementPlayer.prototype.init;

	/**
	 * Proxy the MediaElementPlayer init method to proxy the success callback.
	 */
	MediaElementPlayer.prototype.init = function() {
		// Set up if the cuehistory feature is declared.
		if ( -1 !== this.options.features.indexOf( 'cuehistory' ) ) {
			originalSuccess = this.options.success;
			this.options.success = historySuccess;
		}
		mePlayerInit.call( this );
	};

	/**
	 * Proxied MediaElementPlayer success callback.
	 */
	historySuccess = function( media, domObject, player ) {
		var isPlaying, status,
			history = new History( player.options.cueId || '', player.options.cueSignature || '' ),
			autoplay = ( 'autoplay' === media.getAttribute( 'autoplay' ) ),
			mf = mejs.MediaFeatures || mejs.Features;

		if ( history && undefined !== history.get( 'volume' ) ) {
			media.setVolume( history.get( 'volume' ) );
		}

		if ( history && undefined !== history.get( 'trackIndex' ) ) {
			// Don't start playing if on a mobile device or if autoplay is active.
			status = history ? history.get( 'status' ) : '';
			isPlaying = ( 'playing' === status && ! mf.isiOS && ! mf.isAndroid && ! autoplay );

			// Set a global flag to let other methods know if the track has been
			// auto-resumed.
			player.cueAutoResume = isPlaying;

			if ( 'cuePlaylistTracks' in player.options && player.options.cuePlaylistTracks.length ) {
				player.cueSetCurrentTrack( history.get( 'trackIndex' ), isPlaying );
			} else if ( isPlaying ) {
				player.cuePlay();
			}
		}

		originalSuccess.call( this, media, domObject, player );
	};

	$.extend( mejs.MepDefaults, {
		cueId: 'cue',
		cueSignature: ''
	});

	$.extend( MediaElementPlayer.prototype, {
		cueHistory: null,
		cueAutoResume: false,

		buildcuehistory: function( player, controls, layers, media ) {
			var currentTime, history,
				isLoaded = false,
				mf = mejs.MediaFeatures || mejs.Features,
				isSafari = /Safari/.test( navigator.userAgent ) && /Apple Computer/.test( navigator.vendor );

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

			media.addEventListener( 'volumechange', function() {
				history.set( 'volume', media.volume );
			});

			// Only set the current time on initial load.
			media.addEventListener( 'playing', function() {
				if ( isLoaded || currentTime < 1 ) {
					return;
				}

				if ( mf.isiOS || isSafari ) {
					// Tested on the following devices (may need to update for other devices):
					// - iOS 7 on iPad
					// - Safari 9 on OSX

					// The currentTime can't be set in iOS until the desired time
					// has been buffered. Poll the buffered end time until it's
					// possible to set currentTime. This fix should work in any
					// browser, but is not ideal because the audio may begin
					// playing from the beginning before skipping ahead.
					var intervalId = setInterval(function() {
						if ( currentTime < media.buffered.end( 0 ) ) {
							clearInterval( intervalId );
							player.setCurrentTime( currentTime );
							player.setCurrentRail();
						}
					}, 50 );
				} else {
					try {
						player.setCurrentTime( currentTime );
						player.setCurrentRail();
					} catch ( exp ) { }
				}

				isLoaded = true;
			});
		}

	});

	function storageAvailable( type ) {
		try {
			var storage = window[ type ],
				x = '__storage_test__';
			storage.setItem( x, x );
			storage.removeItem( x );
			return true;
		}
		catch( e ) {
			return false;
		}
	}

	function History( id, signature ) {
		var data = storageAvailable( 'sessionStorage' ) ? sessionStorage : {},
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
				} else if ( 'volume' === key ) {
					value = parseFloat( value );
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
