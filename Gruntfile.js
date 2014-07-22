/*jshint node:true */

module.exports = function( grunt ) {
	'use strict';

	require( 'matchdep' ).filterDev( 'grunt-*' ).forEach( grunt.loadNpmTasks );

	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),

		clean: {
			dist: ['./dist']
		},

		concat: {
			options: {
				banner: grunt.file.read( 'src/header.js' )
			},
			dist: {
				files: [
					{
						src: [
							'src/cue.js',
							'src/feature-artwork.js',
							'src/feature-current-details.js',
							'src/feature-next-track.js',
							'src/feature-playlist.js',
							'src/feature-playlist-toggle.js',
							'src/feature-previous-track.js'
						],
						dest: 'dist/jquery.cue.js'
					}
				]
			}
		},

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: [
				'Gruntfile.js',
				'src/*.js'
			]
		},

		uglify: {
			dist: {
				options: {
					banner: grunt.file.read( 'src/header.js' )
				},
				src: ['dist/jquery.cue.js'],
				dest: 'dist/jquery.cue.min.js'
			}
		},

		watch: {
			js: {
				files: ['<%= jshint.all %>'],
				tasks: ['jshint', 'build']
			},
		}

	});

	grunt.registerTask('default', ['jshint', 'clean', 'concat', 'uglify']);

};
