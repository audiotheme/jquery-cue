(function( window, $, undefined ) {
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

})( this, jQuery );
