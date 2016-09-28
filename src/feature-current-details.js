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
				track.title = track.title || '';

				$artist.html( track.meta.artist );
				$title.html( track.title );
			});
		}
	});

})( this, jQuery );
