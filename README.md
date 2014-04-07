<h1>onee - on need 当需要时，功能粒化、按需加载、管理组件</h1>

<h3>[API]</h3>

<h3>onee.use - <em>模块调用接口</em></h3>
onee.use(module1[, module2[, module3...]], callback);
<ul>
	<li>`module` 可以为内置组件，可以为外部js/css。</li>
	<li>`callback` 回调</li>
</ul>

<h3>[demo]</h3>

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


<h3>onee.define - <em>模块定义接口</em></h3>
onee.define(factory, [module1[, module2[, module3...]]);
<ul>
	<li>`factory` 模块函数体</li>
	<li>`module` 可以为内置组件，可以为外部js/css。</li>
</ul>

<h3>[demo]</h3>

<p>onee.define(function () {}, ["onee.powin"]);</p>
<p>onee.define(function () {}, ["./module1.js"]);</p>
<p>onee.define(function () {}, ["onee.powin", "./module1.js"]);</p>

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