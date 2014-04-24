<h1>onee - on need 当需要时</h1>
<ol>
	<li><strong>提倡功能粒化，按需加载执行；</strong></li>
	<li><strong>提供组件管理/定义、依赖管理。</strong></li>
</ol>

<h3>[API]</h3>

<h4>onee.use - <em>模块调用接口</em></h4>
onee.use(module1[, module2[, module3...]], callback);
<ul>
	<li>`module` 可以为内置组件，可以为外部js/css。</li>
	<li>`callback` 回调</li>
</ul>

<strong>[demo]</strong>

<p>
	<pre>
onee.use("onee.powin", function () {
	console.log("do")
});
	</pre>
</p>
<p>
	<pre>
onee.use("./module.js", function () {
	console.log("do")
});
	</pre>
</p>
<p>
	<pre>
onee.use("onee.powin", "./module1.js", function () {
	console.log("do")
});		
	</pre>
</p>


<h4>onee.define - <em>模块定义接口</em></h4>
onee.define(factory, [module1[, module2[, module3...]]);
<ul>
	<li>`factory` 模块函数体</li>
	<li>`module` 可以为内置组件，可以为外部js/css。</li>
</ul>

<strong>[demo]</strong>

<p>
	<pre>
onee.define(function () {
	// Your code
}, ["onee.powin"]);
	</pre>
</p>
<p>
	<pre>
onee.define(function () {
	// Your code
}, ["./module1.js"]);
	</pre>
</p>
<p>
	<pre>
onee.define(function () {
	// Your code
}, ["onee.powin", "./module1.js"]);
	</pre>
</p>

<h3>onee.inc - <em>模块异步加载接口</em></h3>
onee.inc(fileurl, callback);
<ul>
	<li>`fileurl` 外部引用文件</li>
	<li>`callback` 回调</li>
</ul>

<h3>[注]</h3>

<ol>
	<li>onee 基于 lodash.js；</li>
	<li>onee 不约束全局变量，所有组件加载后均按原有变量执行；</li>
	<li>onee 支持深层依赖，但不解决循环依赖。</li>
</ol>

<h3>[内置组件列表]</h3>
<table>
	<tr>
		<td>索引</td>
		<td>说明</td>
	</tr>
	<tr>
		<td>sizzle</td>
		<td></td>
	</tr>
	<tr>
		<td>jquery</td>
		<td></td>
	</tr>
	<tr>
		<td>RequestAnimationFrame</td>
		<td></td>
	</tr>
	<tr>
		<td>Tween</td>
		<td></td>
	</tr>
	<tr>
		<td>onee.dom</td>
		<td>onee节点操作组件</td>
	</tr>
	<tr>
		<td>onee.ajax</td>
		<td>onee异步请求组件</td>
	</tr>
	<tr>
		<td>onee.tplm</td>
		<td>onee模板引擎组件</td>
	</tr>
	<tr>
		<td>onee.form</td>
		<td>onee表单组件</td>
	</tr>
	<tr>
		<td>onee.powin</td>
		<td>onee弹窗组件</td>
	</tr>
	<tr>
		<td>onee.swf</td>
		<td>oneeflash加载组件</td>
	</tr>
	<tr>
		<td>onee.scroller</td>
		<td>onee滑动组件</td>
	</tr>
	<tr>
		<td>onee.layerscroller</td>
		<td>onee多层视差滑动组件</td>
	</tr>
	<tr>
		<td>onee.mslider</td>
		<td>onee滑动组件，手机端</td>
	</tr>
	<tr>
		<td>onee.mplayer</td>
		<td>onee web版 音乐播放器 filesystem+canvas+audiocontext</td>
	</tr>
</table>