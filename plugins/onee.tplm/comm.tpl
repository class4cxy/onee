//BEGIN//{UserCenter}
{$ var pathname = window.location.pathname; $}
{$ if (O.Status == "unlogin") { $}
	<div class="lg">
		授权合作平台账号登录
		<p>
		<a href="/do/authentication/QQConnect/?returnurl=/games.html" CClicki="顶部登陆-QQ登陆" title="使用QQ登陆"  class="hide-text qq">QQ</a>
		<a href="/do/authentication/SinaConnect/?returnurl=/games.html" CClicki="顶部登陆-新浪微博登陆" title="使用新浪微博登陆" class="hide-text">新浪</a>
		</p>
	</div>
{$ } else { $}
{$ 	if ( pathname.indexOf("index.html") == -1 ) { $}
	<div class="lgo clearfix mini">
		<p class="if clearfix">
		{$ if ( O.taskNum != 0 ) { $}
			<em class="n" title="今天您还有{@O.taskNum}个任务未完成">{@O.taskNum}</em>
		{$ } $}
			<span class="un">{@O.Data.NickName}</span>
			<span>|</span>
			<span><a href="userc.html">个人中心</a></span>
			<span>|</span>
			<span>透明值<strong class="cm-score">{@O.Data.Score}</strong></span>
		</p>
		<p class="msg">
			<em class="n">{@O.Data.MessageCount}</em>
			<a href="javascript:;" onclick="Powin.cache.Powin_mymsg.open({})">您有{@O.Data.MessageCount}条新消息</a>
			<span> | </span>
			<a href="/Apps/SecurityApp/Account/Logoff.html">注销</a>
		</p>
	</div>
{$ 	} else { $}
	<div class="lgo clearfix">
		<a href="javascript:;" onclick="Powin.cache.Powin_bind.open()" class="b">注册or绑定营养家会员账号</a>
		<p class="ts">立即获得 <b>5000</b> 透明值</p>
		<p class="if clearfix">
		{$ if ( O.taskNum != 0 ) { $}
			<em class="n" title="今天您还有{@O.taskNum}个任务未完成">{@O.taskNum}</em>
		{$ } $}
			<span class="un">{@O.Data.NickName}</span>
			<span>|</span>
			<span><a href="userc.html">个人中心</a></span>
			<span>|</span>
			<span>透明值<strong class="cm-score">{@O.Data.Score}</strong></span>
		</p>
		<p class="msg">
			<em class="n">{@O.Data.MessageCount}</em>
			<a href="javascript:;" onclick="Powin.cache.Powin_mymsg.open({})">您有{@O.Data.MessageCount}条新消息</a>
			<span> | </span>
			<a href="/Apps/SecurityApp/Account/Logoff.html">注销</a>
		</p>
	</div>
{$ 	} $}
{$ } $}

//END//

//BEGIN//{IndexLuks}
{$ if ( O && O.length ) { $}
	<marquee behavior="scroll" width="234" height="20" direction="up" scrollamount="1" scrolldelay="80">
	{$ for ( var i=0, len=O.length; i<len; i++ ) { $}
		{$ var item = O[i]; $}
		<li><span class="n">{@item.NickName}</span><span>抽中<em>{@item.PrizeID}</em></span></li>
	{$ } $}
	</marquee>
{$ } else { $}
	<li class="nod">暂无数据</li>
{$ } $}
//END//