﻿/**
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
	var indexOf = _.indexOf;
	var uniq = _.uniq;
	var slice = Array.prototype.slice;
	var getAttr = Sizzle.attr;
	var setAttr = onee.dom.setAttr;
	var setClass = onee.dom.setClass;
	var onEvt = onee.dom.on;
	var fireEvt = onee.dom.fire;
	var appendTo = onee.dom.append;
	var setCSS = onee.dom.css;
	var innerHTML = onee.dom.html;
	var innerTEXT = onee.dom.text;
	var removeNode = onee.dom.remove;
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
		// 音量控件模板
		var vVolume = '<input type="range" min="0" max="100" mplayer="volume" class="vvolume" value="{volume}" />';
		// 播放模式控件模板
		var vPlayModel = '<a href="#playmodel" title="{title}" class="vplaymodel {key}">{title}</a>';

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
				// 状态
				status : "stop",
				// 已播放时间-针对每一首音乐
				offsetTime : 0,
				// 当前播放
				currentPlay : 0,
				// 音频仪表效果
				meter : "default",
				// 播放模式(单曲循环-loopone/列表循环-loopall/随机播放-random)
				playModel : "loopall",
				// 音频缓冲区
				buffer : null,
				// 音频增益控制节点/控制音量
				gainNode : audioCtx.createGain(),
				// 音量
				volume : 0.8
			});

			// 获取缓存列表数据，生成播放列表
			// mplayer.renderPlaylist(this.ui.list);

			// 更新播放进度
			// var duration;
			var startTime = 0;
			var offsetTime = 0;
			// 改用setInterval
			// 由于requestAnimationFrame在窗口最小化/不在当前窗口时
			// 执行频率会降低，导致时间计算不准确
			setInterval(function () {
				if ( that.status === "playing" ) {
					that.offsetTime = offsetTime+audioCtx.currentTime-startTime;
					// that.offsetTime
				} else if ( that.status === "pause" ) {
					offsetTime = that.offsetTime;
					startTime = 0|audioCtx.currentTime;
				} else if ( that.status === "stop" ) {
					// log("dodo")
					offsetTime = that.offsetTime = 0;
					startTime = 0|audioCtx.currentTime;
				}
			}, 30);

			// 监听添加音乐
			onEvt(ui.add, "change", function () {
				that.add(this)
			});

			// 监听列表播放
			onEvt(ui.list, "dblclick", function () {
				// log(this)
				that.play(parseInt(getAttr(this, "rel")))
			}, "a[mplayer=play]")

			// 监听列表播放
			onEvt(ui.list, "click", function () {
				// log(this)
				that.remove(parseInt(getAttr(this, "rel")))
			}, "span[mplayer=remove]")


			// 播放模式字典
			var playModels = [
				{key : "loopone", title : "单曲循环"},
				{key : "loopall", title : "列表循环"},
				{key : "random", title : "随机播放"}
			];
			var playModelsArr = ["loopone", "loopall", "random"];
			var currentPlayModelInfo = playModels[indexOf(playModelsArr, that.playModel)];
			// 监听播放模式
			onEvt(
				ui.playmodel = appendTo(ui.userctrl, vPlayModel.replace(rtpl, function (a, b) {
					return currentPlayModelInfo[b];
				})),
				"click",
				function () {
					var index = indexOf(playModelsArr, that.playModel);
					if ( --index < 0 ) index = playModels.length-1;
					var model = playModels[index];
					var title = model.title;
					setClass(
						innerTEXT(
							setAttr(this, "title", title),
							title
						),
						"vplaymodel "+(that.playModel=model.key)
					)
				}
			);

			// 监听音量控件
			onEvt(
				// 动态插入音量控制节点
				ui.volume = appendTo(ui.userctrl, vVolume.replace("{volume}", function () {return Math.sqrt(that.volume)*100})),
				"input",
				function () {
				if ( that.gainNode ) {
					var volume = parseInt(this.value) / parseInt(this.max);
					// Let's use an x*x curve (x-squared) since simple linear (x) does not
					// sound as good.
					// log(volume * volume)
					that.volume = that.gainNode.gain.value = volume * volume;
				}
			});

			// 监听功能按钮(播放/暂停/下一首/上一首)
			each(["play", "next", "prev"], function (fn) {
				onEvt(ui[fn], "click", proxy(that[fn], that));
			});

		}

		extend(mplayer.prototype, {
			add : function (input) {
				var playlist = mplayer.playlist;
				// 此次添加动作之前，播放列表是否为空
				// 若为空，则添加完之后自动开始播放
				// 若不为空，添加完之后不做任何操作
				var isEmpty = !playlist.length;
				// log(input)
				each(input.files, function (file) {
					// log(Object.prototype.toString.call(file))
	            	playlist[playlist.length] = {
	            		name : file.name.replace(rSuffix, ""),
	            		file : file
	            	}
	            });
	            // 去重
	            mplayer.playlist = uniq(playlist, "name");
	            // 生成列表
	            mplayer.renderPlaylist(this.ui.list);
	            isEmpty && this.play()
			},
			play : function (index) {

				var file, that = this, playlist = mplayer.playlist;
				// 如果播放列表为空，一律触发input[type=file]的click事件
				if ( playlist.length === 0 ) return fireEvt(this.ui.add[0], "click");
				// index存在，则清空当前的，直接播放mplayer.playlist[index]
				if ( index !== undefined ) {
					file = mplayer.playlist[that.currentPlay = index].file;
					// 确保清空上一首正在播放的
					that.stop();
				// 否则当status == stop时，则直接播放mplayer.playlist[currentPlay]
				} else if ( that.status === "stop" ) {
					file = mplayer.playlist[that.currentPlay].file;
				// status为pause或者playing时，切换播放/暂停状态即可
				} else {
					// 暂停
					if ( that.status === "playing" ) {
						that.status = "pause"
						// log(audioCtx.currentTime);
						that.sourceNode.stop(0);
						// pause meter drawer
						that.meterDrawer.pause();
						// 记录当前暂停位置
						// that.offsetTime += audioCtx.currentTime-that.startTime;

					// 继续播放
					} else if ( that.status === "pause" ) {
						// 重新获取全局时间戳
						// that.startTime = audioCtx.currentTime;
						// log(that.sourceNode)
						mplayer.createBufferSource.call(that);
						// that.sourceNode.start(0);
						that.sourceNode.start(0, that.offsetTime);
						// goon meter drawer
						that.meterDrawer.goon(that.sourceNode);
						that.status = "playing"
					}
					return
				}
				// log(mplayer.playlist)
				if ( !file ) return log("Can't find the file.");

				mplayer.fileReader(file, function (result) {
					mplayer.decodeAudio(result, function (buffer) {
						// 从audio context对象获取
						// that.startTime = audioCtx.currentTime;
						// playing
						that.status = "playing";
						that.buffer = buffer

						// 新建音频节点
						mplayer.createBufferSource.call(that);
						// that.sourceNode = mplayer.createBufferSource(that.buffer = buffer, proxy(mplayer.onPlayEnd, that));
						that.sourceNode.start(0);
				        // sourceNode.onended = proxy(that.stop, that);

						that.meterDrawer = mplayer.meterLab[that.meter](that.ctx, that.sourceNode);
					})
				});
			},
			next : function () {
				// log("nex")
				if ( mplayer.playlist.length <= ++this.currentPlay ) {
					this.currentPlay = 0
				}
				this.play(this.currentPlay)
			},
			prev : function () {
				if ( 0 >= --this.currentPlay ) {
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
				if ( this.sourceNode ) {
					this.sourceNode.stop();
					delete this.sourceNode;
					this.status = "stop"
				}
				// this.startTime = 0;
				// this.offsetTime = 0
			},
			remove : function (index) {
				var playlist = mplayer.playlist;
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
					playlist.splice(index,1);
					// 若删除当前播放音乐，则停止播放
					if ( this.currentPlay === index ) {
						// 设置当前播放为
						this.currentPlay = 0;
						this.stop()
					}
					// call the playlist render
					mplayer.renderPlaylist(innerHTML(this.ui.list, ""))
				}
				if ( playlist.length === 0 ) {
					setCSS(this.ui.add[0], {
						display : "block"
					});
					setCSS(this.ui.list, {
						display : "none"
					})
				}
			}
		})

		// 播放列表模板
		var playListTpl = '<li><a href="#" mplayer="play" rel={index}>{num}.{name}</a><span mplayer="remove" rel={index}>X</span></li>';
		var rtpl = /\{(.*?)\}/g;
		var rSuffix = /\.\w+$/;
		// 静态属性
		extend(mplayer, {
			// 播放列表
			// [NOTE] 由于浏览器安全机制，无法实现播放列表真正固化
			playlist : [],
			// 当播放结束，用于相对应播放模式的逻辑控制
			onPlayEnd : function () {
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
	        				this.currentPlay = (0|Math.random()*mplayer.playlist.length)-1
	        				this.next();
	        			break;
	        		}

	        	}
			},
			// 生成列表UI
			renderPlaylist : function (ui) {
				// var html = "";
				innerHTML(ui, "");
				each(mplayer.playlist, function (item, k) {
					item.node = appendTo(ui, playListTpl.replace(rtpl, function (a, b) {
	            		if (b === "num") return k+1;
	            		if (b === "index") return k;
	            		return item[b];
	            	}))
	            });
	            if ( mplayer.playlist.length ) {

	            }
			},
			// 新建音频节点
			createBufferSource : function () {

				// 不知道新建会不会之前造成什么不良反应
				// 手动清掉
				if (this.sourceNode) {
					this.sourceNode.disconnect(this.gainNode);
					this.gainNode.disconnect(audioCtx.destination);
					this.sourceNode = null;
				}

				this.sourceNode = audioCtx.createBufferSource();
		        //then assign the buffer to the buffer source node
		        this.sourceNode.buffer = this.buffer;
		        // 重新连接增益节点
		        this.sourceNode.connect(this.gainNode);
		        // this.sourceNode.connect(audioCtx.destination);

		        this.gainNode.connect(audioCtx.destination);
		        this.gainNode.gain.value = this.volume

		        // fix in old browsers
		        if (!this.sourceNode.start) {
		            this.sourceNode.start = this.sourceNode.noteOn;
		            this.sourceNode.stop = this.sourceNode.noteOff;
		        }

		        // on end
		        this.sourceNode.onended = proxy(mplayer.onPlayEnd, this);
		    	// return sourceNode;
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
						cwidth            = ctx.canvas.width,
						cheight           = ctx.canvas.height-2,
						meterNum          = cwidth/8|0,
						//width of the meters in the spectrum;
						meterWidth        = 6,
						capHeight         = 2,
						capStyle          = '#fff',
						capYPositionArray = [],
						autoAnimationHandle;

					//connect the source to the analyser
			        sourceNode.connect(analyser);
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
				    		ctx.clearRect(0, 0, cwidth, -cheight);
				    		autoAnimationHandle = null;
				    		sourceNode.disconnect(analyser);
				    		// 每次暂停后就恢复translate之前
				    		ctx.restore();
				    		// analyser.disconnect(audioCtx.destination);
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
				    }
				}
			}
		});

		var cfg = onee.mplayer = new mplayer(JSON.parse(localStorage.getItem("mplayer-user-custom")||"{}"));

		// 监听浏览器关闭动作
		onEvt(window, "beforeunload", function () {
			// log("beforeunload")
			// 存储当前用户习惯
			localStorage.setItem("mplayer-user-custom", JSON.stringify({
				// currentPlay : cfg.currentPlay,
				playModel : cfg.playModel,
				meter : cfg.meter,
				volume : cfg.volume
			}))

		});

	})(Sizzle("*[mplayer=main]")[0]);

}, ["onee.dom", "sizzle", "RequestAnimationFrame"]);