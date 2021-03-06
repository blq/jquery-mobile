//>>excludeStart("jqmBuildExclude", pragmas.jqmBuildExclude);
//>>description: Behavior for "fixed" headers and footers
//>>label: Fixedtoolbar

define( [ "jquery", "./jquery.mobile.widget", "./jquery.mobile.core", "./jquery.mobile.navigation", "./jquery.mobile.page", "./jquery.mobile.page.sections", "./jquery.mobile.zoom" ], function( $ ) {
//>>excludeEnd("jqmBuildExclude");
(function( $, undefined ) {


	$.widget( "mobile.fixedtoolbar", $.mobile.widget, {
		options: {
			visibleOnPageShow: true,
			disablePageZoom: true,
			transition: "slide", //can be none, fade, slide (slide maps to slideup or slidedown)
			fullscreen: false,
			tapToggle: true,
			updatePagePadding: true,
			
			// Browser detection! Weeee, here we go...
			// Unfortunately, position:fixed is costly, not to mention probably impossible, to feature-detect accurately.
			// Some tests exist, but they currently return false results in critical devices and browsers, which could lead to a broken experience.
			// Testing fixed positioning is also pretty obtrusive to page load, requiring injected elements and scrolling the window
			// The following function serves to rule out some popular browsers with known fixed-positioning issues
			// This is a plugin option like any other, so feel free to improve or overwrite it
			supportBlacklist: function(){
				var ua = navigator.userAgent,
					platform = navigator.platform,
					// Rendering engine is Webkit, and capture major version
					wkmatch = ua.match( /AppleWebKit\/([0-9]+)/ ),
					wkversion = !!wkmatch && wkmatch[ 1 ],
					ffmatch = ua.match( /Fennec\/([0-9]+)/ ),
					ffversion = !!ffmatch && ffmatch[ 1 ],
					operammobilematch = ua.match( /Opera Mobile\/([0-9]+)/ ),
					omversion = !!operammobilematch && operammobilematch[ 1 ],
					
					w = window;

				if(
					// iOS 4.3 and older : Platform is iPhone/Pad/Touch and Webkit version is less than 534 (ios5)
					( ( platform.indexOf( "iPhone" ) > -1 || platform.indexOf( "iPad" ) > -1  || platform.indexOf( "iPod" ) > -1 ) && wkversion && wkversion < 534 )
					||
					// Opera Mini
					( w.operamini && ({}).toString.call( w.operamini ) === "[object OperaMini]" )
					||
					( operammobilematch && omversion < 7458 )
					||
					//Android lte 2.1: Platform is Android and Webkit version is less than 533 (Android 2.2)
					( ua.indexOf( "Android" ) > -1 && wkversion && wkversion < 533 )
					||
					// Firefox Mobile before 6.0 - 
					( ffversion && ffversion < 6 )
					||
					// WebOS less than 3
					( "palmGetResource" in window && wkversion && wkversion < 534 )
				){
					return true;
				}
				
				return false;
			},
			initSelector: ":jqmData(position='fixed')"
		},
		
		_create: function() {
			
			var self = this,
				o = self.options,
				$el = self.element,
				tbtype = $el.is( ".ui-header" ) ? "header" : "footer",
				$page = $el.closest(".ui-page");
			
			// Feature detecting support for 
			if( o.supportBlacklist() ){
				self.destroy();
				return;
			}
			
			$el.addClass( "ui-"+ tbtype +"-fixed" );
			
			// "fullscreen" overlay positioning
			if( $el.jqmData( "fullscreen" ) ){
				$el.addClass( "ui-"+ tbtype +"-fullscreen" );
				$page.addClass( "ui-page-" + tbtype + "-fullscreen" );
			}
			// If not fullscreen, add class to page to set top or bottom padding
			else{
				$page.addClass( "ui-page-" + tbtype + "-fixed" );
			}
			
			self._addTransitionClass();
			self._bindPageEvents();
			self._bindToggleHandlers();
		},
		
		_addTransitionClass: function(){
			var tclass = this.options.transition;
				
			if( tclass && tclass !== "none" ){
				// use appropriate slide for header or footer
				if( tclass === "slide" ){
					tclass = this.element.is( ".ui-header" ) ? "slidedown" : "slideup";
				}
				
				this.element.addClass( tclass );
			}
		},
		
		_bindPageEvents: function(){
			var self = this,
				o = self.options,
				$el = self.element;
			
			//page event bindings
			// Fixed toolbars require page zoom to be disabled, otherwise usability issues crop up
			// This method is meant to disable zoom while a fixed-positioned toolbar page is visible
			$el.closest( ".ui-page" )
				.bind( "pagebeforeshow", function(){
					if( o.disablePageZoom ){
						$.mobile.zoom.disable( true );
					}
					if( o.visibleOnPageShow ){
						self.show( true );
					}
				} )
				.bind( "webkitAnimationStart animationstart updatelayout", function(){
					if( o.updatePagePadding ){
						self.updatePagePadding();
					}	
				})
				.bind( "pageshow", function(){
					self.updatePagePadding();
					if( o.updatePagePadding ){
						$( window ).bind( "throttledresize." + self.widgetName, function(){
						 	self.updatePagePadding();
						});
					}
				})
				.bind( "pagebeforehide", function(){
					if( o.disablePageZoom ){
						$.mobile.zoom.enable( true );
					}
					if( o.updatePagePadding ){
						$( window ).unbind( "throttledresize." + self.widgetName );
					}	
				});
		},
		
		_visible: false,
		
		// This will set the content element's top or bottom padding equal to the toolbar's height
		updatePagePadding: function() {
			var $el = this.element,
				header = $el.is( ".ui-header" );
			
			// This behavior only applies to "fixed", not "fullscreen"
			if( this.options.fullscreen ){ return; }

			$el.closest( ".ui-page" ).css( "padding-" + ( header ? "top" : "bottom" ), $el.height() );
		},
		
		show: function( notransition ){
			var hideClass = "ui-fixed-hidden",
				$el = this.element,
				$win = $( window ),
				scroll = $win.scrollTop(),
				elHeight = $el.height(),
				pHeight = $el.closest( ".ui-page" ).height(),
				viewportHeight = Math.min( screen.height, $win.height() ),
				tbtype = $el.is( ".ui-header" ) ? "header" : "footer";

				if( !notransition && ( this.options.transition && this.options.transition !== "none" &&
					(
					( tbtype === "header" && !this.options.fullscreen && scroll > elHeight ) ||
					( tbtype === "footer" && !this.options.fullscreen && scroll + viewportHeight < pHeight - elHeight )
					) || this.options.fullscreen ) ){
				$el
					.removeClass( "out " + hideClass )
					.addClass( "in" );
			}
			else {
				$el.removeClass( hideClass );
			}
			this._visible = true;
		},
		
		hide: function( notransition ){
			var hideClass = "ui-fixed-hidden",
				$el = this.element,
				$win = $( window ),
				scroll = $win.scrollTop(),
				elHeight = $el.height(),
				pHeight = $el.closest( ".ui-page" ).height(),
				viewportHeight = Math.min( screen.height, $win.height() ),
				tbtype = $el.is( ".ui-header" ) ? "header" : "footer",
				// if it's a slide transition, our new transitions need the reverse class as well to slide outward
				outclass = "out" + ( this.options.transition === "slide" ? " reverse" : "" );

			if( !notransition && ( this.options.transition && this.options.transition !== "none" &&
					(
					( tbtype === "header" && !this.options.fullscreen && scroll > elHeight ) ||
					( tbtype === "footer" && !this.options.fullscreen && scroll + viewportHeight < pHeight - elHeight )
					) || this.options.fullscreen ) ){
				$el
					.addClass( outclass )
					.removeClass( "in" )
					.animationComplete( function(){
						$el.addClass( hideClass ).removeClass( outclass );
					});
			}
			else {
				$el.addClass( hideClass ).removeClass( outclass );
			}
			this._visible = false;
		},
		
		toggle: function(){
			this[ this._visible ? "hide" : "show" ]();
		},
				
		_bindToggleHandlers: function(){
			var self = this,
				o = self.options,
				$el = self.element;
			
			// tap toggle
			$el.closest( ".ui-page" )
				.bind( "vclick", function( e ){
					if( o.tapToggle && $el.find( e.target ).length === 0 ){
						self.toggle();
					}
				});
		},
		
		destroy: function(){
			this.element.removeClass( "ui-header-fixed ui-footer-fixed ui-header-fullscreen ui-footer-fullscreen in out fade slidedown slideup ui-fixed-hidden" )
			this.element.closest( ".ui-page" ).removeClass( "ui-page-header-fixed ui-page-footer-fixed ui-page-header-fullscreen ui-page-footer-fullscreen" );
		}
		
	});
	
	//auto self-init widgets
	$( document ).bind( "pagecreate create", function( e ){
		$( $.mobile.fixedtoolbar.prototype.options.initSelector, e.target ).fixedtoolbar();
	});	

})( jQuery );
//>>excludeStart("jqmBuildExclude", pragmas.jqmBuildExclude);
});
//>>excludeEnd("jqmBuildExclude");
