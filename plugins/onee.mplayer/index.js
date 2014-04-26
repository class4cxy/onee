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
	var uniq = _.uniq;
	var random = _.random;
	var slice = Array.prototype.slice;
	var getAttr = Sizzle.attr;
	var setAttr = onee.dom.setAttr;
	var setClass = onee.dom.setClass;
	var addClass = onee.dom.addClass;
	var removeClass = onee.dom.delClass;
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



		// File System API
		// only support chrome
		// #https://developer.mozilla.org/en-US/docs/WebGuide/API/File_System/Introduction#The_File_System_API_can_use_different_storage_types
		var FileSys = (function (factory) {
			window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
			window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem
			return window.requestFileSystem ? new factory(window.requestFileSystem) : null

		})(function (fs) {
			if ( !fs ) return;
			
			var filer = null;
			var cwd = null;
			
			this.readEntries = function (callback) {
				// log(cwd)
				var dirReader = cwd.createReader();

				dirReader.readEntries(function(results) {
					callback(results.slice(0))
				}, function (e) {
					log("ERROR", e)
				});
			}

			this.rm = function (fullpath, callback) {
				// log(fullpath)
				if ( fullpath ) {
					var fsUrl = cwd.toURL() + fullpath;
				
					window.resolveLocalFileSystemURL(fsUrl, function(entry) {

						entry.isFile && entry.remove(function() {},function() {});
						// callback();
					});
				}

			}

			this.cp = function (entry, success, error) {
				return entry.copyTo(cwd, null, success||function(){}, error||function(){});
			}

			this.init = function (callback) {
				// initialize
				fs(TEMPORARY, 1024 * 1204, function(fileSystem) {
					filer = fileSystem;
					cwd = fileSystem.root;
					callback && callback();
				}, function(e) {
					log('Error', e);
				})
			}
		});

		// 代理
		function proxy (factory, context, param) {
			return function () {
				factory.call(context||null, param)
			}
		}

/*		setInterval(function () {
			log(audioCtx.currentTime)
		}, 2e3)*/
		var TPL = {
			// 播放列表模板
			item : '<li><i>{num}</i><a href="javascript:;" mplayer="play" rel={index}>{name}</a><em mplayer="remove" rel={index} title="删除 {name}">X</em></li>',
			// 添加音乐控件模板
			adder : '<input type="file" multiple accept="audio/*" capture="microphone" style="position:absolute; height:0; width:0; overflow:hidden; top:0; left:0">'
		}

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
				volume : 0.8,
				// 更新播放列表事件
				onUpdatePlayList : function () {},
				// 当解析音频文件事件
				onDecodingAudio : function () {},
				// 播放列表
				playlist : []
			});

			// 监听添加音乐
			onEvt(
				ui.adder = appendTo(ui.userctrl, TPL.adder)[0],
				"change",
				function (e) {
					that.add(e.target.files)
				}
			);
			// 监听添加音乐
			onEvt(
				ui.add,
				"click",
				function (e) {
					ui.adder.click()
				}
			);
			// 初始化拖拽事件添加文件
			new DnDFileController('p[mplayer=dnd]', function(files, e) {
				if (FileSys) {
					var items = e.dataTransfer.items;
					each(items, function (item) {
						var entry = item.webkitGetAsEntry();
						// Folder? Copy the DirectoryEntry over to our local filesystem.
						if (entry.isFile) {
							// change to [object file]
							entry.file(function (file) {
								that.add([file], function () {
									// Copy to my location
									FileSys.cp(entry);
								});
							}, function (e) {
								log("ERROR", e)
							})
						}
					})
				} else that.add(files);
			});

			// 监听列表播放
			onEvt(ui.list, "dblclick", function () {
				// log(this)
				that.play(that.currentPlay, parseInt(getAttr(this, "rel")))
			}, "a[mplayer=play]")

			// 监听列表播放
			onEvt(ui.list, "click", function () {
				// log(this)
				that.remove(parseInt(getAttr(this, "rel")))
			}, "em[mplayer=remove]")


			// 播放模式字典
			var playModels = [
				{key : "loopone", title : "单曲循环"},
				{key : "loopall", title : "列表循环"},
				{key : "random", title : "随机播放"}
			];
			var playModelsArr = ["loopone", "loopall", "random"];
			// var currentPlayModelInfo = playModels[indexOf(playModelsArr, that.playModel)];
			function _updatePlayModel_ (option) {
				return setClass(
					innerTEXT(
						setAttr(ui.playmodel, "title", option.title),
						option.title
					),
					"hide-text "+option.key
				)
			}
			// 监听播放模式
			onEvt(
				// 初始化UI
				_updatePlayModel_(playModels[indexOf(playModelsArr, that.playModel)]),
				"click",
				function () {
					var index = indexOf(playModelsArr, that.playModel);
					if ( --index < 0 ) index = playModels.length-1;
					var model = playModels[index];
					// var title = model.title;
					_updatePlayModel_(model);
					that.playModel=model.key
				}
			);

			// 监听音量控件/初始化
			ui.volume[0].value = Math.sqrt(that.volume)*100;
			onEvt(
				ui.volume,
				"input",
				function () {
					if ( that.gainNode ) {
						var volume = parseInt(this.value) / parseInt(this.max);
						// Let's use an x*x curve (x-squared) since simple linear (x) does not
						// sound as good.
						// log(volume * volume)
						that.volume = that.gainNode.gain.value = volume * volume;
					}
				}
			);

			// 插入播放进度条节点
			var UIprogress = ui.progress[0];

			// 监听播放进度条控件改变后事件
			onEvt(
				UIprogress,
				"change",
				function (e) {
					// 先暂停，后播放
					that.offsetTime = offsetTime = parseInt(this.value)
					that.play().play();
					this.isChanging = !!0;
				}
			);
			// 监听播放进度条控件改变中事件
			onEvt(
				UIprogress,
				"input",
				function () {
					this.isChanging = !!1;
				}
			);
			// 增加额外方法
			UIprogress.enable = function () {
				// log(this)
				setAttr(this, "max", 0|that.buffer.duration);
			}

			// 监听功能按钮(播放/暂停/下一首/上一首)
			each(["next", "prev", "play"], function (fn) {
				onEvt(
					ui[fn],
					"click",
					proxy(that[fn], that)
				)
			});

			that.pause = function () {
				that.status = "pause"
				// log(audioCtx.currentTime);
				that.sourceNode.stop(0);
				// pause meter drawer
				that.meterDrawer.pause();
				// 记录当前播放时间
				offsetTime = that.offsetTime;
			}
			that.stop = function () {
				// log("dododo")
				// 清空音频视图
				if ( that.meterDrawer ) {
					that.meterDrawer.stop();
					delete that.meterDrawer;
				}
				// 清空正在播放的音源
				if ( that.sourceNode ) {
					that.sourceNode.stop();
					delete that.sourceNode;
					that.status = "stop"
				}
				// 重置播放进度条 重置播放时间
				UIprogress.value = offsetTime = that.offsetTime = 0;
			}

			// 更新播放进度
			// var duration;
			var startTime = 0;
			var offsetTime = 0;
			// 改用setInterval
			// 由于requestAnimationFrame在窗口最小化/不在当前窗口时
			// 执行频率会降低，导致时间计算不准确
			setInterval(function () {
				// update play progress ui, 取整
				// 当用户改变ui.progress的进度时
				// 暂停追随播放进度，changing是自定义一属性
				if ( !UIprogress.isChanging && that.status === "playing" ) {
					that.offsetTime = offsetTime+audioCtx.currentTime-startTime;
					UIprogress.value = 0|that.offsetTime
					// that.offsetTime
				} else startTime = 0|audioCtx.currentTime;

			}, 13);

		}

		extend(mplayer.prototype, {
			add : function (files, callback) {
				if (files.length) {
					var playlist = this.playlist;
					// 此次添加动作之前，播放列表是否为空
					// 若为空，则添加完之后自动开始播放
					// 若不为空，添加完之后不做任何操作
					var isEmpty = !playlist.length;
					each(files, function (file) {
						// log(file.type.indexOf("audio"))
						if ( file.type.indexOf("audio") > -1 ) {
							playlist[playlist.length] = {
			            		name : file.name.replace(rSuffix, ""),
			            		file : file,
			            		fullpath : file._fullpath_ || ""
			            	}
			            	// for storage in entry cache
			            	callback && callback()
						} else log( "ERROR : "+ file.name + " is not an audio." )
		            });
		            // 去重
		            // 生成列表
		            mplayer.renderPlaylist(this.playlist = uniq(playlist, "name"), this.ui.list, proxy(this.onUpdatePlayList, this));
		            isEmpty && this.play();
				}
			},
			play : function (prevIndex, index) {

				var file, that = this, playlist = that.playlist;
				// 如果播放列表为空，一律触发input[type=file]的click事件
				if ( playlist.length === 0 ) return this.ui.add[0].click();
				// index存在，则清空当前的，直接播放mplayer.playlist[index]
				if ( index !== undefined ) {
					file = playlist[that.currentPlay = index].file;
					// 确保清空上一首正在播放的
					that.stop();
				// 否则当status == stop时，则直接播放mplayer.playlist[currentPlay]
				} else if ( that.status === "stop" ) {
					file = playlist[that.currentPlay].file;
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
						mplayer.createBufferSource.call(that);
						// that.sourceNode.start(0);
						that.sourceNode.start(0, that.offsetTime);
						// goon meter drawer
						that.meterDrawer.goon(that.sourceNode);
						that.status = "playing"
					}

					return this
				}
				// log(mplayer.playlist)
				if ( !file ) return log("Can't find the file.");

				// update item ui
				addClass(playlist[that.currentPlay].node, "active");
				prevIndex !== undefined && removeClass(playlist[prevIndex].node, "active");

				// 触发decoding
				that.onDecodingAudio();

				mplayer.fileReader(file, function (result) {
					mplayer.decodeAudio(result, function (buffer) {
						// playing
						that.status = "playing";
						that.buffer = buffer;
						that.onDecodingAudio.onDone();
						// 移除临时回调
						delete that.onDecodingAudio.onDone;

						// 初始化播放进度条
						that.ui.progress[0].enable()

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

				// 当为随机播放模式，下一首也为随机
				if ( this.playModel === "random" ) return this.random();

				var prevIndex = this.currentPlay;

				if ( this.playlist.length <= ++this.currentPlay ) {
					this.currentPlay = 0
				}
				this.play(prevIndex, this.currentPlay)

			},
			prev : function () {

				// 当为随机播放模式，上一首也为随机
				if ( this.playModel === "random" ) return this.random();

				var prevIndex = this.currentPlay;

				if ( 0 >= --this.currentPlay ) {
					var len = this.playlist.length;
					this.currentPlay = len === 0 ? 0 : len-1;
				}
				this.play(prevIndex, this.currentPlay)
			},
			random : function () {
				// 随机且不与上一首相同
				var prevIndex = this.currentPlay;
				while(!!1) {
					var len = this.playlist.length;
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
				this.play(prevIndex, this.currentPlay)
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
					var file = playlist.splice(index,1);
					// 若删除当前播放音乐，则停止播放
					if ( this.currentPlay === index ) {
						// 设置当前播放为
						this.currentPlay = 0;
						this.stop()
					}
					// call the playlist render
					mplayer.renderPlaylist(playlist, innerHTML(this.ui.list, ""), proxy(this.onUpdatePlayList, this));
					// clear entry
					// log(file)
					FileSys && FileSys.rm(file[0].fullpath)
				}
			}
		})

		var rtpl = /\{(.*?)\}/g;
		var rSuffix = /\.\w+$/;
		// 静态属性
		extend(mplayer, {
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
	        				this.random();
	        			break;
	        		}

	        	}
			},
			// 生成列表UI
			renderPlaylist : function (playlist, ui, callback) {
				// var html = "";
				innerHTML(ui, "");
				each(playlist, function (item, k) {
					item.node = appendTo(ui, TPL.item.replace(rtpl, function (a, b) {
	            		if (b === "num") return k+1;
	            		if (b === "index") return k;
	            		// if (b === "duration") return item.buffer[b]
	            		return item[b];
	            	}))
	            });
	            callback && callback()
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

		onee.mplayer = {
			ready : function (callback) {

				var that = this;
				try {
					FileSys.init(function () {
						that.instance = new mplayer(JSON.parse(localStorage.getItem("mplayer-user-custom")||"{}"));
						callback && callback.call(that.instance)
						// read the location entry
						FileSys && FileSys.readEntries(function (entries) {
							each(entries, function (entry) {
								entry.file(function (file) {
									// 增加Entry的fullpath属性
									// 用于移除列表时同时移除缓存区的entry实例
									file._fullpath_ = entry.fullPath;
									that.instance.add([file]);
								}, function (e) {
									log(e)
								})
							})
						})
					});
				} catch(e) {
					that.instance = new mplayer(JSON.parse(localStorage.getItem("mplayer-user-custom")||"{}"));
					callback && callback.call(that.instance);
					// callback && callback.call(that.instance = new mplayer(JSON.parse(localStorage.getItem("mplayer-user-custom")||"{}")))
				}

			}
		}
		
		// 监听浏览器关闭动作
		onEvt(window, "beforeunload", function () {
			// log("beforeunload")
			var cfg = onee.mplayer.instance;
			// 存储当前用户习惯
			localStorage.setItem("mplayer-user-custom", JSON.stringify({
				// currentPlay : cfg.currentPlay,
				playModel : cfg.playModel,
				meter : cfg.meter,
				volume : cfg.volume
			}))

		});

	})(Sizzle("*[mplayer=main]")[0]);

}, ["onee.dom", "sizzle", "RequestAnimationFrame", "dnd"]);