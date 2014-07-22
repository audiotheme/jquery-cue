(function( window, $, undefined ) {
	'use strict';

	$.extend( MediaElementPlayer.prototype, {

		buildcueartwork: function( player, controls, layers ) {
			var $artwork = layers.append( '<span class="mejs-track-artwork"><img src=""></span>' ).find( '.mejs-track-artwork' );

			player.$node.on( 'setTrack.cue', function( e, track, player ) {
				track.thumb = track.thumb || {};

				// Set the artwork src and toggle depending on if the URL is empty.
				$artwork.find( 'img' ).attr( 'src', track.thumb.src ).toggle( 'undefined' !== typeof track.thumb.src && '' !== track.thumb.src );
			});
		}

	});

})( this, jQuery );
