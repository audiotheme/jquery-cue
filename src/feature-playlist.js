(function( window, $, undefined ) {
	'use strict';

	var current, playTimeoutId;

	$.extend( mejs.MepDefaults, {
		cuePlaylistLoop: false,
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
		$cueTracks: $(),
		cueCurrentTrack: 0,

		/**
		 * Set up a playlist and attach events for interacting with tracks.
		 * @todo This will be refactored at some point.
		 */
		buildcueplaylist: function( player, controls, layers, media ) {
			var selectors = player.options.cueSelectors,
				$media = player.$media,
				$playlist = player.container.closest( selectors.playlist );

			player.cueSetupTracklist();

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
					index = player.$cueTracks.index( $track ),
					$target = $( e.target ),
					$forbidden = $track.find( 'a, .js-disable-playpause, ' + selectors.trackProgressBar );

				// Don't toggle play status when links or elements with a 'js-disable-play' class are clicked.
				if ( ! $target.is( $forbidden ) && ! $forbidden.find( $target ).length ) {
					// Update the reference to the current track and player.
					current.setPlayer( player ).setTrack( $track );

					if ( player.cueCurrentTrack === index && '' !== player.options.cuePlaylistTracks[ index ].src ) {
						// Toggle play/pause state.
						if ( media.paused) {
							media.play();
						} else {
							media.pause();
						}
					} else {
						player.cueSetCurrentTrack( index );
					}
				}
			});

			// Toggle the 'is-playing' class and set the current track elements.
			$media.on( 'play.cue', function() {
				var $track = player.$cueTracks.removeClass( 'is-playing' ).eq( player.cueCurrentTrack ).addClass( 'is-playing' );

				// Update the reference to the current track and player.
				current.setPlayer( player ).setTrack( $track );
			});

			$media.on( 'pause.cue', function() {
				player.$cueTracks.removeClass( 'is-playing' );
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

				// Give other 'end' events a chance to grab the current track.
				setTimeout(function() {
					player.$node.trigger( 'nextTrack.cue', player );
					player.cuePlayNextTrack();
				}, 250 );
			});
		},

		/**
		 * Play the current track.
		 *
		 * Some browsers and plugins don't like it when play() is called
		 * immediately after a file has been loaded (history autoplay back,
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

		cueGetCurrentTrack: function() {
			return this.options.cuePlaylistTracks[ this.cueCurrentTrack ];
		},

		cueSetCurrentTrack: function( track, play ) {
			var player = this,
				selectors = player.options.cueSelectors;

			if ( 'number' === typeof track ) {
				player.cueCurrentTrack = track;
				track = player.cueGetCurrentTrack();
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
		},

		cueSetupTracklist: function() {
			var player = this,
				selectors = player.options.cueSelectors,
				$playlist = player.container.closest( selectors.playlist );

			player.$cueTracks = $playlist.find( selectors.track );

			// Add an 'is-playable' class to tracks with an audio src file.
			player.$cueTracks.filter( function( i ) {
				var track = player.options.cuePlaylistTracks[ i ] || {};
				return 'src' in track && '' !== track.src;
			}).addClass( 'is-playable' );
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
