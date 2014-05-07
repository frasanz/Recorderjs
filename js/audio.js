/* Definition of some globals variables*/
globals = (function(){
	var pm = {};
	pm.numColumns = 64;
	pm.numRows = 8;
	pm.colSelected=0;
	pm.interval=166; //90bpm
	pm.increment=0;  //0-stop 1-play
	pm.autoscroll=1; //0-noautoscroll 1-autoscroll
	pm.scrollchange=pm.numColumns/2+4; //When to do autoscroll
	pm.minloop=0;
	pm.maxloop=0;
	pm.temp=0;
	pm.dbltemp=0;
	pm.loop=0;
  pm.record=0;
  pm.recording=0;
  pm.recordNode=null;
  pm.recorder=null;
	return pm;
})();


/* Convert a string to an array of bytes */
function stringToHex ( str ) {
  var hex, re = [];
  for (var i = 0; i < str.length; i++ ) {
    hex = str.charCodeAt(i).toString(16);  // get char 
    // add stack contents to result
    // done because chars have "wrong" endianness
		console.log(hex);
  	re = re.concat( hex );
	}
  // return an array of bytes
	console.log(re);
  return re;
}


/* It´s not addHex, first one is a hex value, second one is a decimal.*/
function addHexInt(sum1, sum2, limitinf,limitsup){
	console.log(sum1+' '+sum2); 
	sum1 = (parseInt(sum1, 16) + sum2);
	if(sum1<limitinf)
		sum1=limitinf
	if(sum1>limitsup)
		sum1=limitsup
	sum1 = sum1.toString(16);
  while (sum1.length < 2) { sum1 = '0' + sum1; }
	return sum1;
}

/* Create empty sequencer
 * we accept num_rows x num_cols, the id to construct the id of the sequencer,
 * parentid is the parent div to attach the sequencer */
create_empty_sequencer = function(num_rows, num_cols, id, parentid){
	//console.log("creating sequencer "+id+" on "+parentid+" "+num_rows+" x "+num_cols);
	var seq='<div class="div_sequencer" id="div_'+id+'">'+
		      '<table class="table_sequencer" id="table_'+id+'">';
	    seq=seq+"<tr class='header'><td></td><td></td><td></td>";
			for(i=0;i<num_cols;i++){
				if(i%16==0){
					num=i/16+1;
					seq=seq+'<td class="td_head" id="head_'+i+'">'+num+'</td>';
				}
				else if(i%4==0){
					seq=seq+'<td class="td_head" id="head_'+i+'">|</td>';
				} else
					seq=seq+'<td class="td_head" id="head_'+i+'">.</td>';
			}
	for(i=0; i<num_rows; i++){
		seq=seq+'<tr id="tr_'+id+"_"+i+'"><td class="instrument"></td>';
		if(id==0)
			seq=seq+'<td class="mute" id="mute_'+id+'_'+i+'">M</td>';
		else // start other sequencers muted
			seq=seq+'<td class="mute muteon" id="mute_'+id+'_'+i+'">M</td>';
		if(id==0)
			seq=seq+'<td class="copyhere" id="copy_'+id+'_'+i+'">C</td>';
		else // We can copy from here
			seq=seq+'<td class="copyfrom" id="copy_'+id+'_'+i+'">C</td>';
		for(j=0; j<num_cols; j++){
			seq=seq+'<td class="off seq'+id+'" id="td_'+id+"_"+i+"_"+j+'" volume="00" duration="01" colspan="01"></td>';
		}
		seq=seq+"</tr>";
	}
	/* One row for the leds */
	seq=seq+'<tr class="led"><td></td><td></td><td></td>';
	for(i=0;i<num_cols;i++){
		seq=seq+'<td class="led led'+id+' td_l_'+i+'"></td>'
	}
	seq=seq+'</tr>';
	seq=seq+'</table></div>';
	$(parentid).html(seq);
};


/*Change a line of a sequencer*/
change_line = function(sequencer, line, data){
	console.log("on change line, called with "+sequencer+" "+line+" "+data);
	/* Now, we're storing in hex arrays, conversion using fromCharCode in
	 * javascript, assing some numbers to null 
	 *
	 *
	 * aabbccdd
	 * aa -> volume
	 * bb -> duration
	 * cc -> free
	 * dd -> free*/
	for(i=0; i< globals.numColumns; i++){
		start = i*8;
		volume   = data.substring(start,start+2);
		duration = data.substring(start+2,start+4);
		$("#td_"+sequencer+"_"+line+"_"+i).attr("volume",volume);
		$("#td_"+sequencer+"_"+line+"_"+i).attr("duration",duration);
	}

	/* last 8 bytes are for channel definition
	   do the stuff here */
}

/* Function decorate_td 
   This function decorates the td with the attributed stored in it 
   Arguments: #sequencer, #line, #td */
decorate_td = function(sequencer, line, td){
		$("#td_"+sequencer+"_"+line+"_"+td).trigger('redraw');
};

/* Function decorate_line 
   This function decorates the line with the attributes stored in each td 
   Arguments, #sequencer, #line */
decorate_line = function(sequencer,line){
	for(j=0;j<globals.numColumns;j++){
		decorate_td(sequencer, line, j);
	}
}

/* Function decorate_sequencer 
   This function decorates the full sequencer 
   Arguments #sequencer */
decorate_sequencer = function(sequencer){
	console.log(globals.numRows);
	for(i=0;i<globals.numRows;i++){
		decorate_line(sequencer,i);
	}
}

/* This function makes all sequencers mutable */
make_sequencers_mutable = function(){
	$('.mute').click(function(){
		console.log('click');
		$(this).toggleClass('muteon');
	});
}

/* This function write the hex of a file 
 * Arguments are seq number and file number
 */
log_file = function(seq,file){
	var line="";
	for(i=0;i<globals.numColumns; i++){
		volume   = $("#td_"+seq+"_"+file+"_"+i).attr('volume');
		duration = $("#td_"+seq+"_"+file+"_"+i).attr('duration');
	  line=line+volume+duration+"00"+"00";	
	}
	return line;
}

/* Make all sequencers copyable */
make_sequencers_copyable = function(){
	$('.copyfrom') .click(function(){
		/* Get the id of the sequencer and row*/
		ids=($(this).attr('id')).split("_");
		line = log_file(ids[1],ids[2]);
		console.log(line);
	})
	$('.copyfrom').draggable({ 
		revert: true,
		appendTo: 'body',
	  containment: 'window',
		scroll: false,
		helper: 'clone',
		start: function( event, ui ) {
		console.log('starting drag');
		$('.copyhere').effect('highlight');
		}
	});
	$('.copyhere').droppable({
		accept: 'td.copyfrom',
		drop: function(event, ui){
			destids=($(this).attr('id')).split("_");
			sourceids=($(ui.draggable).attr('id')).split("_");
			new_data = log_file(sourceids[1], sourceids[2]);
			change_line(destids[1],destids[2],new_data);
			decorate_line(destids[1],destids[2]);
		}
	});

}

/* This function makes a sequencer drawable / editable
   Arguments: 
	 The number of the sequencer 
	 mode: 0 means only drawable, 1 means editable */
activate_sequencer= function(sequencer,mode){
	td=this;
  $('td.seq'+sequencer)
	.bind('redraw',function() {
		/* Change the color according volume */
		volume=parseInt($(this).attr("volume"),16);
		console.log(volume);
		if(volume=="0")
			$(this).css("background-color","#000000");
		else{
			color=55+2*volume;
			$(this).css('background-color', 'rgb('+color+','+color+',55)');
		}

		/* Change the length according with the duration */
		duration=parseInt($(this).attr("duration"),16);
		$(this).attr('colspan', duration);
		/* Hide the needed td */
		numbertohide=duration-1;
		console.log("step 1 hidding: "+numbertohide);
		$(this).nextAll().show();
		$(this).nextAll("*:lt("+numbertohide+")").hide()
		.attr('volume','00')
		.attr('duration','01')
		.attr('colspan','01')
		.css('background-color', 'rgb(0,0,0)');

		/* Find sibilings with duration > 1*/
		$(this).siblings().each(function(){
			duration=parseInt($(this).attr("duration"),16);
			if(duration>1){
				numbertohide=duration-1;
				console.log("step 2 hidding: "+numbertohide);
				$(this).nextAll("*:lt("+numbertohide+")").hide();
			}
		});

	});
	if(mode){
		$('td.seq'+sequencer)
		.click(function(){
			if($(this).attr("volume") == "00")
				$(this).attr("volume","64");
			else
				$(this).attr("volume","00");
			$(this).trigger('redraw');
		})

		.mousewheel(function(event,delta) {
			if(event.altKey){
				volume=addHexInt($(this).attr("volume"),4*delta,0,100);
				$(this).attr("volume",volume)
				.trigger('redraw');
				return false; //prevent default
			} else {
				duration=addHexInt($(this).attr("duration"),delta,1,16);
				$(this).attr("duration",duration)
				.trigger('redraw');
				return false;
			}
		});
	}
	$('td.led'+sequencer)
		.click(function(){
			ids=($(this).attr('class')).split("_");
			console.log(ids);
			globals.jumpTo=parseInt(ids[2]);
		});
}

/* This function initializes audio, we're using Web audio API,
 * https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html
 *
 * to start: http://www.html5rocks.com/en/tutorials/webaudio/intro/
 *
 * When finished it calls startSequencer
 */
function initAudio() {
	window.AudioContext = window.webkitAudioContext; 
	context = new AudioContext();
	bufferLoader = new BufferLoader(
			context,
			[
				'audio/bajo2sol.wav',
				'audio/bajo3mi.wav',
				'audio/bajo1do.wav',
				'audio/bajo4si.wav',
				'audio/bongo.wav',
				'audio/charles.wav',
				'audio/caja.wav',
				'audio/bombo.wav',
			],
			startSequencer
			);
	bufferLoader.load();
};

/* This function constrains a value in its boundary,
 * new it allows loop */
function boundary(value){
	if(globals.loop){
		if(value>=globals.maxloop+1)
			return parseInt(globals.minloop);
		else
			return value;
	}else{
		if(value>=globals.numColumns)
			return 0;
		else
			return value;
	}
}

/* This function creates the download link*/
function createDownloadLink() {
  globals.recorder && globals.recorder.exportWAV(function(blob) {
      var url = URL.createObjectURL(blob);
      var li = document.createElement('li');
      var au = document.createElement('audio');
      var hf = document.createElement('a');

      au.controls = true;
      au.src = url;
      hf.href = url;
      hf.download = new Date().toISOString() + '.wav';
      hf.innerHTML = hf.download;
      li.appendChild(au);
      li.appendChild(hf);
      recordingslist.appendChild(li);
      });
}

/* This function start all needed for recording */
function start_record(){
  if(globals.recordNode==null)
    globals.recordNode=context.createGain();
  if(globals.recorder==null)
    globals.recorder=new Recorder(globals.recordNode);
  globals.recorder && globals.recorder.record();
  $("input[type=button]").attr("disabled", true);
}

function stop_record(){
  globals.record=0;
  globals.increment=0;
  globals.recorder && globals.recorder.stop();
  createDownloadLink();
  globals.recorder.clear();
  $("input[type=button]").attr("disabled", false);
}


/* This function play a column of a sequencer */
function play_column(sequencer,column,bufferlist){
	var source = [];
	var gainNode = [];
	for(i=0; i<globals.numRows; i++){
		this_td='#td_'+sequencer+'_'+i+'_'+column;
		volume=parseInt($(this_td).attr("volume"),16);
		duration=parseInt($(this_td).attr("duration"),16);
		//console.log(i+'_'+column+'--:'+volume+' '+duration);
		mute=$(this_td).prevAll('.mute').hasClass('muteon');
		if( volume !='00' && duration !='00' && !mute){
			source[i] = context.createBufferSource();
			source[i].buffer = bufferlist[i];
			gainNode[i] = context.createGain();
			source[i].connect(gainNode[i]);
			gainNode[i].gain.value = 1.0*volume/100;
      if(globals.record==1){
        gainNode[i].connect(globals.recordNode);
        globals.recordNode.connect(context.destination);
      }else{
			  gainNode[i].connect(context.destination);
      }
			source[i].start(0,0,1.0*duration*globals.interval/1000);
		}
	}
	/* Led on on this column */
	prev=column-1;
	if(column==0)
		prev=globals.numColumns-1;
	$('td.ledon').removeClass('ledon');
  //$('.td_l_'+prev).removeClass('ledon');
  $('.td_l_'+column).addClass('ledon');
};

/* This function autoscrolls the tables */
function autoscroll(){
	if(globals.colSelected>globals.scrollchange){
		$('#div_0').scrollLeft(1000);
	}else{
		$('#div_0').scrollLeft(0);
	}

}

/* This function is called at the end of init_audio()
 * os start the Sequencer */
function startSequencer(bufferlist) {
	var init = new Date().getTime();
	var next = globals.colSelected+globals.increment;
	var curr = globals.colSelected;
	next = boundary(next);
	console.log(next);
	if(globals.autoscroll)
		autoscroll(globals.scrollchange);
	//console.log("--"+curr);
	if(globals.increment){
		globals.autoscroll=1;
    if(globals.record==1 && globals.colSelected==0 && globals.recording==1){
      stop_record();
      globals.recording=0;
    }
    if(globals.record==1 && globals.colSelected==0){
        start_record();
        globals.recording=1;
    }
		play_column(0,curr,bufferlist);
	  /*play_column(1,curr,bufferlist);
	  play_column(2,curr,bufferlist);
	  play_column(3,curr,bufferlist);
	  play_column(4,curr,bufferlist);*/
	}else{
		globals.autoscroll=0;
	}
	/* Recall */
	if(globals.jumpTo){
		globals.colSelected=globals.jumpTo;
		globals.jumpTo=0;
	}
	else
	globals.colSelected=next;
	var offset = new Date().getTime() - init;
	setTimeout(startSequencer, globals.interval-offset,bufferlist);
};

/* This function saves a sequencer */
function save_sequencer(sequencer){
	for(k=0; k< globals.numRows; k++){
		var thisline = "";
		thisline = log_file(sequencer,k);
	  console.log("line "+k+" "+thisline);
	}
}

/* This function enables start, pause by changing globals.increment,
 * and enables saving */
function enable_other_buttons(){
	$('#start').click(function(){
		console.log('start');
		globals.increment=1;
	});
	$('#stop').click(function(){
		console.log('stop');
		globals.increment=0;
	});
  $('#record').click(function(){
    console.log('record');
    globals.colSelected=0;
    globals.increment=1;
    globals.record=1;
  });
	$('#save').click(function(){
		console.log('save');
		save_sequencer("0");
	});
	$('.seqselector').click(function(){
		$('.otherseqs').css('display','none');
		sequencer='#seq'+$(this).attr('id');
		$(sequencer).css('display','inline');
	});
	$('#div_0').scroll(function(){
		same_scroll();
	});
};


/* This function enables the loop tool */
function enable_loop(){
	$('#loopon').click(function(){
		console.log('loopon');
		globals.loop=1;
	});
	$('#loopoff').click(function(){
		console.log('loopoff');
		globals.loop=0;
	});

	$('td.td_head').click(function(){
		id=($(this).attr('id')).split("_")[1];
		globals.dbltemp=globals.temp;
		globals.temp=globals.minloop;
		globals.minloop=parseInt(id);
		console.log('head_click '+id+' '+globals.minloop+' '+globals.temp+' '+globals.maxloop);

		/* Reset the head class*/
		$('td.td_head').removeClass('td_headon');
		for(i=globals.minloop; i<=globals.maxloop; i++)
			$('#head_'+i).addClass('td_headon');
	});

	$('td.td_head').dblclick(function(){
		id=($(this).attr('id')).split("_")[1];
		globals.minloop=parseInt(globals.dbltemp);
		globals.maxloop=parseInt(id);
		console.log('head_dblclick '+id+' '+globals.minloop+' '+globals.maxloop);

		/* Reset the head class*/
		$('td.td_head').removeClass('td_headon');
		for(i=globals.minloop; i<=globals.maxloop; i++)
			$('#head_'+i).addClass('td_headon');
	});
}

/* This function synchronizes the scroll for both sequencers */
function same_scroll(){
	$('#div_1').scrollLeft($('#div_0').scrollLeft());
	$('#div_2').scrollLeft($('#div_0').scrollLeft());
	$('#div_3').scrollLeft($('#div_0').scrollLeft());
	$('#div_4').scrollLeft($('#div_0').scrollLeft());
}

$(document).ready(function(){
	create_empty_sequencer(globals.numRows, globals.numColumns, "0", "#seq0");
	/*create_empty_sequencer(globals.numRows, globals.numColumns, "1", "#seq1");
	create_empty_sequencer(globals.numRows, globals.numColumns, "2", "#seq2");
	create_empty_sequencer(globals.numRows, globals.numColumns, "3", "#seq3");
	create_empty_sequencer(globals.numRows, globals.numColumns, "4", "#seq4");
	change_line("1","4","00010000000100005401000000010000000100000001000000010000440100000001000000010000000100000001000000010000000100005801000000010000000100000001000054010000000100000001000000010000000100006401000000010000000100000001000000010000000100000001000064010000000100000001000000010000000100006401000000010000000100000001000000010000000100000001000064010000000100000001000000010000000100006401000000010000000100000001000000010000000100000001000064010000000100000001000000010000000100006401000000010000000100000001000000010000");
	change_line("1","5","640100004c010000480100006401000038010000440100005801000048010000440100006401000050010000440100004801000064010000540100004801000040010000540100004401000064010000580100006401000050010000540100003c010000000100000001000000010000000100000001000000010000000100004801000050010000440100004401000064010000640100006401000064010000640100006401000064010000640100006401000064010000640100006401000064010000640100006401000064010000640100006401000064010000640100006401000064010000640100006401000064010000640100006401000064010000");
	change_line("1","6","00010000000100000001000000010000240100003c0100000001000000010000000100000001000000010000000100006401000000010000000100000001000000010000000100000001000000010000640100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000000100000c01000000010000000100006401000000010000480100004c010000000100000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000640400000001000000010000000100000001000000010000000100000001000000010000000100000001000000010000");
	change_line("1","7","640100000001000000010000000100000001000000010000640100000001000064010000000100000001000000010000000100000001000000010000000100006401000000010000000100000001000000010000000100006401000000010000640100000001000000010000000100000001000030010000400100005c0100006401000000010000640100000001000000010000000100000001000000010000640100000001000000010000000100000001000000010000640100000001000064010000000100000001000000010000000100000001000000010000000100006401000000010000000100000001000000010000000100006401000000010000");*/


	activate_sequencer(0,1);
/*	activate_sequencer(1,0);
	activate_sequencer(2,0);
	activate_sequencer(3,0);
	activate_sequencer(4,0);*/


	decorate_sequencer("0");
/*	decorate_sequencer("1");
	decorate_sequencer("2");
	decorate_sequencer("3");
	decorate_sequencer("4");*/


	make_sequencers_mutable();
	make_sequencers_copyable();

	enable_other_buttons();
	enable_loop();
	initAudio();
});
