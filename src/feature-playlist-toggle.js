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
				$playlist = $( player.container ).closest( selectors.playlist ),
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
