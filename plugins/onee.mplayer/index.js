/**
 * demo - mplayer
 * 20140415
 * personal musicplayer
 * design by J.do
 * for more ? http://jdoi.net/
 */

onee.define(function () { "use strict";
	// body...
	// is exist
	if ( onee.mplayer ) return;

	// new a onee's log
	var log     = onee.log("mplayer");
	
	// base method
	var extend  = _.extend;
	var each = _.each;
	var getAttr = Sizzle.attr;
	var onEvt = onee.dom.on;
	var appendTo = onee.dom.append;
	var Interface = onee.interface;
	// var 
	// var interface = onee.interface;
	// var audioCtx = 

	(function (uiMain) {

		if ( !uiMain ) return log("Not match mplayer UI.");

		try {
			// Fix up for prefixing
			window.AudioContext = window.AudioContext||window.webkitAudioContext;
			var audioCtx = new AudioContext();
		}
		catch(e) {
			return log('Web Audio API is not supported in this browser');
		}

		/*function proxy (factory, contaxt, param) {

		}*/

		var playlisttpl = '<li><a href="#" mplayer="play" rel={index}>{num}.{name}</a><span mplayer="remove" rel={index}>X</span></li>';
		var rtpl = /\{(.*?)\}/g;
		var rSuffix = /\.\w+$/;

		function mplayer() {

			var ui = this.ui = {};
			var that = this;
			// collect control ui
			each(Sizzle("*[mplayer]", uiMain), function (el) {
				var t = ui[getAttr(el, "mplayer")];
				t ? t.push(el) : (ui[getAttr(el, "mplayer")]=[el]);
			});

			Interface(this, {
				ctx : this.ui.mMeter[0].getContext('2d'),
				// 画板宽度
				cwidth : 570,
				// 画板高度
				cheight : 400,
				// 音频音律数量
				meterNum : 100,
				// 播放状态
				playing : !1,
				// 当前播放
				currentPlay : 0,
				// 异步读取本地文件 #https://developer.mozilla.org/zh-CN/docs/DOM/FileReader
				fread : new FileReader()
			});

			onEvt(ui.mAdd, "change", function () {
				that.add(this)
			});
			onEvt(ui.mList, "dblclick", function () {
				// log(this)
				that.play(mplayer.playlist[getAttr(this, "rel")].file)
			}, "a[mplayer=play]")

		}
		extend(mplayer.prototype, {
			add : function (el) {
				var _list = "";
				var _adding;
				var _len;
				var _playlist = mplayer.playlist;

				each(el.files, function (file) {
	            	_adding = _playlist[_len = _playlist.length] = {
	            		name : file.name.replace(rSuffix, ""),
	            		file : file
	            	}
	            	_list += playlisttpl.replace(rtpl, function (a, b) {
	            		if (b === "num") return _len+1;
	            		if (b === "index") return _len;
	            		return _adding[b];
	            	});
	            });
				// log(this.ui.mList)
				appendTo(this.ui.mList, _list);
	            // this.
			},
			play : function (file) {
				// 如果fread对象已经存在，且状态为loading，终止它！
				this.fread.readyState === 1 && this.fread.abort();
				// this.fread = new FileReader();
				var that = this;
				// log(fread)
				this.fread.onload = function (e) {
					var fileResult = e.target.result;
					// 解析音频数据流
					audioCtx.decodeAudioData(
						fileResult, 
						function (buffer) {
							that.drawMeter(buffer)
						},
						function(e) {
		                	log('Fail to decode the file!');
		                	log(e)
		            	}
	            	);
				}
				this.fread.onerror = function(e) {
		            log('Fail to read the file!');
		            log(e);
		        };

				this.fread.readAsArrayBuffer(file);
			},
			drawMeter : function (buffer) {

				this.playing = !0;

				var 
					audioBufferSouceNode = audioCtx.createBufferSource(),
					analyser             = audioCtx.createAnalyser(),
					// that              = this,
					meterNum             = this.meterNum,
					ctx                  = this.ctx,
					cwidth               = this.cwidth,
					cheight              = this.cheight,
					//width of the meters in the spectrum;
					meterWidth           = 6,
					capHeight            = 2,
					capStyle             = '#fff',
					capYPositionArray    = [];
		        //connect the source to the analyser
		        audioBufferSouceNode.connect(analyser);
		        //connect the analyser to the destination(the speaker), or we won't hear the sound
		        analyser.connect(audioCtx.destination);
		        //then assign the buffer to the buffer source node
		        audioBufferSouceNode.buffer = buffer;
		        //play the source
		        if (!audioBufferSouceNode.start) {
		            audioBufferSouceNode.start = audioBufferSouceNode.noteOn //in old browsers use noteOn method
		            audioBufferSouceNode.stop = audioBufferSouceNode.noteOff //in old browsers use noteOn method
		        };

		        audioBufferSouceNode.start(0);

				var gradient = ctx.createLinearGradient(0, 0, 0, 300);
		        gradient.addColorStop(1, '#0f0');
		        gradient.addColorStop(0.5, '#ff0');
		        gradient.addColorStop(0, '#f00');
		        // ctx.translate(0, cheight-100);


		        var draw = function() {
		            var array = new Uint8Array(analyser.frequencyBinCount);
		            // console.log(array)
		            analyser.getByteFrequencyData(array);
		            /*if (that.status === 0) {
		                //fix when some sounds end the value still not back to zero
		                for (var i = array.length - 1; i >= 0; i--) {
		                    array[i] = 0;
		                };
		                allCapsReachBottom = true;
		                for (var i = capYPositionArray.length - 1; i >= 0; i--) {
		                    allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
		                };
		                if (allCapsReachBottom) {
		                    cancelAnimationFrame(that.animationId); //since the sound is top and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
		                    return;
		                };
		            };*/
		            var step = Math.round(array.length / meterNum); //sample limited data from the total array
		            ctx.clearRect(0, 0, cwidth, cheight);
		            for (var i = 0; i < meterNum; i++) {
		                var value = array[i * step];
		                if (capYPositionArray.length < meterNum) {
		                    capYPositionArray.push(value);
		                }
		                ctx.fillStyle = capStyle;
		                // console.log(value)
		                //draw the cap, with transition effect
		                if (value < capYPositionArray[i]) {
		                    ctx.fillRect(i * 8, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
		                } else {
		                    ctx.fillRect(i * 8, cheight - value, meterWidth, capHeight);
		                    capYPositionArray[i] = value;
		                };
		                ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
		                ctx.fillRect(i * 8 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
		            }
		            requestAnimationFrame(draw);
		        }
		        draw()
		        // this.animationId = requestAnimationFrame(draw);
			}
		})
		// 静态属性
		extend(mplayer, {
			playlist : []
		});

		return onee.mplayer = new mplayer();

	})(Sizzle("*[mplayer=mMain]")[0]);

}, ["onee.dom", "sizzle", "RequestAnimationFrame"]);