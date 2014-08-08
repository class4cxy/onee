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
	var map = _.map;
	var indexOf = _.indexOf;
	var random = _.random;
	var slice = Array.prototype.slice;
	var EvtSys = $(document);
	// var getAttr = Sizzle.attr;
	// var setAttr = onee.dom.setAttr;
	// var setClass = onee.dom.setClass;
	// var addClass = onee.dom.addClass;
	// var removeClass = onee.dom.delClass;
	// var onEvt = onee.dom.on;
	// var fireEvt = onee.dom.fire;
	// var appendTo = onee.dom.append;
	// var setCSS = onee.dom.css;
	// var innerHTML = onee.dom.html;
	// var innerTEXT = onee.dom.text;
	// var removeNode = onee.dom.remove;
	var Interface = onee.interface;
	// var EvtSys = onee.evt();
	// var GG = onee.dom.find;
	// var onKey = onee.dom.key.on;

	/*$player = $("*[mplayer=main]")
	if ( !$player ) return log("Not match mplayer UI.");*/

	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		var audioCtx = new AudioContext();
	}
	catch(e) {
		return log('Web Audio API is not supported in this browser');
	}

	// 用于快速查询重复音频
	// 增加/删除操作都要同步到该缓存
	var cachePlayListName = [];
	// var rSuffix = /\.\w+$/;
	var rtpl = /\{(.*?)\}/g;
	var TPL_ITEM = '<li mplayer="play" class="ui-border-1px mb-music-list-item" data-index="{index}" data-name="{name}" data-url="{url}">{name}</li>';
	var TPL_EQITEM = '<p><input type="range" min="-30" max="30" value="{gain}" onwheel="1"><span>{key}</span></p>';

	// 代理
	function proxy (factory, context, param) {
		return function () {
			factory.call(context||null, param)
		}
	}

	// 当播放结束，用于相对应播放模式的逻辑控制
	function onPlayEnd () {
		// note: when stop function or playend will disapatch it
        // i just need it dispatch by playend
    	if (this.buffer.duration<=this.offsetTime) {
    		this.stop();
    		switch( this.playModel ) {
    			case "loopone" :
        			this.currentPlay--;
        			this.next();
    			break;
    			case "loopall" :
    				this.next();
    			break;
    			case "random" :
    				this.random();
    			break;
    		}
    	}
	}

	// 解析音频文件
	var decodeAudio = (function () {

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
	})();
	function compliePlaylistNode (index, dat) {
		return TPL_ITEM.replace(rtpl, function (a, b) {
    		if (b === "index") return index;
    		return dat[b];
    	})
	}

	// 音频效果库
	// 扩展格式
	// meterLibrary.meterxxx = function (ctx, sourceNode) {
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
				capStyle          = '#fff',
				capYPositionArray = [],
				autoAnimationHandle;

	        // set style of bar
			var gradient = ctx.createLinearGradient(0, -300, 0, 0);
	        gradient.addColorStop(1, '#0f0');
	        gradient.addColorStop(0.5, '#ff0');
	        gradient.addColorStop(0, '#f00');

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
		    		// sourceNode.disconnect(analyser);
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
		}
	}
	var metaCtrl = function () {
		// 读取音频meta数据
		var cacheMetaData = JSON.parse(localStorage.getItem("mplayer-music-meta") || "{}");
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
				localStorage.setItem("mplayer-music-meta", JSON.stringify(cacheMetaData))
			}

		}

	}();

	// 公共EQ对应表
	var COMEQ = [
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
	];
	// 重新串联各音频节点(sourceNode-analyserNode-gainNode-context.destination)
	// 每次重新播放都会触发该进程
	function reConnectSourceNode () {
		// 不知道新建会不会之前造成什么不良反应
		// 手动清掉
		if (this.sourceNode) this.sourceNode = null;
		if (this.BassSourceNode) this.sourceNode = null;
		if (this.sourceNode) this.sourceNode = null;

		// 新建BufferSource节点
		this.sourceNode = audioCtx.createBufferSource();
		//then assign the buffer to the buffer source node
		this.sourceNode.buffer = this.buffer;
		// fix in old browsers
        if (!this.sourceNode.start) {
            this.sourceNode.start = this.sourceNode.noteOn;
            this.sourceNode.stop = this.sourceNode.noteOff;
        }

        // on end
        this.sourceNode.onended = proxy(onPlayEnd, this);

        var len = 10, nex;
        // 重新连接EQ均衡器
		this.sourceNode.connect(COMEQ[len-1].biquadFilter);
		while(len--) {
			nex = len-1;
			nex > -1 && COMEQ[len].biquadFilter.connect(COMEQ[nex].biquadFilter)
		}
		// 连接音频分析节点
		COMEQ[0].biquadFilter.connect(this.analyserNode);

		// 重新连接音频分析节点
        // this.sourceNode.connect(this.analyserNode);
		// 重新连接音频增益节点
        this.analyserNode.connect(this.gainNode);
        // 重新连接到终端
        this.gainNode.connect(audioCtx.destination);

	}

	function mplayer(options) {

		// var ui = this.ui = {};
		var that = this;

		// collect control ui
		$("[data-player]").each(function (k, el) {
			var name = el.dataset.player;
			that["UI"+name] = el;
			that["$"+name] = $(el)
		});

		if ( !that.UIbody ) return log("Can not match player `body`");

		Interface(this, options, {
			ctx : this.UImeter.getContext('2d'),
			// 状态
			status : "stop",
			// 已播放时间-针对每一首音乐
			offsetTime : 0,
			// 当前播放
			current : 0,
			// 音频仪表效果
			meter : "default",
			// 播放模式(单曲循环-loopone/列表循环-loopall/随机播放-random)
			playModel : "loopall",
			// 音频缓冲区
			buffer : null,
			// 音频增益控制节点/控制音量
			gainNode : audioCtx.createGain(),
			// 音频分析节点
			analyserNode : audioCtx.createAnalyser(),
			// 音量
			volume : 0.8,
			// 当解析音频文件事件
			onDecodingAudio : function () {},
			// 均衡器列表
			EQ : [0,0,0,0,0,0,0,0,0,0],
			// 播放列表
			playlist : []
		});

		// 初始化EQ控件
		each(COMEQ, function (item, k) {
			// 初始化滤波器节点
			var biquadFilter = item.biquadFilter = audioCtx.createBiquadFilter();
			var gain = biquadFilter.gain.value = that.EQ[k]||0;
			biquadFilter.type = "peaking";
			biquadFilter.frequency.value=item.frequency;

			/*onEvt(
				appendTo(ui.eqlist, TPL_EQITEM.replace(rtpl, function (a, b) {
					if (b === 'gain') return gain;
					return item[b];
				})),
				"input",
				function () {
					// log(this)
					var input = GG("input", this)[0];
					biquadFilter.gain.value = that.EQ[k] = parseFloat(input.value)
				}
			)*/
		})
		// 监听列表播放操作
		that.$body.on("tap", "li[data-player=play]", function () {

			that.play(this.dataset.index)

		})
		.on({
			// 监听播放进度条控件改变后事件
			change: function () {
				// 先暂停，后播放
				that.offsetTime = offsetTime = parseInt(this.value)
				that.play().play();
				this.isChanging = !!0;
			},
			// 监听播放进度条控件改变中事件
			input : function () {
				this.isChanging = !!1;
			}
		}, "input[data-player=progress]")
		// 监听下一首事件
		.on("tap", "a[data-player=next]", proxy(that.next, that))
		// 监听上一首事件
		.on("tap", "a[data-player=prev]", proxy(that.prev, that))
		// 监听播放暂停事件
		.on("tap", "a[data-player=play]", proxy(that.play, that));

		// 增加额外方法
		/*that.UIprogress.enable = function () {
			// log(this)
			var max = 0|that.buffer.duration
			setAttr(this, "max", 0|that.buffer.duration);
			setAttr(UIprogressbg, "max", 0|that.buffer.duration);
		}*/


		that.pause = function () {

			this.sourceNode.stop(0);
			// pause meter drawer
			this.meterDrawer && this.meterDrawer.pause();
			// 记录当前播放时间
			// offsetTime = this.offsetTime;
			// uodate status and triggle event
			that.triggle(this.status = "pause");
		}
		that.stop = function () {
			// 清空音频视图
			if ( this.meterDrawer ) {
				this.meterDrawer.stop();
				delete this.meterDrawer;
			}
			// 清空正在播放的音源
			if ( this.sourceNode ) {
				this.sourceNode.stop();
				delete this.sourceNode;
				this.status = "stop"
			}
			// uodate status and triggle event
			that.triggle(this.status = "stop");
			// 重置播放进度条 重置播放时间
			// this.offsetTime = 0;
			// that.UIprogressbg.value = that.UIprogress.value = offsetTime = this.offsetTime = 0;
		}

		// 更新播放进度
		// var duration;
		// var startTime = 0;
		// var offsetTime = 0;
		// 改用setInterval
		// 由于requestAnimationFrame在窗口最小化/不在当前窗口时
		// 执行频率会降低，导致时间计算不准确
		/*setInterval(function () {
			// update play progress ui, 取整
			// 当用户改变ui.progress的进度时
			// 暂停追随播放进度，changing是自定义一属性
			if ( !that.$progress.isChanging && that.status === "playing" ) {
				that.offsetTime = offsetTime+audioCtx.currentTime-startTime;
				that.triggle("onplaying", that.$progressbg.value = that.$progress.value = 0|that.offsetTime)
				// that.offsetTime
			} else startTime = 0|audioCtx.currentTime;

		}, 13);*/
	}
	function fetch (item, callback) {
		if ( item.buffer ) {

			callback && callback(item.buffer)

		} else {

			var request = new XMLHttpRequest();
			request.open('GET', item.url, true);
			request.responseType = 'arraybuffer';

			request.onload = function() {
				// copy buffer
				decodeAudio(request.response, function (buffer) {
					callback && callback(item.buffer = buffer);
					request = request.onload = null;
				})
			}
			request.send();

		}
	}
	// 资源缓存器
	var CACHE = [];
	// 继承事件管理器
	extend(mplayer.prototype, {
		// inherit form zepto
		on : function (type, callback) {
			EvtSys.on(type, callback)
			return this
		},
		off : function (type) {
			EvtSys.off(type)
			return this
		},
		triggle : function (type, data) {
			EvtSys.trigger(type, data)
			return this
		},
		add : function (sources) {
			var that = this;
			if (sources.length && typeof sources === "object") {
	            that.$list.html(map(CACHE = sources, function (source, k) {
	            	return compliePlaylistNode(k, source)
	            }).join(''));
			}
			return that
		},
		play : function (index) {

			var item, that = this;
			// 如果播放列表为空
			if ( CACHE.length === 0 ) return;
			// index存在，则清空当前的，直接播放CACHE[index]
			if ( index !== undefined ) {
				item = CACHE[index];
				// 确保清空上一首正在播放的
				that.stop();
			// 否则当status == stop时，则直接播放mplayer.playlist[currentPlay]
			} else if ( that.status === "stop" ) {
				item = CACHE[that.current];
			// status为pause或者playing时，切换播放/暂停状态即可
			} else {
				// 暂停
				if ( that.status === "playing" ) {

					that.pause()

				// 继续播放
				} else if ( that.status === "pause" ) {
					// 重新获取全局时间戳
					// that.startTime = audioCtx.currentTime;
					// log(that.sourceNode)
					reConnectSourceNode.call(that);
					// that.sourceNode.start(0);
					that.sourceNode.start(0, that.offsetTime);
					// goon meter drawer
					that.meterDrawer && that.meterDrawer.goon();
					that.status = "playing";
					that.triggle("start");
					// addClass(that.ui.play, that.status = "playing");
				}

				return this
			}

			if ( !item ) return log("Can't find the music.");

			// update item ui
			// addClass(playlist[that.currentPlay].node, "active");
			// prevIndex !== undefined && removeClass(playlist[prevIndex].node, "active");

			// 触发decoding
			// that.onDecodingAudio();
			// if ( !item.buffer ) {
			fetch(item, function (buffer) {
				// playing
				that.triggle("start");
				that.status = "playing";
				that.buffer = buffer;
				// that.onDecodingAudio.onDone();
				// 移除临时回调
				// delete that.onDecodingAudio.onDone;

				// 初始化播放进度条
				// that.UIprogress.enable()
				// that.ui.progress[0].enable()

				// 新建音频节点
				reConnectSourceNode.call(that);
				// that.$proxyplay.trigger("touchstart");
				// that.sourceNode = mplayer.createBufferSource(that.buffer = buffer, proxy(mplayer.onPlayEnd, that));
				// that.sourceNode.start(0);
		        // sourceNode.onended = proxy(that.stop, that);

		        // that.setMeter(that.meter);
		        try{
		        	that.meterDrawer = meterLibrary[that.meter](that.ctx, that.analyserNode);
		        } catch(e){}

				// 获取meta数据
				/*metaCtrl.get(item.name, function(meta) {
					that.triggle("meta", meta)
				});*/
			});

			// alert(that.sourceNode)
			// }

			/*fileReader(item.file, function (result) {
				decodeAudio(result, function (buffer) {
					// playing
					that.triggle("onstart");
					that.status = "playing";
					that.buffer = buffer;
					that.onDecodingAudio.onDone();
					// 移除临时回调
					delete that.onDecodingAudio.onDone;

					// 初始化播放进度条
					that.ui.progress[0].enable()

					// 新建音频节点
					reConnectSourceNode.call(that);
					// that.sourceNode = mplayer.createBufferSource(that.buffer = buffer, proxy(mplayer.onPlayEnd, that));
					that.sourceNode.start(0);
			        // sourceNode.onended = proxy(that.stop, that);

			        // that.setMeter(that.meter);
			        try{
			        	that.meterDrawer = meterLibrary[that.meter](that.ctx, that.analyserNode);
			        } catch(e){}

					// 获取meta数据
					metaCtrl.get(item.name, function(meta) {
						that.triggle("onmetacoming", meta)
					});
				})
			});*/

		},
		/*playOnLine : function () {
			var that = this;
			that.triggle("start");
			that.status = "playing";
			that.ui.progress[0].enable()

			// 新建音频节点
			reConnectSourceNode.call(that);
			// that.sourceNode = mplayer.createBufferSource(that.buffer = buffer, proxy(mplayer.onPlayEnd, that));
			that.sourceNode.start(0);
	        // sourceNode.onended = proxy(that.stop, that);

	        // that.setMeter(that.meter);
	        try{
	        	that.meterDrawer = meterLibrary[that.meter](that.ctx, that.analyserNode);
	        } catch(e){}

	        // 获取meta数据
			metaCtrl.get(that.demoURL, function(meta) {
				that.triggle("onmetacoming", meta)
			});
		},*/
		next : function () {

			// 当为随机播放模式，下一首也为随机
			if ( this.playModel === "random" ) return this.random();

			if ( CACHE.length <= ++this.current ) {
				this.current = 0
			}
			this.play(this.current)

		},
		prev : function () {

			// 当为随机播放模式，上一首也为随机
			if ( this.playModel === "random" ) return this.random();

			if ( 0 >= --this.current ) {
				var len = CACHE.length;
				this.current = len === 0 ? 0 : len-1;
			}
			this.play(this.current)

		},
		random : function () {
			// 随机且不与上一首相同
			while(!!1) {
				var len = CACHE.length;
				// 当播放列表数量小于3时，不需要经过random随机函数
				// 提高效率
				if ( len === 0 ) break;
				if ( len === 1 ) {
					this.current = 0;
					break;
				}
				if ( len === 2 ) {
					this.current = this.current === 0 ? 1 : 0;
					break
				}
				var index = random(len-1)
				if ( this.current !== index ) {
					this.current = index;
					break
				}
			}
			this.play(this.current)
		},
		remove : function (index) {
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
	            // this.triggle("onlistchange");
				// clear entry
				FileSys && FileSys.rm(file.fullpath);
				// free memory
				file = null
			}
		},
		setMeter : function (meter) {
			if (meter !== this.meter) {
				if ( this.meterDrawer ) {
					this.meterDrawer.stop();
					delete this.meterDrawer;
				}
				if ( (this.meter=meter) && (meter=meterLibrary[meter]) && this.status !== "stop" ) {
					this.meterDrawer = meter(this.ctx, this.analyserNode);
				}
			}
		}
	})

	onee.mplayer = new mplayer(JSON.parse(localStorage.getItem("mplayer-user-custom")||"{}"));

	// 扩展实例化后的对象
	extend(onee.mplayer, {
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
			var getFile = onee.get;
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

}, ["RequestAnimationFrame"]);