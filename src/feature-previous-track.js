(function( window, $, cue, undefined ) {
	'use strict';

	$.extend( MediaElementPlayer.prototype, {
		buildcueprevioustrack: function( player, controls ) {
			$( '<div class="mejs-button mejs-previous-button mejs-previous">' +
					'<button type="button" aria-controls="' + player.id + '" title="' + cue.l10n.previousTrack + '"></button>' +
					'</div>' )
				.appendTo( controls )
				.on( 'click.cue', function() {
					var state,
						track = player.cueGetCurrentTrack() || {};

					state = $.extend({}, {
						currentTime: media.currentTime,
						duration: media.duration,
						src: media.src
					});

					player.$node.trigger( 'skipBack.cue', [ state, track ] );
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
