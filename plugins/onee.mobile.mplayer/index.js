/**
 * demo - mplayer
 * 20140415
 * personal musicplayer
 * design by J.do
 * for more ? http://jdoi.net/
 */

;(function (global, undefined) { "use strict";
	// base method
	var extend  = _.extend;
	var each = _.each;
	var map = _.map;
	// var indexOf = _.indexOf;
	var random = _.random;
	var slice = Array.prototype.slice;
	var EvtSys = $(document);

	// 公共EQ对应表
	global.COMEQ = {}
	/*global.COMEQ = [
		{key : "31hz", frequency : 31},
		{key : "62hz", frequency : 62},
		{key : "125hz", frequency : 125},
		{key : "250hz", frequency : 250},
		{key : "500hz", frequency : 500},
		{key : "1khz", frequency : 1e3},
		{key : "2khz", frequency : 2e3},
		{key : "4khz", frequency : 4e3},
		{key : "8khz", frequency : 8e3},
		{key : "16khz", frequency : 16e3}
	];*/

	global.audio = (function (factory) {
		// body...

		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;

		return AudioContext ? factory(new AudioContext()) : null;
		// if ( AudioContext ) {
		// 	return factory(new AudioContext());
		// } else console.log( 'Web Audio API is not supported in this browser' );

	})(function (ctx) {
		// body...
		var _process_, _onendCallback_ = [];

		// 统一操作滤波器节点（连接/断开）
		function _bf_ (action) {
			action = action || "connect";
			this.source.connect(COMEQ["f31"]);
	    	var tmpbf;
	    	each(COMEQ, function ( bf, k ) {
	    		if ( tmpbf ) tmpbf.connect(bf);
	    		tmpbf = bf;
	    	});
	    	tmpbf.connect(this.analyser);
	    	tmpbf = null;
		}

		function _onended (player) {
			// note: when stop function or playend will disapatch it
	        // i just need it dispatch by playend
	        // 当结束时
	    	if (Math.floor(player.buffer.duration) <= Math.floor(player.offsetTime)) {
	    		player.stop();
	    	}

	    	// connect biquadFilter node
			_bf_.call(this, "disconnect");
			// 重新连接音频PProcessor节点
	        this.analyser.disconnect(this.processor);
	        // 重新连接到终端
	        this.processor.disconnect(ctx.destination);
	        // reset audio source node
	        this.source = null;
	        // handle callback
	        var onendcaller = _onendCallback_.shift();
	        typeof onendcaller === "function" && onendcaller()
		}

		return {
			ctx : ctx,
			analyser : ctx.createAnalyser(),
			// processor : _processor,
			rebuild : function  (player) {
				// build buffer source node
				this.source = ctx.createBufferSource();
				// fix in old browsers
		        if (!this.source.start) {
		            this.source.start = this.source.noteOn;
		            this.source.stop = this.source.noteOff;
		        }
		        // on end
		        var that = this;
		        this.source.onended = function () {
		        	_onended.call(that, player)
		        }
		        // processor node has to rebuild
		        // `inputBuffer` still exist when connect audio context nex time
		        this.processor = ctx.createScriptProcessor(4096, 1, 1);
		        this.processor.onaudioprocess = function (e) {
					var input = e.inputBuffer.getChannelData(0);
					var output = e.outputBuffer.getChannelData(0);
					// input -> output
					for(var i=0, len = input.length; i<len; i++) output[i] = input[i];

					_process_(e);
				};
				// connect biquadFilter node
				_bf_.call(this, "connect");
				// 连接音频Processor节点
		        this.analyser.connect(this.processor);
		        // 重新连接到终端
		        this.processor.connect(ctx.destination);

			},
			onaudioprocess : function(callback) {

				_process_ = callback || function () {};

			},
			onended : function (callback) {
				typeof callback === "function" && _onendCallback_.push(callback);
			}
		}
	});

	// 
	if ( !audio ) return console.log('Web Audio API is not supported in this browser');
	
	// 解析音频文件
	var decodeAudio = (function () {

		var isDecoding = !!0;

		return function (audioData, callback) {

			if ( !isDecoding && audioData ) {

				isDecoding = !!1;
				audio.ctx.decodeAudioData(

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
	                	console.log('Fail to decode the file!');
	                	console.log(e)
	            	}
            	)
			}
		}
	})();
	function compliePlaylistNode (index, dat) {
		return TPL_ITEM.replace(rtpl, function (a, b) {
    		if (b === "index") return index;
    		return dat[b];
    	})
	}

	// 音频效果库
	// 扩展格式
	// meterLibrary.meterxxx = function (ctx, source) {
	//	your meter logic...
	//	return {
	//		when music stop
	//		stop : function(){},
	//		when music pause
	//		pause : function(){},
	//		when music go on
	//		goon : function (){}
	//	}
	//}
	var meterLibrary = {
		default : function (ctx, analyser) {
			var 
				// that           = this,
				cwidth            = ctx.canvas.width,
				cheight           = ctx.canvas.height-2,
				meterNum          = cwidth/8|0,
				//width of the meters in the spectrum;
				meterWidth        = 6,
				capHeight         = 2,
				capStyle          = '#ffab3f',
				capYPositionArray = [],
				autoAnimationHandle;

	        // set style of bar
			var gradient = ctx.createLinearGradient(0, -300, 0, 0);
	        gradient.addColorStop(1, '#5d9d7b');
	        gradient.addColorStop(0.7, '#aeedcb');
	        gradient.addColorStop(0, '#ffab3f');

	        // 先保存当前状态，以免下次translate递增
	        ctx.save();
	        ctx.translate(0, cheight)
	        // ctx.translate(0, cheight-100);

	        var _outer_ = function _inner_ () {

		        autoAnimationHandle = requestAnimationFrame( _inner_ );

		        var array = new Uint8Array(analyser.frequencyBinCount);
		        // var meterNum = array.length;
	            analyser.getByteFrequencyData(array);
	            
	            var step = Math.round(array.length / meterNum); //sample limited data from the total array
	            ctx.clearRect(0, 0, cwidth, -cheight);
	            for (var i = 0; i < meterNum; i++) {
	                var value = array[i*step];
	                var rwidth = i*8;
	                if (capYPositionArray.length < meterNum) {
	                    capYPositionArray.push(value);
	                }
	                // log(value)
					ctx.fillStyle = capStyle;
					// console.log(value)
					//draw the cap, with transition effect
					if (value < capYPositionArray[i]) {
					    ctx.fillRect(rwidth, -capYPositionArray[i]--, meterWidth, capHeight);
					} else {
					    ctx.fillRect(rwidth, -value, meterWidth, capHeight);
					    capYPositionArray[i] = value;
					};
	                ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
	                ctx.fillRect(rwidth, -value+capHeight, meterWidth, cheight); //the meter
	            }
	            return _inner_

		    }();

		    return {
		    	stop : function () {
		    		cancelAnimationFrame(autoAnimationHandle);
		    		ctx.clearRect(0, 2, cwidth, -cheight);
		    		autoAnimationHandle = null;
		    		// source.disconnect(analyser);
		    		// 每次暂停后就恢复translate之前
		    		ctx.restore();
		    		// free memory
		    		gradient = null
		    	},
		    	pause : function () {
		    		cancelAnimationFrame(autoAnimationHandle);
		    	},
		    	goon : _outer_
		    }
		},
		wave : function (ctx, analyser) {

			var autoAnimationHandle,
				cwidth = ctx.canvas.width,
				cheight = ctx.canvas.height;

			var _outer_ = function _inner_ () {

		        autoAnimationHandle = requestAnimationFrame( _inner_ );

		        var array = new Uint8Array(analyser.frequencyBinCount);
		        // var meterNum = array.length;
	            analyser.getByteTimeDomainData(array);

	            ctx.clearRect(0, 0, cwidth, cheight);
	            ctx.beginPath();
	            for (var i = 0, len = array.length; i < len; i++) {
	                var data = array[i];
	                ctx.lineTo(i, (255 - data)/255 * cheight);
	            }
	            ctx.strokeStyle = "#ffab3f"
	            ctx.stroke();
	            ctx.beginPath();
	            var y = cheight/2 - 0.5; //出现0.5才能让线条以1px宽度显示
	            ctx.moveTo(0.0, y);
	            ctx.lineTo(cwidth, y);
	            ctx.strokeStyle = '#5d9d7b';
	            ctx.stroke();
	            return _inner_

		    }();

			return {
		    	stop : function () {
		    		cancelAnimationFrame(autoAnimationHandle);
		    		ctx.clearRect(0, 2, cwidth, cheight);
		    		autoAnimationHandle = null;
		    	},
		    	pause : function () {
		    		cancelAnimationFrame(autoAnimationHandle);
		    	},
		    	goon : _outer_
		    }
		}
	}
	var metaCtrl = function () {
		// 读取音频meta数据
		var cacheMetaData = JSON.parse(localStorage.getItem("jplayer-music-meta") || "{}");
		var metaurl = './meta.php';

		return {
			get : function (name, callback) {
				var item = cacheMetaData[name];
				if ( item ) callback(item);
				else {
					$.getJSON(metaurl+'?key='+encodeURIComponent(name), function (J) {
						callback(J.data.trackList ? cacheMetaData[name] = J.data.trackList[0] : {});
					})
				}
			},
			save : function () {
				localStorage.setItem("jplayer-music-meta", JSON.stringify(cacheMetaData))
			}

		}

	}();

	// 资源缓存器
	// var CACHE = [];

	// fetch audio file
	// decode audio
	function fetch ( item, callback ) {
		if ( item.buffer ) {
	
			callback && callback(item.buffer)

		} else {

			var request = new XMLHttpRequest();
			var that = this;
			request.open('GET', item.url, true);
			request.responseType = 'arraybuffer';

			// Decode asynchronously
			request.onload = function() {
				// copy buffer
				decodeAudio(request.response, function (buffer) {
					// that.buffer = buffer;
					callback && callback(item.buffer = buffer);
					request = request.onload = null;
				});
				/*metaCtrl.get(url, function(meta) {
					that.tiggle("meta", meta)
				});*/
 			}
 			that.trigger(that.status = "loading");
 			request.onprogress = function(e) {
				if(e.lengthComputable) {
					that.trigger(that.status = "progress", e);
				}
			}
			request.send();

		}
	}

	// re connect audio context
	// call fetch
	// start source
	// call metaCtrl
	// initialize meterDrawer
	function start ( item ) {

		var that = this;

		audio.rebuild(that);
		// start immediately
		audio.source.start(0);
		// fetch source buffer
		fetch.call(that, item, function (buffer) {

			audio.source.buffer = that.buffer = buffer;
			// start frequency animation
			that.meterDrawer = meterLibrary[that.meter](that.ctx, audio.analyser);

			that.trigger("start");

			that.status = "playing";

			// fetch meta info
			metaCtrl.get(item.name, function(meta) {
				that.trigger("meta", meta);
			});
		});
	}

	function player(options) {

		// var ui = this.ui = {};
		var that = this;

		// collect control ui
		$("[data-player]").each(function (k, el) {
			var name = el.dataset.player;
			that["UI"+name] = el;
			that["$"+name] = $(el)
		});

		if ( !that.UIbody ) return log("Can not match player `body`");

		this.ctx = this.UIcanvas.getContext('2d');

		this.status = "stop";
		// 已播放时间-针对每一首音乐
		this.offsetTime = 0;
		// playlist
		this.cache = [];

		// this._startTime = 0;
		// this._lastPauseTime = 0;
		// 当前播放
		this.current = 0;
		// 音频仪表效果
		this.meter = options.meter || "wave";
		// 播放模式(单曲循环-loopone/列表循环-loopall/随机播放-random)
		// this.playModel = options.playModel || "loopall";
		// 音量
		// this.volume = options.volume || 0.8;
		// 均衡器列表
		var eq = this.EQ = options.EQ || {};

		(function () {

			var _lastStartTime = 0;
			var _offsetTime = 0;
			var _ctx = audio.ctx;

			// build biquadFilter node
			each([31,62,125,250,1000,2000,4000,8000,16000], function (freq, k) {
				// 初始化滤波器节点
				var index = 'f'+freq;
				var biquadFilter = COMEQ[index] = _ctx.createBiquadFilter();

				biquadFilter.gain.value = eq[index] = eq[index] || 0;
				biquadFilter.type = "peaking";
				biquadFilter.frequency.value = freq;

			});

			audio.onaudioprocess(function (e) {
				// 当peocessor节点连接上audio context，就会触发该事件
				// 这不科学呀，自建playing标示
				if ( that.status === "playing" ) {
					// record offsetTime
					that.offsetTime = _offsetTime + (0|_ctx.currentTime) - _lastStartTime;
					// trigger event
					that.trigger(that.status = "playing")
				}
			})

			that.on("start replay", function () {

				_lastStartTime = 0|_ctx.currentTime;
				// console.log(_lastStartTime)
			})
			.on("pause", function () {
				// 记录当前播放时间
				_offsetTime = that.offsetTime

			})
			.on("stop", function () {
				// reset count
				_lastStartTime = _offsetTime = that.offsetTime = 0;
			});

		}());
	}


	// 继承事件管理器
	extend(player.prototype, {
		// inherit form zepto
		on : function (type, callback) {
			EvtSys.on(type, callback)
			return this
		},
		off : function (type) {
			EvtSys.off(type)
			return this
		},
		trigger : function (type, data) {
			EvtSys.trigger(type, data)
			return this
		},
		play : function (index) {

			var item, that = this, cache = that.cache;
			// 如果播放列表为空
			if ( cache.length === 0 ) return;
			// index存在，则清空当前的，直接播放CACHE[index]
			if ( index !== undefined ) {
				if ( that.status === "pause" || that.status === "playing" ) {
					// waitting for onended event dispatch
					audio.onended(function () {
						start.call(that, item = cache[that.current = index])
					});
					return that.stop();

				} else item = cache[that.current = index];

			// 否则当status == stop时，则直接播放mplayer.playlist[currentPlay]
			} else if ( that.status === "stop" ) {
				item = cache[that.current];
			// status为pause或者playing时，切换播放/暂停状态即可
			} else {
				// 暂停
				if ( that.status === "playing" ) {

					that.pause()

				// 继续播放
				} else if ( that.status === "pause" ) {
					// re build the audio context
					audio.rebuild(that);
					//
					audio.source.buffer = that.buffer;
					// start
					audio.source.start(0, that.offsetTime);
					// goon meter drawer
					that.meterDrawer && that.meterDrawer.goon();

					// 特有事件
					// 用于暂停后，再次播放
					that.trigger("replay");
					that.status = "playing";

				}

				return this
			}

			if ( !item ) return log("Can't find the music.");

			// call play function
			start.call(that, item);

		},
		pause : function () {
			// pause meter drawer
			this.meterDrawer && this.meterDrawer.pause();
			this.trigger(this.status = "pause");
			// 放到最后，涉及到清理ctx
			audio.source.stop(0);
		},
		stop : function () {
			// 清空音频视图
			this.meterDrawer.stop();
			delete this.meterDrawer;

			this.trigger(this.status = "stop");
			audio.source.stop(0);
		},
		next : function () {

			// 当为随机播放模式，下一首也为随机
			if ( this.playModel === "random" ) return this.random();

			// var prevIndex = this.currentPlay;

			if ( this.cache.length <= ++this.current ) {
				this.current = 0
			}
			this.play(this.current)

		},
		prev : function () {

			// 当为随机播放模式，上一首也为随机
			if ( this.playModel === "random" ) return this.random();

			// var prevIndex = this.currentPlay;

			if ( 0 > --this.current ) {
				var len = this.cache.length;
				this.current = len === 0 ? 0 : len-1;
			}
			this.play(this.current)
		},
		random : function () {
			// 随机且不与上一首相同
			// var prevIndex = this.currentPlay;
			while(!!1) {
				var len = CACHE.length;
				// 当播放列表数量小于3时，不需要经过random随机函数
				// 提高效率
				if ( len === 0 ) break;
				if ( len === 1 ) {
					this.currentPlay = 0;
					break;
				}
				if ( len === 2 ) {
					this.currentPlay = this.currentPlay === 0 ? 1 : 0;
					break
				}
				var index = random(len-1)
				if ( this.currentPlay !== index ) {
					this.currentPlay = index;
					break
				}
			}
			this.play(this.currentPlay)
		},
		eq : function (freq, value) {
			var biquadFilter = COMEQ[freq];
			if ( biquadFilter ) {
				this.EQ[freq] = biquadFilter.gain.value = value;
			}
		},
		/*remove : function (index) {
			var playlist = this.playlist;
			// 索引不存在，则移除全部数据
			if ( index === undefined ) {
				// remove from playlist
				playlist = [];
				// clear ui
				innerHTML(this.ui.list, "");
				// stop player
				this.stop();
			// 索引存在且在有效范围，则移除对应的数据
			} else if ( index >-1 && index < playlist.length ) {
				// remove from playlist
				var file = playlist.splice(index,1)[0];
	            // 同步cachePlayListName
	            cachePlayListName.splice(index,1);
				// 若删除当前播放音乐，则播放播放下一首
				if ( this.currentPlay === index ) {
					// 设置当前播放为
					// this.currentPlay = 0;
					this.next()
				}
				// rebuild playlist ui
				var list = this.ui.list;
				innerHTML(list, "");
				each(playlist, function (item, k) {
					item.node = appendTo(list, compliePlaylistNode({index : k, name : item.name}))
	            });
	            // 重新标示当前播放
	            addClass(playlist[this.currentPlay].node, "active");
	            // 触发onlistchange事件
	            // this.onlistchange();
	            this.trigger("onlistchange");
				// clear entry
				FileSys && FileSys.rm(file.fullpath);
				// free memory
				file = null
			}
		},*/
		setMeter : function (meter) {
			if (meter !== this.meter) {
				if ( this.meterDrawer ) {
					this.meterDrawer.stop();
					delete this.meterDrawer;
				}
				if ( (this.meter=meter) && (meter=meterLibrary[meter]) && this.status !== "stop" ) {
					this.meterDrawer = meter(this.ctx, this.analyser);
				}
			}
		}
	});
	// alert(localStorage.getItem("jplayer-user-custom")||"{}");
	global.JPlayer = new player(JSON.parse(localStorage.getItem("jplayer-user-custom")||"{}"));

	// 扩展实例化后的对象
	extend(global.JPlayer, {
		// 解析歌词文件，有UI层根据需要自行调用
		// 
		// [00:13.17]朋友已走
		// [00:15.53]刚升职的你举杯到凌晨还未够
		// [00:21.67]用尽心机拉我手
		// [00:25.84]缠在我颈背后
		// ==>
		// [
		//    {s : "13.17", tx : "朋友已走"},
		//    {s : "15.53", tx : "刚升职的你举杯到凌晨还未够"},
		//    {s : "21.67", tx : "用尽心机拉我手"},
		//    {s : "25.84", tx : "缠在我颈背后"}
		// ]
		parseLyric : function () {
			var rLine = /\[\d\d:\d\d\.\d\d\][^\r\n]+/g;
			var rFormatTime = /\[(\d\d):([\d\.]+)/;
			var sortBy = _.sortBy;
			var getFile = $.get;
			// [01:12.85 => 72.85
			function t2second (t) {
				return t.replace(rFormatTime, function (all,m,s) {
					return parseInt(m)*60+parseFloat(s)
				})
			}
			function cmcall (callback, lrcs) {
				callback && callback(lrcs)
			}
			return function (meta, callback) {
				// 如果meta存在parsedLrc字段
				// 则该歌词已被解析过，直接使用即可
				if (meta.parsedLrc) {
					cmcall(callback, meta.parsedLrc);
				// 如果不存在
				// 先异步加载原始`.lrc`文件
				// 再按照要求的格式解析完成
				// 最后缓存到本地
				} else {
					var lrcs = [];
					getFile('./lyric.php?file='+meta.lyric, function (lrc) {
						
						lrc.replace(rLine, function (line) {
							// console.log(line)
							if (line) {
								var splitIndex = line.lastIndexOf("]")+1;
								// 分割时间
								var times = line.substring(0,splitIndex).split(']');
								// 分割歌词
								var text = line.substring(splitIndex);
								// console.log(times)
								each(times, function (time, k) {
									// console.log(time)
									if ( time ) {
										lrcs[lrcs.length] = {
											s : parseInt(t2second(time)),
											tx: text
										}
									}
								})
							}
						});
						// 根据时间`s`重排
						cmcall(callback, meta.parsedLrc = sortBy(lrcs, 's'));
					})
				}
			}
		} (),
		meters : ["default", "none"]
	});

	// 监听浏览器关闭动作
	/*onEvt(window, "beforeunload", function () {
		// log("beforeunload")
		var cfg = onee.mplayer;
		// 存储当前用户习惯
		localStorage.setItem("mplayer-user-custom", JSON.stringify({
			// currentPlay : cfg.currentPlay,
			playModel : cfg.playModel,
			meter : cfg.meter,
			volume : cfg.volume,
			EQ : cfg.EQ
		}));
		// 保存meta数据
		metaCtrl.save()

	});*/

})(window);