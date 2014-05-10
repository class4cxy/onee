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
	var EvtSys = onee.evt();
	var GG = onee.dom.find;

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

		// 用于快速查询重复音频
		// 增加/删除操作都要同步到该缓存
		var cachePlayListName = [];
		var rSuffix = /\.\w+$/;
		var rtpl = /\{(.*?)\}/g;
		var TPL_ITEM = '<li><i>{num}</i><a href="javascript:;" mplayer="play" rel={index}>{name}</a><em mplayer="remove" rel={index} title="删除 {name}">X</em></li>';
		var TPL_EQITEM = '<p><input type="range" min="-30" max="30" value="{gain}" onwheel="1"><span>{key}</span></p>';

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
			// list entries from localhost
			this.ls = function (callback) {
				// log(cwd)
				var dirReader = cwd.createReader();

				dirReader.readEntries(function(results) {
					callback(results.slice(0))
				}, function (e) {
					log("ERROR", e)
				});
			}
			// remove entries from localhost
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
			this.create = function (file, callback) {
				cwd.getFile(file.name, {create: !!1, exclusive : !!1}, function(fileEntry) {
					fileEntry.createWriter(function(writer) {
						writer.onwriteend = callback;
						writer.onerror = callback;
						writer.write(file);
					}, function(e) {
						log(e.name)
					});
				}, function(e) {
					log(e.name)
				});
			}

			this.cp = function (entries, success, error) {
				each(entries, function (entry) {
					entry.copyTo(cwd, null, success||function(){}, error||function(){});
				});
				// return entry.copyTo(cwd, null, success||function(){}, error||function(){});
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

		// 批量entries转换/过滤非audio格式
		function entry2file (entries, callback) {
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
		
		// 读取本地文件
		var fileReader = (function () {
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
		})();
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
		function compliePlaylistNode (dat) {
			return TPL_ITEM.replace(rtpl, function (a, b) {
        		if (b === "num") return dat.index+1;
        		if (b === "index") return dat.index;
        		if (b === "name") return dat.name;
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
			var metaurl = '../meta.php';
			var getJSON = onee.getJSON;

			return {
				get : function (name, callback) {
					var item = cacheMetaData[name];
					if ( item ) callback(item);
					else {
						getJSON(metaurl+'?key='+encodeURIComponent(name), function (J) {
							J && callback(cacheMetaData[name] = J);
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
				// log(k)
				// log(gain)

				onEvt(
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
				)
			})

			// 监听添加音乐
			onEvt(
				ui.adder = appendTo(ui.userctrl, '<input type="file" multiple accept="audio/*" capture="microphone" style="position:absolute; height:0; width:0; overflow:hidden; top:0; left:0">')[0],
				"change",
				function (e) {
					e.stopPropagation();
					e.preventDefault();
					var files = e.target.files;
					var len = files.length;
					var t = +new Date;
					var entries = e.target.webkitEntries;

					if (FileSys) {
						// Dragging and dropping into the file input works fine but onchange doesn't
						// populate .webkitEntries when selecting from the file dialog
						// #https://code.google.com/p/chromium/issues/detail?id=138987
						// we need to write out the file
						if  (!entries.length) {
							each(files, function ( file ) {
								if (file.type.indexOf("audio") > -1) {
									FileSys.create(file, function () {
										--len || log(+new Date-t);
									});
								} else {
									log( "ERROR : " + file.name + " is not an audio." )
								}
							})
						} else FileSys.cp(entries);
						// FileSys.cp(entries);
					}
					that.add(files);
					// reset input[file] very time
					e.target.value = ''
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
					// var items = e.dataTransfer.items;
					entry2file(
						map(e.dataTransfer.items, function(item) {
							return item.webkitGetAsEntry()
						}),
						function (files, entries) {
							that.add(files);
							// Copy to localhost
							FileSys.cp(entries);
						}
					)
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

			/*this.setVolume = function () {
				// log(this)
				var volume = parseInt(this.value) / parseInt(this.max);
				// Let's use an x*x curve (x-squared) since simple linear (x) does not
				// sound as good.
				that.volume = gain.value = volume * volume;
			}*/
			// 监听音量控件/初始化
			var UIvolume = ui.volume[0];
			if ( UIvolume ) {
				var gain = that.gainNode.gain;
				UIvolume.value = Math.sqrt(gain.value = that.volume)*100;
				onEvt(
					UIvolume,
					"input",
					function () {
						// log(this)
						var volume = parseInt(this.value) / parseInt(this.max);
						// Let's use an x*x curve (x-squared) since simple linear (x) does not
						// sound as good.
						that.volume = gain.value = volume * volume;
					}
				);
			}

			// 插入播放进度条节点
			var UIprogress = ui.progress[0];
			var UIprogressbg = ui.progressbg[0];

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
				var max = 0|that.buffer.duration
				setAttr(this, "max", 0|that.buffer.duration);
				setAttr(UIprogressbg, "max", 0|that.buffer.duration);
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
				this.status = "pause";
				that.tiggle("onPause");
				// log(audioCtx.currentTime);
				this.sourceNode.stop(0);
				// pause meter drawer
				this.meterDrawer && this.meterDrawer.pause();
				// 记录当前播放时间
				offsetTime = this.offsetTime;
			}
			that.stop = function () {
				// log("dododo")
				that.tiggle("onStop");
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
				// 重置播放进度条 重置播放时间
				UIprogressbg.value = UIprogress.value = offsetTime = this.offsetTime = 0;
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
					UIprogressbg.value = UIprogress.value = 0|that.offsetTime
					// that.offsetTime
				} else startTime = 0|audioCtx.currentTime;

			}, 13);

		}
		// 继承事件管理器
		extend(mplayer.prototype, EvtSys);
		extend(mplayer.prototype, {
			add : function (files) {
				if (files.length) {
					// log(files)
					var playlist   = this.playlist;
					// 添加前列表长度
					var orgLength  = playlist.length;
					// 此次添加动作之前，播放列表是否为空
					// 若为空，则添加完之后自动开始播放
					// 若不为空，添加完之后不做任何操作
					var isEmpty    = !playlist.length;
					var name;
					var cache      = cachePlayListName;
					var that       = this;
					var currIndex;
					// var addList = [];
					each(files, function (file, k) {
						// log(file.type.indexOf("audio"))
						name = file.name.replace(rSuffix, "");
						// 检查格式
						if ( file.type.indexOf("audio") > -1 ) {
							// 检查是否存在
							if ( indexOf(cache, name) === -1 ) {
								currIndex = playlist.length;
								// currLength = playlist.length;
								playlist[currIndex] = {
				            		name : name,
				            		file : file,
									// 记录Entry的fullpath属性
									// 用于移除列表时同时移除缓存区的entry
									// 本地存储均在根目录
				            		fullpath : "/" + file.name,
				            		// 生成/缓存节点
				            		node : appendTo(that.ui.list, compliePlaylistNode({index : currIndex, name : name}))
				            	}
				            	// 同步cache
				            	cache[cache.length] = name;
				            	// 请求meta数据
				            	/*metaCtrl.get(cache[cache.length] = name, function (meta){
				            		playitem.meta = meta;
				            		// 触发每个meta赋值回调
				            		// 用于播放先于获取meta
				            		playitem.metaEvt 
				            	})*/
							}
						} else log( "ERROR : " + file.name + " is not an audio." )
		            });
		            // 去重后长度不变即数据没有改变过
		            if (orgLength!==playlist.length) {
		            	// 触发ononUpdatePlayList事件
		            	// this.onUpdatePlayList();
		            	this.tiggle("onUpdatePlayList")
			           	// play if isEmpty
			            // isEmpty && this.play();
		            }
				}
			},
			play : function (prevIndex, index) {

				var item, that = this, playlist = that.playlist;
				// 如果播放列表为空，一律触发input[type=file]的click事件
				if ( playlist.length === 0 ) return this.ui.add[0].click();
				// index存在，则清空当前的，直接播放mplayer.playlist[index]
				if ( index !== undefined ) {
					item = playlist[that.currentPlay = index];
					// 确保清空上一首正在播放的
					that.stop();
				// 否则当status == stop时，则直接播放mplayer.playlist[currentPlay]
				} else if ( that.status === "stop" ) {
					item = playlist[that.currentPlay];
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
						that.tiggle("onPlay");
						// addClass(that.ui.play, that.status = "playing");
					}

					return this
				}
				// log(mplayer.playlist)
				if ( !item ) return log("Can't find the item.");

				// update item ui
				addClass(playlist[that.currentPlay].node, "active");
				prevIndex !== undefined && removeClass(playlist[prevIndex].node, "active");

				// 触发decoding
				that.onDecodingAudio();

				fileReader(item.file, function (result) {
					decodeAudio(result, function (buffer) {
						// playing
						that.tiggle("onPlay");
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
							that.tiggle("onUpdateMeta", meta)
						});
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
		            // 触发onUpdatePlayList事件
		            // this.onUpdatePlayList();
		            this.tiggle("onUpdatePlayList");
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
			ready : function (callback) {
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
			},
			meters : ["default", "none"]
		});

		// 监听浏览器关闭动作
		onEvt(window, "beforeunload", function () {
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

		});

	})(Sizzle("*[mplayer=main]")[0]);

}, ["onee.dom", "sizzle", "RequestAnimationFrame", "dnd", "onee.ajax"]);