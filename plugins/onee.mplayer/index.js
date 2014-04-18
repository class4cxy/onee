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
	var slice = Array.prototype.slice;
	var getAttr = Sizzle.attr;
	var onEvt = onee.dom.on;
	var appendTo = onee.dom.append;
	var innerHTML = onee.dom.html;
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
				// 播放模式(单曲播放-playone/单曲循环-loopone/顺序播放-playall/列表循环-loopall/随机播放-random)
				playModel : "playone",
				// 音频缓冲区
				buffer : null
			});

			// 获取缓存列表数据，生成播放列表
			mplayer.renderPlaylist(this.ui.list);

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

			// 监听播放模式
			onEvt(ui.playmodel, "change", function () {
				that.playModel = this.value;
			})

			// 监听功能按钮(播放/暂停/停止/下一首/上一首)
			each(["play", "stop", "next", "prev"], function (fn) {
				onEvt(ui[fn], "click", proxy(that[fn], that));
			});

		}

		extend(mplayer.prototype, {
			add : function (input) {
				var playlist = mplayer.playlist;
				// log(input)
				each(input.files, function (file) {
					// log(Object.prototype.toString.call(file))
	            	playlist[playlist.length] = {
	            		name : file.name.replace(rSuffix, ""),
	            		file : file
	            	}
	            });
	            mplayer.renderPlaylist(this.ui.list)
			},
			play : function (index) {

				var file, that = this;
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
						// 重新新建音频节点
						that.sourceNode = null;
						that.sourceNode = mplayer.createBufferSource(that.buffer, proxy(mplayer.onPlayEnd, that));
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

						// 新建音频节点
						that.sourceNode = mplayer.createBufferSource(that.buffer = buffer, proxy(mplayer.onPlayEnd, that));
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
			}
		})

		var playListTpl = '<li><a href="#" mplayer="play" rel={index}>{num}.{name}</a><span mplayer="remove" rel={index}>X</span></li>';
		var rtpl = /\{(.*?)\}/g;
		var rSuffix = /\.\w+$/;
		// 静态属性
		extend(mplayer, {
			// 播放列表存储，读取localStorage数据
			playlist : JSON.parse(localStorage.getItem("mplayer-user-playlist")||"[]"),
			// 当播放结束，用于相对应播放模式的逻辑控制
			onPlayEnd : function () {
				// note: when stop function or playend will disapatch it
		        // i just need it dispatch by playend
		        // log("doo")
		        // log(this.offsetTime)
	        	if (this.buffer.duration<=this.offsetTime) {
	        		this.stop();
	        		switch( this.playModel ) {
	        			case "playone" :
	        			break;
	        			case "loopone" :
		        			this.currentPlay--;
		        			this.next();
	        			break;
	        			case "playall" :
	        				this.currentPlay+1 < mplayer.playlist.length && this.next();
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
			},
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
				    }
				}
			}
		});

		var cfg = onee.mplayer = new mplayer(JSON.parse(localStorage.getItem("mplayer-user-custom")||"{}"));

		// 监听浏览器关闭动作
		onEvt(window, "beforeunload", function () {
			log("beforeunload")
			// 存储当前用户习惯
			localStorage.setItem("mplayer-user-custom", JSON.stringify({
				currentPlay : cfg.currentPlay,
				playModel : cfg.playModel,
				meter : cfg.meter,
				volume : cfg.volume,
			}))

			// 存储当前用户播放列表
			// log(JSON.stringify(mplayer.playlist))
			// localStorage.setItem("mplayer-user-playlist", JSON.stringify(mplayer.playlist))

		});

	})(Sizzle("*[mplayer=main]")[0]);

}, ["onee.dom", "sizzle", "RequestAnimationFrame"]);