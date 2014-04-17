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

	(function (uiMain, undefined) {

		if ( !uiMain ) return log("Not match mplayer UI.");

		try {
			// Fix up for prefixing
			window.AudioContext = window.AudioContext||window.webkitAudioContext;
			var audioCtx = new AudioContext();
		}
		catch(e) {
			return log('Web Audio API is not supported in this browser');
		}

		// 代理
		function proxy (factory, context, param) {
			return function () {
				factory.call(context||null, param)
			}
		}

/*		setInterval(function () {
			log(audioCtx.currentTime)
		}, 2e3)*/

		function mplayer(options) {

			var ui = this.ui = {};
			var that = this;
			// collect control ui
			each(Sizzle("*[mplayer]", uiMain), function (el) {
				var t = ui[getAttr(el, "mplayer")];
				t ? t.push(el) : (ui[getAttr(el, "mplayer")]=[el]);
			});

			Interface(this, options, {
				ctx : this.ui.meter[0].getContext('2d'),
				// 播放开始的时间戳，包括重新播放/暂停播放
				startTime : 0,
				// 状态
				status : "stop",
				// 音频缓冲区
				buffer : null
			});

			// 监听添加音乐
			onEvt(ui.add, "change", function () {
				that.add(this)
			});

			// 监听列表播放
			onEvt(ui.list, "dblclick", function () {
				// log(this)
				that.play(getAttr(this, "rel"))
			}, "a[mplayer=play]")

			// 监听功能按钮(播放/暂停/停止/下一首/上一首)
			each(["play", "stop", "next", "prev"], function (fn) {
				onEvt(ui[fn], "click", proxy(that[fn], that));
			});

		}

		var playListTpl = '<li><a href="#" mplayer="play" rel={index}>{num}.{name}</a><span mplayer="remove" rel={index}>X</span></li>';
		var rtpl = /\{(.*?)\}/g;
		var rSuffix = /\.\w+$/;
		extend(mplayer.prototype, {
			add : function (el) {
				// log(el)
				var _list = "";
				var _adding;
				var _len;
				var _playlist = mplayer.playlist;

				each(el.files, function (file) {
	            	_adding = _playlist[_len = _playlist.length] = {
	            		name : file.name.replace(rSuffix, ""),
	            		file : file
	            	}
	            	_list += playListTpl.replace(rtpl, function (a, b) {
	            		if (b === "num") return _len+1;
	            		if (b === "index") return _len;
	            		return _adding[b];
	            	});
	            });
				// log(this.ui.mList)
				appendTo(this.ui.list, _list);
	            // this.
			},
			play : function (index) {

				var file, that = this;
				function onended () {
			        // note: when stop function or playend will disapatch it
			        // i just need it dispatch by playend
		        	if (Math.floor(that.buffer.duration-that.offsetTime) === 0) that.stop()
				}
				// index存在，则清空当前的，直接播放mplayer.playlist[index]
				if ( index !== undefined ) {
					file = mplayer.playlist[that.currentPlay = parseInt(index)].file;
					// 确保清空上一首正在播放的
					that.stop();
				// 否则当status == stop时，则直接播放mplayer.playlist[currentPlay]
				} else if ( that.status === "stop" ) {
					file = mplayer.playlist[that.currentPlay].file;
				// status为pause或者playing时，切换播放/暂停状态即可
				} else {
					if ( that.status === "playing" ) {
						// log(audioCtx.currentTime);
						that.sourceNode.stop(0);
						// pause meter drawer
						that.meterDrawer.pause();
						that.status = "pause"
						// 记录当前暂停位置
						that.offsetTime += audioCtx.currentTime-that.startTime;
					} else if ( that.status === "pause" ) {
						// log(that.sourceNode);
						// 重新获取全局时间戳
						that.startTime = audioCtx.currentTime;
						// log(that.sourceNode)
						// 重新新建音频节点
						that.sourceNode = null;
						that.sourceNode = mplayer.createBufferSource(that.buffer, onended);
						// that.sourceNode.start(0);
						that.sourceNode.start(0, that.offsetTime);
						// goon meter drawer
						that.meterDrawer.goon(that.sourceNode);
						that.status = "playing"
					}
					return
				}

				if ( !file ) return log("Can't find the file.");

				mplayer.fileReader(file, function (result) {
					mplayer.decodeAudio(result, function (buffer) {
						// playing
						that.status = "playing";
						// 从audio context对象获取
						that.startTime = audioCtx.currentTime;

						// 新建音频节点
						that.sourceNode = mplayer.createBufferSource(that.buffer = buffer, onended);
						that.sourceNode.start(0);
				        // sourceNode.onended = proxy(that.stop, that);

						that.meterDrawer = mplayer.meterLab[that.meter](that.ctx, that.sourceNode);
					})
				});
			},
			next : function () {
				// log("nex")
				if ( mplayer.playlist.length === ++this.currentPlay ) {
					this.currentPlay = 0
				}
				this.play(this.currentPlay)
			},
			prev : function () {
				if ( 0 === --this.currentPlay ) {
					this.currentPlay = mplayer.playlist.length-1
				}
				this.play(this.currentPlay)
			},
			stop : function () {
				// log("dododo")
				// 清空音频视图
				if ( this.meterDrawer ) {
					this.meterDrawer.stop();
					delete this.meterDrawer;
				}
				// 清空正在播放的音源
				if ( this.status === "playing" ) {
					this.sourceNode.stop();
					delete this.sourceNode;
					this.status = "stop"
				}
				this.startTime = 0;
				this.offsetTime = 0
			}
		})
		// 静态属性
		extend(mplayer, {
			playlist : [],
			// 新建音频节点
			createBufferSource : function (buffer, onended) {

				var sourceNode = audioCtx.createBufferSource();
		        //then assign the buffer to the buffer source node
		        sourceNode.buffer = buffer;
		        sourceNode.connect(audioCtx.destination);
		        // fix in old browsers
		        if (!sourceNode.start) {
		            sourceNode.start = sourceNode.noteOn;
		            sourceNode.stop = sourceNode.noteOff;
		        }

		        // on end
		        sourceNode.onended = onended;
		    	return sourceNode;
			},
			// 读取本地文件
			fileReader : (function () {
				var isReading = !!0;
				return function ( file, callback ) {

					if ( !isReading && file ) {
						isReading = !!1;
						// 异步读取本地文件 #https://developer.mozilla.org/zh-CN/docs/DOM/FileReader
						var fread = new FileReader();

						fread.onloadend = function (e) {

							isReading = !!0
							fread.readyState === 2 ?
								callback && callback(e.target.result)
							:
								log(e);
							fread = fread.onloadend = null
							
						}

						fread.readAsArrayBuffer(file);
					}

				}
			})(),
			// 解析音频文件
			decodeAudio : (function () {

				var isDecoding = !!0;

				return function (audioData, callback) {

					if ( !isDecoding && audioData ) {

						isDecoding = !!1;
						audioCtx.decodeAudioData(

							audioData,
							// on success
							function (buffer) {
								// end decode
								isDecoding = !!0;
								callback && callback(buffer);
							},
							// on fail
							function(e) {
								isDecoding = !!0;
			                	log('Fail to decode the file!');
			                	log(e)
			            	}
		            	)
					}
				}
			})(),
			// 音频效果库
			meterLab : {
				default : function (ctx, sourceNode) {
					var 
						analyser = audioCtx.createAnalyser(),
						// that           = this,
						meterNum          = 66,
						cwidth            = ctx.canvas.width,
						cheight           = ctx.canvas.height,
						//width of the meters in the spectrum;
						meterWidth        = 6,
						capHeight         = 2,
						capStyle          = '#fff',
						capYPositionArray = [],
						autoAnimationHandle;

					//connect the source to the analyser
			        sourceNode.connect(analyser);
			        // set style of bar
					var gradient = ctx.createLinearGradient(0, 0, 0, 300);
			        gradient.addColorStop(1, '#0f0');
			        gradient.addColorStop(0.5, '#ff0');
			        gradient.addColorStop(0, '#f00');
			        // ctx.translate(0, cheight-100);

			        var _outer_ = function _inner_ () {

				        autoAnimationHandle = requestAnimationFrame( _inner_ );

				        var array = new Uint8Array(analyser.frequencyBinCount);
			            analyser.getByteFrequencyData(array);
			            
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
			            return _inner_

				    }();

				    return {
				    	stop : function () {
				    		cancelAnimationFrame(autoAnimationHandle);
				    		ctx.clearRect(0, 0, cwidth, cheight);
				    		autoAnimationHandle = null;
				    		sourceNode.disconnect(analyser);
				    		analyser.disconnect(audioCtx.destination);
				    		analyser = null;
				    		gradient = null
				    	},
				    	pause : function () {
				    		cancelAnimationFrame(autoAnimationHandle);
				    	},
				    	goon : function (sourceNode) {
				    		//reconnect the source to the analyser again
				    		sourceNode.connect(analyser);
				    		_outer_();
				    	}
				    };

				}
			}
		});


		return onee.mplayer = new mplayer({
			// 当前播放
			currentPlay : 0,
			// 已播放时间-针对每一首音乐
			offsetTime : 0,
			// 音频仪表效果
			meter : "default",
		});

	})(Sizzle("*[mplayer=main]")[0]);

}, ["onee.dom", "sizzle", "RequestAnimationFrame"]);