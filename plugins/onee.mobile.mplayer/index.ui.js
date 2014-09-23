;(function () {

	var map = _.map;
	var each = _.each;
	var TPL_ITEM = '<li data-player="playitem" class="ui-border-1px mb-music-list-item" data-index="{index}" data-name="{name}" data-url="{url}">\
						<div class="mb-music-list-item-hack-middle">\
						<i>{name}</i>\
						<i class="mb-music-list-item-singer"></i>\
						</div>\
						<p class="mb-music-list-item-duration"></p>\
					</li>',
		TPL_EQITEM = '<p class="mb-eq-item"><input data-freq="{freq}" class="mb-eq-input" type="range" min="-10" max="10" value="{gain}"><span>{key}</span></p>';;

	var complieHTML = (function () {
		var rtpl = /\{(.*?)\}/g;
		return function (tpl, dat, index) {
			return tpl.replace(rtpl, function (a, b) {
	    		if (b === "index") return index;
	    		return dat[b];
	    	})
		}
	}());

	// init ui
	$(".ui-carousel").carousel(1);

	JPlayer.$article.css("height", window.innerHeight - JPlayer.UIuserctrl.clientHeight);
	JPlayer.$hdisk.parent().css("height", window.innerWidth * .9375+10);
	JPlayer.UIcanvas.height = window.innerWidth * .9375+10;
	JPlayer.UIcanvas.width = window.innerWidth;

	$("#alertNetwork").dialog({
		show : !!1,
		enter : function () {
			JPlayer.network = !!1
		},
		cancel : function () {
			JPlayer.network = !!0
		}
	})

    // Handle the start of interactions
    $(document).on('touchstart', '.mb-music-item', function(e){
        var page = e.currentTarget;
        var startTopScroll = page.scrollTop;
        if(startTopScroll <= 0)
            page.scrollTop = 1;

        if(startTopScroll + page.offsetHeight >= page.scrollHeight)
            page.scrollTop = page.scrollHeight - page.offsetHeight - 1;

    }).on('touchmove', '.mb-music-item', function(e){
        var page = e.currentTarget;
        // TODO cache element select
        var content = page.querySelector('.ui-page-content');
        // Offset value have include content and border
        if( !content || content.offsetHeight <= parseInt(getComputedStyle(page).height) ){
            // your element have overflow
            return e.preventDefault();
        }
    }).on('touchmove', '.js-backdrop, .js-no-bounce', function(e){
        e.preventDefault();
    });

    var uiEq = {
		"f31" : "31hz",
		"f62" : "62hz",
		"f125" : "125hz",
		"f250" : "250hz",
		"f500" : "500hz",
		"f1000" : "1khz",
		"f2000" : "2khz",
		"f4000" : "4khz",
		"f8000" : "8khz",
		"f16000" : "16khz"
	};

	// 生成播放列表
	JPlayer.$list.html(map(JPlayer.cache = [
		{ name : "与我常在", url : "./sources/m1.mp3", singer : "陈奕迅" },
		{ name : "后会无期", url : "./sources/m2.mp3", singer : "邓紫棋" }
	], function (source, k) {
    	return complieHTML(TPL_ITEM, source, k)
    }).join(''));
	// 生成默认均衡器列表
    JPlayer.$eqs.html(map(JPlayer.eqindex, function(v, index) {
    	return '<p class="mb-eq-type" data-index="'+ index +'">'+ index +'</p>';
    }).join(''));
    // 生成均衡器节点列表
    JPlayer.$eqlist.html(map(JPlayer.EQ, function (eq, k) {
    	return complieHTML(TPL_EQITEM, {
    		key : uiEq[k],
    		gain : eq,
    		freq : k
    	})
    }).join('')).css("width", 60*10);

    // init ui meter handle
    JPlayer.meter === "wave" && JPlayer.$meter.addClass("mb-ctrl-meter-wave");

    // UI lyric
	var UImeta = (function () {

		var $lyric = JPlayer.$lyric;
		var $LRCitems;
		// 当前歌词文件，已解析
		var tmpLRC;
		// 歌词文件列表，已解析
		var cacheLRC = {};
		// 当前歌词索引
		var pointer = 1;
		// 中点坐标
		var middlePos = $lyric.parent().height()/2 - 20;

		function _initLRC (lrcs) {
			// build lyric html
            $lyric
            	// 初始化歌词列表
	            .css({
                	"-webkitTransform" : "translate3d(0px, "+middlePos+"px, 0px)"
                })
                .html($.map(lrcs, function(item) {
	                return '<li class="mb-music-lyric-row">'+item.tx+'</li>';
	            }).join(''));
            // 引用歌词节点，初始化歌词节点
			($LRCitems = $lyric.find("li")).eq(0).addClass("mb-music-lyric-row-curr");
			// 引用到局部变量
			tmpLRC = lrcs.length && lrcs;
		}

		function _duration2time (duration) {
			duration = duration.toFixed(0);
			var m = Math.round(duration/60);
			var s = duration%60;
			return (m > 9 ? m : '0'+m) +':' + (s > 9 ? s : '0'+s);
		}

		return {
			init : function (e, meta) {
				// 初始化音乐封面
				var coverURL = meta.pic;
				var currentPlay = JPlayer.current;

				JPlayer.$hcover
	                .css("backgroundImage", "url("+(coverURL?coverURL.slice(0, coverURL.length-6)+'.jpg':"about:blank")+")")
	                .addClass("mb-disk-cover-show");

                // 初始化当前播放显示
	            JPlayer.$name.text(meta.title);
	            JPlayer.$singer_album.text(meta.artist+"《"+meta.album_name+"》");

	            // 初始化播放列表
	            var $currPlayItem = JPlayer.$list.find("li:nth-child("+ (currentPlay+1) +")");
	            $currPlayItem.find(".mb-music-list-item-singer").text(meta.artist);
	            $currPlayItem.find(".mb-music-list-item-duration").text(_duration2time(JPlayer.buffer.duration));

	            // 获取歌词文件，并解析好
	            if ( cacheLRC[currentPlay] ) {
	            	_initLRC(cacheLRC[currentPlay])
	            } else {
	            	JPlayer.parseLyric(meta, function (lrcs) {
	            		if ( lrcs && lrcs.length ) {
	            			_initLRC(cacheLRC[currentPlay] = lrcs)
	            		} else {
	            			// 歌词解析失败
	            			$lyric.text("找不到相关歌词")
	            		}
	            	});
	            }
				
			},
			setupLRC : function () {
				if (tmpLRC) {
					// console.log(tmpLRC[pointer)
					if ( JPlayer.offsetTime > tmpLRC[pointer].s ) {
						// 移除上一行样式
	                    $LRCitems.eq(pointer-1).removeClass("mb-music-lyric-row-curr");
						// removeClass(LRCitems[pointer-1], "curr")
						// 添加当前行样式
	                    $LRCitems.eq(pointer).addClass("mb-music-lyric-row-curr");
						// addClass(LRCitems[pointer], "curr")
						// 设置居中
						$lyric.css({"-webkitTransform" : 'translate3d(0px, '+ (middlePos-40*pointer++) +'px, 0px)'});
						// 结束，暂停操作
						pointer === tmpLRC.length && (tmpLRC=null);
					}
				}
			},
			resetLRC : function () {
				pointer = 1;
				// 重置歌词列表
	            $lyric.html("").text("歌词").css({
                	"-webkitTransform" : "translate3d(0px, 0px, 0px)"
                });
			}
		}
	}());

	// ============== addEventListener to JPlayer's event
	// on start a new music
	JPlayer.on("start", function () {
		// lyric status
		JPlayer.$lyric.html("").text("Loading...");
		// play list status
		JPlayer.$list
			.find("li:nth-child("+ (JPlayer.current+1) +")").addClass("mb-music-list-item-curr");
		// hide loading progress
		$("#alertLoader").dialog("hide");
		// progress reset
		JPlayer.UIprogress.max = JPlayer.UIprogressbg.max = 0|JPlayer.buffer.duration;
	})
	.on("playing", function () {

		JPlayer.UIprogress.value = JPlayer.UIprogressbg.value = JPlayer.offsetTime;
		UImeta.setupLRC();

	})
	.on("meta", UImeta.init)
	.on("replay", function () {
		// cd disk animation
		JPlayer.$hdisk.removeClass("mb-disk-pause");
		// play button status
		JPlayer.$play.addClass("mb-ctrl-playing");
	})
	.on("pause", function () {

		JPlayer.$hdisk.addClass("mb-disk-pause");
		JPlayer.$play.removeClass("mb-ctrl-playing");
		// addClass(that.ui.hdisk, "pause")

	})
	.on("stop", function () {

		// cd disk animation
		JPlayer.$hdisk.addClass("mb-disk-pause");
		JPlayer.$hcover.removeClass("mb-disk-cover-show");
		// play button status
		JPlayer.$play.removeClass("mb-ctrl-playing");
		// lyric status
		UImeta.resetLRC();
		// play list status
		JPlayer.$list.find("li:nth-child("+ (JPlayer.previous+1) +")").removeClass("mb-music-list-item-curr");
		// progress reset
		JPlayer.UIprogress.value = JPlayer.UIprogressbg.value = 0;

	})
	.on("loading", function () {

		$("#alertLoader").dialog("show");

	})
	.on("progress", function (e, dat) {

		var loaded = dat.loaded,
			total  = dat.total;

		drawLoading(loaded, total);
	})
	.on("error", function (e, type) {
		switch (type) {
			case "notwifi" :
				$("#notify").dialog({
					show : !!1,
					expires : 5e3,
					content : "您的网络不合适播放，如果您已经切换到WIFI/3G/4G，你可以尝试刷新页面后选择[放肆]选项再进行播放。"
				});
			break;
		}
	});
	// ================ addEventListener to UI
	// 监听列表播放操作
	$("body").on("tap", "li[data-player=playitem]", function () {
		JPlayer.play(this.dataset.index)
	})
	// 监听下一首事件
	.on("tap", "p[data-player=next]", function () { JPlayer.next() })
	// 监听上一首事件
	.on("tap", "p[data-player=prev]", function () { JPlayer.prev() })
	// 监听播放暂停事件
	.on("tap", "p[data-player=play]", function () { JPlayer.play() })

	// 监听频谱图切换
	.on("tap", "[data-player=meter]", function (e) {
		if ( JPlayer.$meter.hasClass("mb-ctrl-meter-wave") ) {
			JPlayer.$meter.removeClass("mb-ctrl-meter-wave");
			JPlayer.setMeter("frequency")
		} else {
			JPlayer.$meter.addClass("mb-ctrl-meter-wave");
			JPlayer.setMeter("wave")
		}
	})
	// 监听均衡控制开关
	.on("tap", "[data-player=eq]", function (e) {
		JPlayer.$eq.addClass("mb-ctrl-eq-on");
		$("#alertEq").dialog("show");
	})
	.on("tap", "div[data-belong=alertEq]", function () {
		JPlayer.$eq.removeClass("mb-ctrl-eq-on");
	})
	// 卷积节点
	.on("input", "input[data-player=convolver]", function (e) {
    	var element = e.target;
    	JPlayer.setConvolverGain(element.value)
    })
    // 延时节点
	.on("input", "input[data-player=delay]", function (e) {
    	var element = e.target;
    	JPlayer.setDelayTime(element.value)
    })
    // 均很器
    .on("input", "input[data-freq]", function (e) {
    	var element = e.target;
    	JPlayer.eq(element.dataset.freq, element.value)
    })
    // 切换均衡器
    .on("tap", ".mb-eq-type", function () {
    	var $eqlist = JPlayer.$eqlist;
    	JPlayer.$eqs.find(".mb-eq-type").removeClass("curr");
    	$(this).addClass("curr");
    	JPlayer.eq(this.dataset.index, function (v, k) {
    		$eqlist.find(".mb-eq-item:nth-child("+(k+1)+") input").val(v)
    	})
    });

	// UI animation loading
	var drawLoading = function () {
		// body...
		var ctx = document.getElementById("loader").getContext('2d');
		var perc = document.getElementById("loaderPercent");
		// var len = ctx.width;
		var radius = ctx.canvas.width/2;
		// console.log(ctx)
		var PI2 = 2 * Math.PI;
		// var PI15 = 1.5 * Math.PI;
		var PI_2 = Math.PI/2;

		function _clear_ () {

			ctx.clearRect(0,0,radius,radius);
				
			ctx.beginPath();
			ctx.strokeStyle = "#afafaf";
			ctx.lineWidth = 4;
			ctx.lineCap = "round";
			ctx.arc(radius, radius, radius-4, -PI_2, 1.5 * Math.PI);
			ctx.stroke();
			perc.innerText = "0";
			// return _clear_
		}

		return function (curr, total) {
			_clear_();
			// console.log(curr, total)
			var percent = curr/total;

			ctx.beginPath();
			ctx.strokeStyle = "#c28a03";
			ctx.arc(radius, radius, radius-4, -PI_2, PI2*percent-PI_2);
			ctx.stroke();
			perc.innerText = Math.floor(percent*100);

		}
	}();

}());