/*!
 * jquery.cue.js - 1.1.2
 * Playlist and other functionality for MediaElement.js
 * http://audiotheme.com/
 *
 * Copyright 2014, AudioTheme LLC
 * License: MIT
 */
window.cue = window.cue || {};

(function( window, $, undefined )  {
	'use strict';

	var $window = $( window ),
		cue = window.cue;

	cue.l10n = $.extend({
		nextTrack: 'Next Track',
		previousTrack: 'Previous Track',
		togglePlaylist: 'Toggle Playlist'
	}, cue.l10n || {});

	cue.settings = cue.settings || {};

	// Add mime-type aliases to MediaElement plugin support.
	mejs.plugins.silverlight[ 0 ].types.push( 'audio/x-ms-wma' );

	// Detection for browser SVG capability.
	$( 'html' ).addClass(function() {
		return document.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#Image', '1.1' ) ? 'svg' : 'no-svg';
	});

	$.extend( mejs.MepDefaults, {
		cueResponsiveProgress: false, // Set the progress bar to 100% on window resize.
		cueSelectors: {
			container: '.cue-playlist-container'
		},
		cueSkin: ''
	});

	/**
	 * jQuery plugin to initialize playlists.
	 *
	 * @class cuePlaylist
	 * @memberOf jQuery.fn
	 *
	 * @param {Object} options Custom settings overrides.
	 *
	 * @return {jQuery} Chainable jQuery collection.
	 */
	$.fn.cuePlaylist = function( options ) {
		var settings = $.extend( $.fn.cuePlaylist.defaults, options );

		// Add selector settings.
		settings.cueSelectors = $.extend({}, mejs.MepDefaults.cueSelectors, {
			playlist: this.selector,
			track: '.cue-track'
		});

		// Merge custom selector options into the defaults.
		if ( 'object' === typeof options && 'cueSelectors' in options ) {
			$.extend( settings.cueSelectors, options.cueSelectors );
		}

		return this.each(function() {
			var $playlist = $( this ),
				$media = $playlist.find( '.cue-audio, audio' ).first(),
				$data = $playlist.find( '.cue-playlist-data, script' ),
				data, i, trackCount;

			if ( ! $data.length ) {
				$data = $playlist.closest( settings.cueSelectors.container ).find( '.cue-playlist-data, script' );
			}

			if ( $data.length ) {
				data = $.parseJSON( $data.first().html() );

				// Add the signature.
				if ( 'cueSignature' in data ) {
					settings.cueSignature = data.cueSignature;
				}

				// Add the tracks.
				if ( ( 'undefined' === typeof options || 'undefined' === typeof options.cuePlaylistTracks ) && 'tracks' in data ) {
					settings.cuePlaylistTracks = data.tracks;
				}
			}

			if ( settings.cuePlaylistTracks.length ) {
				trackCount = settings.cuePlaylistTracks.length;
				$playlist.addClass( 'cue-tracks-count-' + trackCount );

				// Create an <audio> element if one couldn't be found.
				if ( ! $media.length ) {
					for ( i = 0; i < trackCount; i++ ) {
						if ( '' === settings.cuePlaylistTracks[ i ].src ) {
							continue;
						}

						$media = $( '<audio />', {
							src: settings.cuePlaylistTracks[ i ].src
						}).prependTo( $playlist );
						break;
					}
				}

				// Initialize MediaElement.js.
				$media.mediaelementplayer( settings );
			}
		});
	};

	$.fn.cuePlaylist.defaults = {
		autosizeProgress: false,
		cuePlaylistLoop: true,
		cuePlaylistTracks: [],
		cueSkin: 'cue-skin-default',
		defaultAudioHeight: 0,
		enableAutosize: false,
		features: [
			'cueartwork',
			'cuecurrentdetails',
			'cueprevioustrack',
			'playpause',
			'cuenexttrack',
			'progress',
			'current',
			'duration',
			'cueplaylist'
		],
		success: function( media, domObject, player ) {
			var $media = $( media ),
				$container = player.container.closest( player.options.cueSelectors.playlist );

			if ( '' !== player.options.cueSkin ) {
				player.changeSkin( player.options.cueSkin );
			}

			// Make the time rail responsive.
			if ( player.options.cueResponsiveProgress ) {
				$window.on( 'resize.cue', function() {
					player.controls.find( '.mejs-time-rail' ).width( '100%' );
					//t.setControlsSize();
				}).trigger( 'resize.cue' );
			}

			$media.on( 'play.cue', function() {
				$container.addClass( 'is-playing' );
			}).on( 'pause.cue', function() {
				$container.removeClass( 'is-playing' );
			});

			$( player.options.cueSelectors.playlist ).removeClass( 'is-loading' );

			$container.trigger( 'success.cue', [ media, domObject, player ]);
		},
		timeAndDurationSeparator: '<span class="mejs-time-separator"> / </span>'
	};

})( this, jQuery );

(function( window, $, undefined ) {
	'use strict';

	$.extend( MediaElementPlayer.prototype, {

		buildcueartwork: function( player, controls, layers ) {
			var $artwork = layers.append( '<span class="mejs-track-artwork"><img src=""></span>' ).find( '.mejs-track-artwork' );

			player.$node.on( 'setTrack.cue', function( e, track, player ) {
				var hasArtwork;

				track.thumb = track.thumb || {};
				hasArtwork = 'undefined' !== typeof track.thumb.src && '' !== track.thumb.src;

				// Set the artwork src and toggle depending on if the URL is empty.
				$artwork.find( 'img' ).attr( 'src', track.thumb.src ).toggle( hasArtwork );
				$artwork.closest( player.options.cueSelectors.playlist ).toggleClass( 'has-artwork', hasArtwork );
			});
		}

	});

})( this, jQuery );

(function( window, $, undefined ) {
	'use strict';

	$.extend( MediaElementPlayer.prototype, {

		buildcuecurrentdetails: function( player, controls, layers ) {
			var $artist, $title;

			layers.append( '<div class="mejs-track-details"><span class="mejs-track-artist"></span><span class="mejs-track-title"></span></div>' );
			$artist = layers.find( '.mejs-track-artist' );
			$title = layers.find( '.mejs-track-title' );

			player.$node.on( 'setTrack.cue', function( e, track, player ) {
				track.meta = track.meta || {};
				track.title = track.title || {};

				$artist.html( track.meta.artist );
				$title.html( track.title );
			});
		}

	});

})( this, jQuery );

(function( window, $, undefined ) {
	'use strict';

	var historySuccess, originalSuccess,
		mePlayerInit = mejs.MediaElementPlayer.prototype.init;

	/**
	 * Proxy the MediaElementPlayer init method to proxy the success callback.
	 */
	mejs.MediaElementPlayer.prototype.init = function() {
		// Set up if the cuehistory feature is declared.
		if ( -1 !== $.inArray( 'cuehistory', this.options.features ) ) {
			originalSuccess = this.options.success;
			this.options.success = historySuccess;
		}
		mePlayerInit.call( this );
	};

	/**
	 * Proxied MediaElementPlayer success callback.
	 */
	historySuccess = function( media, domObject, player ) {
		var isPlaying, status, volume,
			history = new History( player.options.cueId || '', player.options.cueSignature || '' ),
			autoplay = ( 'autoplay' === media.getAttribute( 'autoplay' ) ),
			mf = mejs.MediaFeatures;

		if ( history && undefined !== history.get( 'volume' ) ) {
			media.setVolume( history.get( 'volume' ) );
		}

		if ( history && undefined !== history.get( 'trackIndex' ) ) {
			// Don't start playing if on a mobile device or if autoplay is active.
			status = history ? history.get( 'status' ) : '';
			isPlaying = ( 'playing' === status && ! mf.isiOS && ! mf.isAndroid && ! autoplay );

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

		buildcuehistory: function( player, controls, layers, media ) {
			var currentTime, history,
				$container = player.container.closest( player.options.cueSelectors.playlist ),
				isLoaded = false,
				mf = mejs.MediaFeatures;

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

				if ( mf.isiOS ) {
					// Tested on iOS 7 on an iPad, may need to update for other devices.

					// The currentTime can't be set in iOS until the desired time
					// has been buffered. Poll the buffered end time until it's
					// possible to set currentTime. The audio may begin playing from
					// the beginning before skipping ahead.
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

(function( window, $, cue, undefined ) {
	'use strict';

	// Add this feature after all controls have been built.
	$.extend( MediaElementPlayer.prototype, {
		buildcueicons: function( player, controls ) {
			var $icons = $( player.options.cueSelectors.container ).find( '[data-cue-control]' );

			$icons.each(function() {
				var $icon = $( this );
				$icon.appendTo( controls.find( $icon.data( 'cueControl' ) ) );
			});
		}
	});

})( this, jQuery, window.cue );

(function( window, $, cue, undefined ) {
	'use strict';

	$.extend( MediaElementPlayer.prototype, {
		buildcuenexttrack: function( player, controls ) {
			$( '<div class="mejs-button mejs-next-button mejs-next">' +
					'<button type="button" aria-controls="' + player.id + '" title="' + cue.l10n.nextTrack + '"></button>' +
					'</div>' )
				.appendTo( controls )
				.on( 'click.cue', function() {
					player.cuePlayNextTrack();
				});
		},

		// @todo Go to next playable track.
		cuePlayNextTrack: function() {
			var player = this,
				index = player.cueCurrentTrack + 1 >= player.options.cuePlaylistTracks.length ? 0 : player.cueCurrentTrack + 1;

			player.$node.trigger( 'nextTrack.cue', player );
			player.cueSetCurrentTrack( index );
		}
	});

})( this, jQuery, window.cue );

(function( window, $, undefined ) {
	'use strict';

	var current, playTimeoutId;

	$.extend( mejs.MepDefaults, {
		cuePlaylistLoop: true,
		cuePlaylistTracks: []
	});

	$.extend( mejs.MepDefaults.cueSelectors, {
		playlist: '.cue-playlist',
		track: '.cue-track',
		trackCurrentTime: '.cue-track-current-time',
		trackDuration: '.cue-track-duration',
		trackPlayBar: '.cue-track-play-bar',
		trackProgressBar: '.cue-track-progress-bar',
		trackSeekBar: '.cue-track-seek-bar',
		tracklist: '.cue-tracklist'
	});

	$.extend( MediaElementPlayer.prototype, {
		cueCurrentTrack: 0,

		/**
		 * Set up a playlist and attach events for interacting with tracks.
		 * @todo This will be refactored at some point.
		 */
		buildcueplaylist: function( player, controls, layers, media ) {
			var selectors = player.options.cueSelectors,
				$media = $( media ),
				$playlist = player.container.closest( selectors.playlist ),
				$tracks = $playlist.find( selectors.track );

			// Add an 'is-playable' class to tracks with an audio src file.
			$tracks.filter( function( i ) {
				var track = player.options.cuePlaylistTracks[ i ] || {};
				return 'src' in track && '' !== track.src;
			}).addClass( 'is-playable' );

			// Set the current track when initialized.
			player.cueSetCurrentTrack( player.options.cuePlaylistTracks[ 0 ], false );

			// Seek when though is sought...
			$playlist.on( 'click.cue', selectors.trackSeekBar, function( e ) {
				var $bar = $( this ),
					duration = player.options.duration > 0 ? player.options.duration : player.media.duration,
					pos = e.pageX - $bar.offset().left,
					width = $bar.outerWidth(),
					percentage = pos / width;

				percentage = percentage < 0.2 ? 0 : percentage;
				media.setCurrentTime( percentage * duration );
			});

			// Play a track when it's clicked in the track list.
			$playlist.on( 'click.cue', selectors.track, function( e ) {
				var $track = $( this ),
					index = $tracks.index( $track ),
					$target = $( e.target ),
					$forbidden = $track.find( 'a, .js-disable-playpause, ' + selectors.trackProgressBar );

				// Don't play when links or elements with a 'js-disable-play' class are clicked.
				if ( ! $target.is( $forbidden ) && ! $forbidden.find( $target ).length ) {
					// Update the reference to the current track and player.
					current.setPlayer( player ).setTrack( $track );

					if ( player.cueCurrentTrack === index && '' !== player.options.cuePlaylistTracks[ index ].src ) {
						// Toggle play/pause state.
						media.paused ? media.play() : media.pause();
					} else {
						player.cueSetCurrentTrack( index );
					}
				}
			});

			// Toggle the 'is-playing' class and set the current track elements.
			$media.on( 'play.cue', function() {
				var $track = $tracks.removeClass( 'is-playing' ).eq( player.cueCurrentTrack ).addClass( 'is-playing' );

				// Update the reference to the current track and player.
				current.setPlayer( player ).setTrack( $track );
			});

			$media.on( 'pause.cue', function() {
				$tracks.removeClass( 'is-playing' );
			});

			// Update the current track's duration and current time.
			$media.on( 'timeupdate.cue', function() {
				current.updateTimeCodes();
			});

			// Play the next track when one ends.
			$media.on( 'ended.cue', function() {
				var index = player.cueCurrentTrack + 1 >= player.options.cuePlaylistTracks.length ? 0 : player.cueCurrentTrack + 1;

				// Determine if the playlist shouldn't loop.
				if ( ! player.options.cuePlaylistLoop && 0 === index ) {
					return;
				}

				player.$node.trigger( 'nextTrack.cue', player );
				player.cuePlayNextTrack();
			});
		},

		/**
		 * Play the current track.
		 *
		 * Some browsers and plugins don't like it when play() is called
		 * immediately after a file has been loaded (history autoplayback,
		 * ended event, etc).
		 *
		 * Cycling through tracks quickly can also cause multiple sources to
		 * begin playing without a way to control them, so clearing the timeout
		 * helps prevent that.
		 */
		cuePlay: function() {
			var player = this;

			if ( ! player.media.paused && 'flash' !== player.media.pluginType ) {
				return;
			}

			clearTimeout( playTimeoutId );

			playTimeoutId = setTimeout(function() {
				player.play();
			}, 50 );
		},

		cueSetCurrentTrack: function( track, play ) {
			var player = this,
				selectors = player.options.cueSelectors;

			if ( 'number' === typeof track ) {
				player.cueCurrentTrack = track;
				track = player.options.cuePlaylistTracks[ player.cueCurrentTrack ];
			}

			player.container.closest( selectors.playlist )
				.find( selectors.track ).removeClass( 'is-current' )
				.eq( player.cueCurrentTrack ).addClass( 'is-current' );

			if ( track.length ) {
				player.controls.find( '.mejs-duration' ).text( track.length );
			}

			if ( track.src && track.src !== player.media.src ) {
				player.pause();
				player.setSrc( track.src );
				player.load();
			}

			player.$node.trigger( 'setTrack.cue', [ track, player ]);

			if ( track.src && ( 'undefined' === typeof play || play ) ) {
				player.cuePlay();
			}
		}
	});

	/**
	 * Cached reference to the current player and track.
	 */
	current = {
		player: null,
		$track: $(),
		$duration: $(),
		$playBar: $(),
		$time: $(),

		setPlayer: function( player ) {
			this.player = player;
			return this;
		},

		setTrack: function( $track ) {
			var selectors = this.player.options.cueSelectors;

			this.$track = ( $track instanceof jQuery ) ? $track : $( $track );
			this.$duration = this.$track.find( selectors.trackDuration );
			this.$playBar = this.$track.find( selectors.trackPlayBar );
			this.$time = this.$track.find( selectors.trackCurrentTime );

			return this;
		},

		updateTimeCodes: function() {
			var player = this.player,
				duration, durationTimeCode, currentTimeCode;

			if ( null === player ) {
				return;
			}

			duration = player.options.duration > 0 ? player.options.duration : player.media.duration;
			if ( ! isNaN( duration ) ) {
				durationTimeCode = mejs.Utility.secondsToTimeCode( duration, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond || 25 );
				currentTimeCode = mejs.Utility.secondsToTimeCode( player.media.currentTime, player.options.alwaysShowHours || player.media.duration > 3600, player.options.showTimecodeFrameCount, player.options.framesPerSecond || 25 );

				this.$duration.text( durationTimeCode );
				this.$playBar.width( player.media.currentTime / duration * 100 + '%' );
				this.$time.text( currentTimeCode );
			}

			return this;
		}
	};

})( this, jQuery );

(function( window, $, cue, undefined ) {
	'use strict';

	$.extend( mejs.MepDefaults, {
		cuePlaylistToggle: function( $tracklist, player ) {
			$tracklist.slideToggle( 200 );
		}
	});

	$.extend( MediaElementPlayer.prototype, {
		buildcueplaylisttoggle: function( player, controls, layers, media ) {
			var selectors = player.options.cueSelectors,
				$playlist = player.container.closest( selectors.playlist ),
				$tracklist = $playlist.find( selectors.tracklist ),
				isTracklistVisible = $tracklist.is( ':visible' );

			$playlist.addClass(function() {
				return isTracklistVisible ? 'is-tracklist-open' : 'is-tracklist-closed';
			});

			$( '<div class="mejs-button mejs-toggle-playlist-button mejs-toggle-playlist">' +
				'<button type="button" aria-controls="' + player.id + '" title="' + cue.l10n.togglePlaylist + '"></button>' +
				'</div>' )
			.appendTo( player.controls )
			.on( 'click', function() {
				var $button = $( this ),
					isTracklistVisible = $tracklist.is( ':visible' );

				$button.toggleClass( 'is-open', ! isTracklistVisible ).toggleClass( 'is-closed', isTracklistVisible );
				$playlist.toggleClass( 'is-tracklist-open', ! isTracklistVisible ).toggleClass( 'is-tracklist-closed', isTracklistVisible );

				if ( $.isFunction( player.options.cuePlaylistToggle ) ) {
					player.options.cuePlaylistToggle( $tracklist, player );
				}
			})
			.addClass(function() {
				return isTracklistVisible ? 'is-open' : 'is-closed';
			});
		}
	});

})( this, jQuery, window.cue );

(function( window, $, cue, undefined ) {
	'use strict';

	$.extend( MediaElementPlayer.prototype, {
		buildcueprevioustrack: function( player, controls ) {
			$( '<div class="mejs-button mejs-previous-button mejs-previous">' +
					'<button type="button" aria-controls="' + player.id + '" title="' + cue.l10n.previousTrack + '"></button>' +
					'</div>' )
				.appendTo( controls )
				.on( 'click.cue', function() {
					player.cuePlayPreviousTrack();
				});
		},

		// @todo Go to previous playable track.
		cuePlayPreviousTrack: function() {
			var player = this,
				index = player.cueCurrentTrack - 1 < 0 ? player.options.cuePlaylistTracks.length - 1 : player.cueCurrentTrack - 1;

			player.$node.trigger( 'previousTrack.cue', player );
			player.cueSetCurrentTrack( index );
		}
	});

})( this, jQuery, window.cue );
