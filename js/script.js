// Volume meter demo
// http://www.smartjava.org/content/exploring-html5-web-audio-visualizing-sound

// http://www.michaelbromley.co.uk/blog/42/audio-visualization-with-web-audio-canvas-and-the-soundcloud-api


// blur image canvas
// http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html
// http://codepen.io/gakimball/pen/Bafkd


var songs = [ 'audio/jubel.mp3', 'audio/acdc.mp3', 'audio/short.mp3'];
var song_index = 0;

var song_loaded = false;
var song_playing = false;
var song_current_time = 0;
var song_paused = false;

var SC_id = 'da387279623e0b5a462bc4950d75ad54';
var search;
var $search_songs;
var result_index;

// Setup canvas
	var canvas = document.getElementById('canvas');
	var canvas_context = canvas.getContext('2d');

	var player = document.getElementById('canvas2');
	var player_context = player.getContext('2d');

	var overlay = document.getElementById('canvas3');
	var overlay_context = overlay.getContext('2d');
	//overlay_context.globalCompositeOperation = "multiply";

	var cover_blur = new Image();
	cover_blur.src = 'img/acdc_blur.png';

	var alpha = 0.3;
	var opacity;


$(function(){


	console.log(cover_blur)
	//player_context.drawImage(cover_blur, 0 , 0, 498, 498)
	

	// Click anywhere to play song
	$('#canvas').on('click', function(){

		if (song_playing == false) {
			sound_url = songs[song_index];
			loadSong(sound_url);
		} else {
			pauseSound();
		}
		
	});

	// Click menu to switch song
	$('body').on('click', '.menu_item.off', function(){
		
		song_index = $(this).data('index');
		console.log(song_index)

		// Fix classes
		$('.menu_item').removeClass('on').addClass('off');
		$(this).removeClass('off').addClass('on');

		if (song_playing == true){
			pauseSound();
		}

		sound_url = songs[song_index];
		console.log(sound_url)
		loadSong(sound_url);


	})

	// Audio API
	var audio_context;
	var sound_url;
	var audioBuffer, sourceNode;
    var analyser, analyser2;
    var javascriptNode, sourceNode, splitter;


	//window.addEventListener('load', init_sound_API, false);
	init_sound_API()
	function init_sound_API() {
		try {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			audio_context = new AudioContext();
			//audio_context.crossOrigin = "anonymous";
		}
		catch(e) { }
	}

	// setupAudioNodes();
	function setupAudioNodes() {


		// Setup javascript node
		javascriptNode = audio_context.createScriptProcessor(2048, 1, 1);
		// Connect to destination
		javascriptNode.connect(audio_context.destination);

		// Setup a analyzer
	    analyser = audio_context.createAnalyser();
	    analyser.smoothingTimeConstant = 0.3;
	    analyser.fftSize = 1024;

	    analyser2 = audio_context.createAnalyser();
	    analyser2.smoothingTimeConstant = 0.0;
	    analyser2.fftSize = 1024;

	    // Create a buffer source node
	    sourceNode = audio_context.createBufferSource();
	    splitter = audio_context.createChannelSplitter();
	    // Connect the source to the analyser and the splitter
	    sourceNode.connect(splitter);

	    // Connect one of the outputs from the splitter to the analyser
	    splitter.connect(analyser,0,0);
	    splitter.connect(analyser2,0,0);
	    // Connect thesplitter to the javascriptnode
	    // using the js node to draw at a specific interval
	    analyser.connect(javascriptNode);
	    // Connect to destination
	    sourceNode.connect(audio_context.destination);

	    playSound(buffer);

	}

	var buffer;
	// Load song
	function loadSong(sound_url){

		var request = new XMLHttpRequest();
		request.open('GET', sound_url, true);
		request.responseType = 'arraybuffer';

		// Decode asynchronously
		request.onload = function() {
			song_loaded = true;
			audio_context.decodeAudioData(request.response, function(theBuffer) {
				// When the audio is loaded play the sound
				console.log('loaded');
				console.log(theBuffer)
				buffer = theBuffer;
				//playSound(buffer)
				setupAudioNodes();
				audioProcess();


			}, onError);
		}
		request.send();

	}

	function playSound(buffer) {
		// setupAudioNodes();
		// audioProcess();

		song_playing = true;
        sourceNode.buffer = buffer;

        sourceNode.start( song_current_time);

        console.log('play')

    }



    function pauseSound(buffer) {
    	
    	song_playing = false;
    	console.log('pause')
    	song_current_time = audio_context.currentTime; 
    	sourceNode.stop(song_current_time);
    }
 
    // log if an error occurs
    function onError(e) {
        console.log(e);
    }


    function audioProcess(){
   	// When the javascript node is called we use info from the analyser node to draw volume
	    javascriptNode.onaudioprocess = function() {

	    	// Get the average for the first channel
	    	var channel_1_array = new Uint8Array(analyser.frequencyBinCount);
	    	analyser.getByteFrequencyData(channel_1_array);
	    	var channel_1_average = getAverageVolume(channel_1_array);

	    	// Get the average for the second channel
	    	var channel_2_array = new Uint8Array(analyser2.frequencyBinCount);
	    	analyser2.getByteFrequencyData(channel_2_array);
	    	var channel_2_average = getAverageVolume(channel_2_array);

	    	// Clear current canvas
	    	canvas_context.clearRect(0,0,60,130);
	    	player_context.clearRect(0,0,280,498);
	    	overlay_context.clearRect(0,0,280,498);
	    	// Set fill style
	    	canvas_context.fillStyle = 'red';
	    	// Create the meters
	    	canvas_context.fillRect(0,130-(channel_1_average/2.5), 25, 130);
	    	canvas_context.fillRect(30, 130-(channel_2_average/2.5), 25, 130);

	    	player_context.drawImage(cover_blur, -60 , 0, 498-(channel_1_average), 498+(channel_2_average))
	    	//player_context.drawImage(cover_blur, -60 , 0, 498-(channel_1_average/1.5), 498)

	    	console.log('channel_2_average: ' + channel_2_average)

	    	overlay_context.rect(0,0, 280,498);
	    	

	    	//opacity = alpha+(channel_2_average/800);
	    	opacity = 0.2;
	    	console.log('opacity: ' + opacity)
	    	
	    	overlay_context.fillStyle = "rgba(0, 0, 0, " + opacity + ")";
	    	overlay_context.fill();
	    	overlay_context.globalCompositeOperation = "multiply";

	    }
	 }

    function getAverageVolume(channel_1_array) {
    	var values = 0;
        var average;

        var length = channel_1_array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += channel_1_array[i];
        }

        average = values / length;
        return average;
    }

    
   






})