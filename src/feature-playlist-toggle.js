(function( window, $, cue, undefined ) {
	'use strict';

	$.extend( MediaElementPlayer.prototype, {
		buildcueplaylisttoggle: function( player, controls, layers, media ) {
			var selectors = player.options.cueSelectors;

			$( '<div class="mejs-button mejs-toggle-playlist-button mejs-toggle-playlist">' +
				'<button type="button" aria-controls="' + player.id + '" title="' + cue.l10n.togglePlaylist + '"></button>' +
				'</div>' )
			.appendTo( player.controls )
			.on( 'click', function() {
				$( this ).closest( selectors.playlist ).find( selectors.tracklist ).slideToggle( 200 );
			});
		}
	});

})( this, jQuery, window.cue );
