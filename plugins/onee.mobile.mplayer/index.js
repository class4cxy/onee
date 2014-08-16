/**
 * demo - mplayer
 * 20140415
 * personal musicplayer
 * design by J.do
 * for more ? http://jdoi.net/
 */

(function (global, undefined) { "use strict";
	// body...
	// is exist
	// if ( onee.mplayer ) return;

	// new a onee's log
	// var log     = onee.log("mplayer");
	
	// base method
	var extend  = _.extend;
	var each = _.each;
	var map = _.map;
	// var indexOf = _.indexOf;
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
	// var Interface = onee.interface;
	// var EvtSys = onee.evt();
	// var GG = onee.dom.find;
	// var onKey = onee.dom.key.on;

	// if ( !uiMain ) return log("Not match mplayer UI.");

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
	var TPL_ITEM = '<li data-player="playitem" class="ui-border-1px mb-music-list-item" data-index="{index}" data-name="{name}" data-url="{url}">\
						<div class="mb-music-list-item-hack-middle">\
						<i>{name}</i>\
						<i class="mb-music-list-item-singer"></i>\
						</div>\
						<p class="mb-music-list-item-duration"></p>\
					</li>';
	var TPL_EQITEM = '<p><input type="range" min="-30" max="30" value="{gain}" onwheel="1"><span>{key}</span></p>';

	// 代理
	function proxy (factory, context, param) {
		return function () {
			factory.call(context||null, param)
		}
	}

	// 代理
	function proxy (factory, context, param) {
		return function () {
			factory.call(context||null, param)
		}
	}

	// 批量entries转换/过滤非audio格式
	/*function entry2file (entries, callback) {
		var len = entries.length;
		var files = [];
		var retEntries = [];
		var endCallback = function () {
			--len || callback(files,retEntries);
		}
		each(entries, function (entry, k) {
			// if (entry.isFile) {
			// change to [object file]
			entry.file(function (file) {

				if ( file.type.indexOf("audio") > -1 ) {
					// 记录Entry的fullpath属性
					// 用于移除列表时同时移除缓存区的entry
					// file._fullpath_ = entry.fullPath;
					files[files.length] = file;
					retEntries[retEntries.length] = entry;
				} else log( "ERROR : "+ file.name + " is not an audio." );

				endCallback()
			}, function (e) {
				log("ERROR : "+e);
				endCallback()
			})
			// }
		})
	}*/
	// 当播放结束，用于相对应播放模式的逻辑控制
	/*function onPlayEnd () {
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
	}*/
	
	// 读取本地文件
	/*var fileReader = (function () {
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
	})();*/
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
	// 重新串联各音频节点(source-analyser-gainNode-context.destination)
	// 每次重新播放都会触发该进程
	function reConnectContext () {
		// 不知道新建会不会之前造成什么不良反应
		// 手动清掉
		if (this.source) this.source = null;

		// 新建BufferSource节点
		this.source = audioCtx.createBufferSource();
		//then assign the buffer to the buffer source node
		// this.source.buffer = this.buffer;
		// fix in old browsers
        if (!this.source.start) {
            this.source.start = this.source.noteOn;
            this.source.stop = this.source.noteOff;
        }

        // on end
        this.source.onended = proxy(this.stop, this);

        var len = 10, nex;
        // 重新连接EQ均衡器
		this.source.connect(COMEQ[len-1].biquadFilter);
		while(len--) {
			nex = len-1;
			nex > -1 && COMEQ[len].biquadFilter.connect(COMEQ[nex].biquadFilter)
		}
		// 连接音频分析节点
		COMEQ[0].biquadFilter.connect(this.analyser);

		// 重新连接音频分析节点
        // this.source.connect(this.analyser);
		// 重新连接音频增益节点
        // this.analyser.connect(this.gainNode);
        // 重新连接到终端
        this.analyser.connect(audioCtx.destination);

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
		// var audio = this.audio = new Audio();
		// 音频分析节点
		this.analyser = audioCtx.createAnalyser();
		// this.analyser.smoothingTimeConstant = 1;
		// 音源节点
		// this.source = audioCtx.createMediaElementSource(audio);
		// 状态
		this.status = "stop";
		// 已播放时间-针对每一首音乐
		this.offsetTime = 0;
		// 当前播放
		this.current = 0;
		// 音频仪表效果
		this.meter = options.meter || "default";
		// 播放模式(单曲循环-loopone/列表循环-loopall/随机播放-random)
		// this.playModel = options.playModel || "loopall";
		// 音量
		// this.volume = options.volume || 0.8;
		// 均衡器列表
		this.EQ = options.EQ || [25,0,0,0,0,0,0,0,0,0];


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
		});
		// 监听列表播放操作
		that.$body.on("singleTap", "li[data-player=playitem]", function () {
			that.play(this.dataset.index)
		})
		// 监听下一首事件
		.on("tap", "a[data-player=next]", proxy(that.next, that))
		// 监听上一首事件
		.on("tap", "a[data-player=prev]", proxy(that.prev, that))
		// 监听播放暂停事件
		.on("tap", "a[data-player=play]", proxy(that.play, that));


		that.pause = function () {
			// log(audioCtx.currentTime);
			this.source.stop(0);
			// pause meter drawer
			this.meterDrawer && this.meterDrawer.pause();
			// 记录当前播放时间
			// offsetTime = this.offsetTime;

			that.triggle(this.status = "pause");
		}
		that.stop = function () {
			// 清空音频视图
			if ( this.meterDrawer ) {
				this.meterDrawer.stop();
				delete this.meterDrawer;
			}
			// 清空正在播放的音源
			if ( this.source ) {
				this.source.stop();
				delete this.source;
			}
			// 重置播放进度条 重置播放时间
			// UIprogressbg.value = UIprogress.value = offsetTime = this.offsetTime = 0;

			that.triggle(this.status = "stop");
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
			if ( !UIprogress.isChanging && that.status === "playing" ) {
				that.offsetTime = offsetTime+audioCtx.currentTime-startTime;
				that.triggle("onplaying", UIprogressbg.value = UIprogress.value = 0|that.offsetTime)
				// that.offsetTime
			} else startTime = 0|audioCtx.currentTime;

		}, 13);*/
	}
	// 资源缓存器
	var CACHE = [];
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
		fetch : function (item, callback) {
			if ( item.buffer ) {
	
				callback && callback(item.buffer)
				// that.source.start(0);
	
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
						console.log("ready..")
						callback && callback(item.buffer = buffer);
						request = request.onload = null;
					});
					/*metaCtrl.get(url, function(meta) {
						that.tiggle("meta", meta)
					});*/
	 			}
	 			that.triggle(that.status = "loading");
	 			request.onprogress = function(e) {
					if(e.lengthComputable) {
						that.triggle(that.status = "progress", e);
					}
				}
				request.send();
	
			}
		},
		play : function (index) {


			var item, that = this;
			// 如果播放列表为空
			if ( CACHE.length === 0 ) return;
			// index存在，则清空当前的，直接播放CACHE[index]
			if ( index !== undefined ) {
				item = CACHE[that.current = index];
				that.triggle("stop");
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
					// log(that.source)
					reConnectContext.call(that);
					that.source.buffer = that.buffer;
					// that.source.start(0);
					that.source.start(0, that.offsetTime);
					// goon meter drawer
					that.meterDrawer && that.meterDrawer.goon();
					that.status = "playing";
					that.triggle("start");
					// addClass(that.ui.play, that.status = "playing");
				}

				return this
			}

			if ( !item ) return log("Can't find the music.");

			/*that.triggle("start");
			audio.src = item.url;
			audio.play();*/

			// metaCtrl.get(item.name, function(meta) {
                // console.log(meta)
				// that.triggle("meta", meta)
			// });

			// 触发decoding
			// 
			reConnectContext.call(that);

			that.fetch(item, function (buffer) {

				that.source.buffer = that.buffer = buffer;

				// reConnectContext.call(that);

				// that.source.start(0);

				// start frequency animation
				that.meterDrawer = meterLibrary[that.meter](that.ctx, that.analyser);

				that.triggle("start");

				that.status = "playing"
			});

			that.source.start(0);

		},
		next : function () {

			// 当为随机播放模式，下一首也为随机
			if ( this.playModel === "random" ) return this.random();

			// var prevIndex = this.currentPlay;

			if ( CACHE.length <= ++this.currentPlay ) {
				this.currentPlay = 0
			}
			this.play(this.currentPlay)

		},
		prev : function () {

			// 当为随机播放模式，上一首也为随机
			if ( this.playModel === "random" ) return this.random();

			// var prevIndex = this.currentPlay;

			if ( 0 >= --this.currentPlay ) {
				var len = CACHE.length;
				this.currentPlay = len === 0 ? 0 : len-1;
			}
			this.play(this.currentPlay)
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
	            this.triggle("onlistchange");
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
	})

	global.JPlayer = new player(JSON.parse(localStorage.getItem("jplayer-user-custom")||"{}"));

	// 扩展实例化后的对象
	extend(global.JPlayer, {
		/*ready : function (callback) {
			var that = this;
			FileSys ? FileSys.init(function () {
				callback && callback.call(that)
				// read the location entry
				FileSys.ls(function (entries) {
					entry2file(entries,
						function (files) {
							that.add(files);
						}
					);
				})
			}) : callback && callback.call(that);
		},*/
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

}(window));