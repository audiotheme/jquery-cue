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
		var settings = $.extend({}, $.fn.cuePlaylist.defaults, options );

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
				if ( 'signature' in data ) {
					settings.cueSignature = data.signature;
				}

				// Add the signature (back-compat).
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
		autoRewind: false,
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

			// Hide the duration and time separator if the duration isn't available.
			$media.on( 'loadedmetadata', function( e ) {
				if ( isNaN( e.target.duration ) || ! isFinite( e.target.duration ) ) {
					player.container.find( '.mejs-time-separator, .mejs-duration' ).hide();
				}
			} );

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
