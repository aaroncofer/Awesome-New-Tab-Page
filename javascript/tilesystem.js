/*
 *
 * Awesome New Tab Page
 *   Copyright 2011 Michael Hart (http://h4r7.me/).
 * 
 * Want to make it even more awesome?
 *   https://github.com/michaelhart/Awesome-New-Tab-Page/

 * Tile / Widget System
 *   Immense thanks to David Shorten (shortenda at gmail.com)
 *   the original author of the below code.
 *
 * Licensed under GPL v2:
 *   http://www.gnu.org/licenses/gpl-2.0.txt
 *
 */

var GRID_MIN_HEIGHT   = 3,
    GRID_MIN_WIDTH    = 7,
    GRID_MARGIN_TOP   = localStorage.getItem("showbmb") === "yes" ? 27 : 0,
    GRID_MARGIN_LEFT  = 32,
    GRID_TILE_SIZE    = 200,  /* NEVER CHANGE */
    GRID_TILE_PADDING = 3;    /* NEVER CHANGE */

function placeGrid() {
  var tile_template = '<li class="tile empty">&nbsp;</li>';

  var height = GRID_MIN_HEIGHT;
  var width = GRID_MIN_WIDTH;

  if ( typeof(window.innerHeight) !== "undefined"
    && typeof(screen.width) !== "undefined" ) {
    var res_height = Math.floor( ( window.innerHeight - GRID_MARGIN_TOP ) / ( GRID_TILE_SIZE + ( GRID_TILE_PADDING * 2 ) ) );
    var res_width  = Math.floor( ( screen.width - GRID_MARGIN_LEFT ) / ( GRID_TILE_SIZE + ( GRID_TILE_PADDING * 2 ) ) ) + 3;

    if(res_height > height) {
      height = res_height;
    }
    if(res_width > width) {
      width = res_width;
    }
  }

  var widgets = JSON.parse(localStorage.getItem("widgets")),
      placed_height = 0, placed_width = 0;
  if( typeof(widgets) === "object" ) {
    $.each(widgets, function(id, widget) {
      if( parseFloat(widget.where[0]) + parseFloat(widget.size[0]) > placed_height ) {
        placed_height = parseFloat(widget.where[0]) + parseFloat(widget.size[0]);
      }
      if( parseFloat(widget.where[1]) + parseFloat(widget.size[1]) + 3 > placed_width ) {
        placed_width = parseFloat(widget.where[1]) + parseFloat(widget.size[1]) + 3;
      }
    });

    if(placed_height > height) {
      height = placed_height;
    }
    if(placed_width > width) {
      width = placed_width;
    }
  }

  for (var gx = 0; gx < height; gx++) {
    for (var gy = 0; gy < width; gy++) {
      $(tile_template).appendTo("#grid-holder").css({
        "position": "absolute",
        "top" : GRID_MARGIN_TOP  + ( gx * GRID_TILE_SIZE ) + ( ( GRID_TILE_PADDING * 2 ) * ( gx + 1 ) ),
        "left": GRID_MARGIN_LEFT + ( gy * GRID_TILE_SIZE ) + ( ( GRID_TILE_PADDING * 2 ) * ( gy + 1 ) )
      }).attr({
        "id": gx + "x" + gy,
        "data-land-top": gx,
        "data-land-left": gy
      });
    }
  }

  $(".tile").animate({opacity: 0}, 500);
}

$(document).ready(function($) {
  placeGrid();
  placeWidgets();
});

$(".empty").live({
  mouseenter: function() {
    $(this).addClass("add-shortcut");
  },
  mouseleave: function() {
    $(".tile").removeClass("add-shortcut");
  }
});

var update = true;
function makeZero(num){
  if(num < 0){
    num = 0;
  }
  return num;
}

function findClosest(tile){
  var closestElm = null;
  var boxx = $(tile).position().left;
  var boxy = $(tile).position().top;
  var distElm = -1;
  $(".tile").each(function(ind, elem){
      var closex = $(elem).position().left;
      var closey = $(elem).position().top;
      testElm = Math.pow(boxx - closex, 2) + Math.pow(boxy - closey, 2);
      if(testElm < distElm || distElm == -1){
        distElm = testElm;
        closestElm = elem;
      }
  });
  return closestElm;
}

// var cache = {};
function getCovered(tile) {
  var toRet = {};
  toRet.clear = true;
  toRet.tiles = [];
  var closestElm = findClosest(tile);

  // if(cache && cache.closest === closestElm && cache.tile === tile && cache.toRet) {
  //   return cache.toRet;
  // } else {
  //   cache = {}; cache.closest = closestElm; cache.tile = tile;
  // }

  var top  = parseInt( $(closestElm).attr("data-land-top")  , 10);
  var left = parseInt( $(closestElm).attr("data-land-left") , 10);

  var height = parseInt( $(tile).attr("data-tile-height")   , 10);
  var width  = parseInt( $(tile).attr("data-tile-width")    , 10);

  var h=0;
  for (h=0; h<=(height-1); h++)
  {
    var w=0;
    for (w=0; w<=(width-1); w++)
    {
      var temporary_tile = $("#"+(top+h)+"x"+(left+w)+".tile")[0];
      if( temporary_tile ) {
        (toRet.tiles).push( temporary_tile );

        if($( temporary_tile ).hasClass("empty") === false) {
          toRet.clear = false;
        }
      } else {
        toRet.clear = false;
      }
    }
  }

  // cache.toRet = toRet;

  return toRet;
}

function setStuff(){
  $(".widget").each(function(ind, elem){
      $(elem).css("width",
        $(elem).attr("data-tile-width") * 200 + (makeZero($(elem).attr("data-tile-width") - 1) * 6)
      );
      $(elem).css("height",
        $(elem).attr("data-tile-height") * 200 + (makeZero($(elem).attr("data-tile-height") - 1) * 6)
      );
      $(elem).css("left", $(elem).attr("initleft") * 206 + 8);
      $(elem).css("top", $(elem).attr("inittop") * 206 + 8);
      
      var closestElm = findClosest(this);
      var tiles = getCovered(this);

        $(this).css("left", $(closestElm).position().left);
        $(this).css("top", $(closestElm).position().top);
        $(tiles.tiles).each(function(ind, elem){
            $(elem).toggleClass("empty", false); //mark the tile we are now in as not empty
            $(elem).css("z-index", "0");
        });
        $(this).css("z-index","1"); //set widget back on normal zindex
  });
  
  var held_element = {};
  $('.widget').live('mousedown', function(e) { //when we pick up a tile
      if(lock === true) {
        return false;
      }

      held_element.offsetX = e.offsetX;
      held_element.offsetY = e.offsetY;

      $(this).attr("mousedown", "true");
      if(e.preventDefault()){
        e.preventDefault();
      }

      if( $(this).attr("data-app-source") === "from-drawer") {
        $(this).css("left", $(this).offset().left);
        $(this).css("top", $(this).offset().top);
        $(this).css("position", "absolute");
        $(this).prependTo("body");
        $(".ui-2#apps").css("display", "none");
        $(".ui-2#widgets").css("display", "none");
        // $(".o1x1,.o1x2,.o1x3,.o2x1,.o2x2,.o2x3,.o3x1,.o3x2,.o3x3").css("opacity", "0");
      } else {
        var tiles = getCovered(this);
        $(tiles.tiles).each(function(ind, elem){
            $(elem).toggleClass("empty", true); //set the tile we came from to be empty
        });
      }
      $(this).css("z-index","100"); //allow us to drag it across everything
      $(this).attr("oldx", $(this).position().left);
      $(this).attr("oldy", $(this).position().top);

  });  
  
  $('.widget').live('mouseup', function(e) { //when we release a tile
      if(lock === true) {
        return false;
      }

      $(".tile").removeClass("tile-green");
      $(".tile").removeClass("tile-red");
      $(".tile").css("z-index", "0");

      // $(".o1x1,.o1x2,.o1x3,.o2x1,.o2x2,.o2x3,.o3x1,.o3x2,.o3x3").css("opacity", "1");

      $(this).removeClass("widget-drag");

      $(this).attr("mousedown", "false");
      update = true;
      
      //find the closest tile
      var closestElm = findClosest(this);
      var tiles = getCovered(this); 

      if(tiles.clear === true){
        if($(this).attr("data-app-source") === "from-drawer" && $(this).attr("data-widget") === "true") {

          addWidget(true,
            $(this).attr("id"),
            $(closestElm).attr("data-land-top"),
            $(closestElm).attr("data-land-left"),
            $(this).attr("data-widget-src"),
            $(this).attr("data-tile-width"),
            $(this).attr("data-tile-height"),
            $(this).attr("data-poke"),
            stock_widgets[$(this).attr("data-stock")]
          );
        } else if( $(this).attr("data-app-source") === "from-drawer") {
          addWidget(false,
            $(this).attr("id"),
            $(closestElm).attr("data-land-top"),
            $(closestElm).attr("data-land-left"),
            null, null, null, null, $(this).attr("data-stock")
          );
        } else {
          updateWidget($(this).attr("id"),
            $(closestElm).attr("data-land-top"),
            $(closestElm).attr("data-land-left")
          );
        }

        $(this).css("left", $(closestElm).position().left);
        $(this).css("top", $(closestElm).position().top);
        $(tiles.tiles).each(function(ind, elem){
            $(elem).toggleClass("empty", false); //mark the tile we are now in as not empty
            $(elem).css("z-index", "0");
        });
        $(this).css("z-index","1"); //set widget back on normal zindex
        
        
      } else { //if the tile was full
        $(tiles.tiles).each(function(ind, elem){
            $(elem).css("z-index", "0");
        });
        $(this).css("left", parseInt( $(this).attr("oldx"), 10) );
        $(this).css("top", parseInt( $(this).attr("oldy"), 10) );
        
        $(this).css("z-index","1");

        tiles = getCovered(this); // Recheck since it moved.
        $(tiles.tiles).each(function(ind, elem){
            $(elem).toggleClass("empty", false);
        });
        $(this).css("left", parseInt( $(this).attr("oldx"), 10) );
        $(this).css("top", parseInt( $(this).attr("oldy"), 10) );
      }
      
      if( $(this).attr("data-app-source") === "from-drawer") {
        $(this).css("position", "").css("left", "").css("top", "");
        if( $(this).attr("data-widget") === "true") {
          $(this).prependTo(".ui-2#widgets > .contents");
        } else {
          $(this).prependTo(".ui-2#apps > .contents");
        }
      }

  });
  
  
  $('body').live('mousemove', function(e) { // when we move a tile
      if(lock === true) {
        return;
      }

      var held = false;
      $(".widget").each(function(ind, elem){
          if($(elem).attr("mousedown") == "true"){
            held = elem;
            return false;
          }
      });
      
      if( held !== false){
        if(update === true){
          update = false;
          $(held).attr("lastx", e.pageX);
          $(held).attr("lasty", e.pageY);
        }else{
          $(held).css("left", e.pageX - held_element.offsetX);
          $(held).css("top", e.pageY - held_element.offsetY);
          $(held).attr("lastx", e.pageX);
          $(held).attr("lasty", e.pageY);
        }

        $(".edit-shortcut-ui").remove();
        hscroll = true;
        
        var closestElm = findClosest(held);
        var tiles = getCovered(held);
        
        $(".tile").removeClass("tile-green");
        $(".tile").removeClass("tile-red");
        $(".tile").css("z-index", "0");
        $(held).addClass("widget-drag");

        if(tiles.clear === true){
          $(tiles.tiles).each(function(ind, elem){
              $(elem).addClass("tile-green");
              $(elem).css("z-index", "2");
          });
        }else{
          $(tiles.tiles).each(function(ind, elem){
              $(elem).addClass("tile-red");
              $(elem).css("z-index", "2");
          });
        }
      }
  });
  
}