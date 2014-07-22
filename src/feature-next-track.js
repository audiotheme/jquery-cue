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

			// Determine if the playlist shouldn't loop.
			if ( ! player.options.cuePlaylistLoop && 0 === index ) {
				return;
			}

			player.$node.trigger( 'nextTrack.cue', player );
			player.cueSetCurrentTrack( index );
		}
	});

})( this, jQuery, window.cue );
