//BEGIN//{MyMarkHis}
<div class="item-blue">
	{$ if ( O.RankTotal != -1 ) { $}
	<p>个人总赢取{@O.ScoreTotal}透明值<span>排名{@O.RankTotal}位</span></p>
	{$ } $}
	<p>个人周透明值增加{@O.ScoreWeek} <span>排名{@O.RankWeek}位</span></p>
</div>
{$ var ScoreTypeMap = [ $}
{$ 	[], $}
{$ 	["./games.html"], $}
{$ 	["javascript:;", "Powin.cache.Powin_sendWeibo.open()"], $}
{$ 	["./video.html"], $}
{$ 	["./qa.html"], $}
{$ 	["./bottle.html"] $}
{$ ]; $}
<ul>
{$	var ScoreDetails = O.ScoreDetails;$}
{$	for ( var i = 0, len = ScoreDetails.length; i < len; i++ ) { $}
{$		var item = ScoreDetails[i]; $}
{$		var link = ScoreTypeMap[item.ScoreTypeId]; $}
		<li>参与“<a href="{@link[0]}" onclick="{@link[1]||''}"}>{@item.ScoreType}</a>”环节赢取<em>{@item.Score}</em>透明值</li>
{$ 	} $}
</ul>
//END//

//BEGIN//{TeamMarkHis}
{$ var ScoreTypeMap = [ $}
{$ 	[], $}
{$ 	["./games.html"], $}
{$ 	["javascript:;", "Powin.cache.Powin_sendWeibo.open()"], $}
{$ 	["./video.html"], $}
{$ 	["./qa.html"], $}
{$ 	["./bottle.html"] $}
{$ ]; $}

{$ if ( O.Status != "noteam" && O.Status != "nopartner" ) { $}
	{$ var dat = O.Data; $}
	<div class="item-blue">
		<p> 团队总赢取{@dat.ScoreTotal}透明值<span>排名{@dat.RankTotal}位</span></p>
	</div>
	<ul>
	{$	var ScoreDetails = dat.ScoreDetails;$}
	{$	for ( var i = 0, len = ScoreDetails.length; i < len; i++ ) { $}
	{$		var item = ScoreDetails[i]; $}
	{$		var link = ScoreTypeMap[item.ScoreTypeId]; $}
		<li><b>{@item.NickName}</b>参与“<a href="{@link[0]}" onclick="{@link[1]||''}"}>{@item.ScoreType}</a>”环节赢取<em>{@item.Score}</em>透明值</li>
	{$ 	} $}
	</ul>
{$ } else { $}
	<ul class="nodat"><li>暂无数据</li></ul>
{$ } $}
//END//

//BEGIN//{Teammates}
{$ if ( O.Status != "noteam" && O.Status != "nopartner" ) { $}
	{$ 	var dat = O.Data; $}
	{$ for ( var i = 0, len = dat.length; i < len; i++ ) { $}
	{$ 	var item = dat[i]; $}
	{$ 	var Coach = item.Profile.Coach || "G01"; $}
		<li>
			<span class="portrait">
				<span class="portrait-wrap">
					<img src="{@item.Profile.AvatarUrl}" alt=""  />
					<img src="./images/avatar/{@CommJS.png242png8(item.Profile.Avatar||'T01')}.png" class="portrait-frame" alt="" />
				</span>
			</span>
			<span>{@DataMap.Country[Coach][0]} {@item.NickName}</span>
		</li>
	{$ 	if ( i != len-1 ) { $}
			<li class="line"></li>
	{$ 	} $}
	{$ } $}
{$ } else { $}
	<li class="nodat">您还没队友</li>
{$ } $}
//END//

//BEGIN//{TaskDetial}
{$ var _map = [{href : "./games.html"}, {onclick : "Powin.cache.Powin_sendWeibo.open()"}, {href : "./video.html"}, {href : "./qa.html"}, {href : "./bottle.html"}];$}
{$ for ( var i = 0, len = O.length; i < len; i++ ) { $}
	{$ 	var item = O[i]; $}
	{$ 	var index = i+1; $}
	{$ if (i == 5) { $}
		<li class="task">
			<a href="javascript:;" onclick="Powin.cache.Powin_bind.open()" CClicki="个人中心-任务提示-营养专家会员绑定" title="营养专家会员绑定"></a>
			<span class="text">已获得 <em>{@item.Score}</em> 分，还有 <em>{@item.Task}</em> 分</span>
			{$ if (item.Finished == "1") { $}
				<span class="comple"><img src="images/ic-img-complete.png" alt="" /></span>
			{$ } $}
		</li>
	{$ } else { $}
		<li>
			{$ if (_map[i].href) { $}
			<a href="{@_map[i].href}" target="_blank" CClicki="个人中心-任务提示-{@item.ScoreType}">
			{$ } else { $}
			<a onclick="{@_map[i].onclick}" href="javascript:;" CClicki="个人中心-任务提示-{@item.ScoreType}">
			{$ } $}
			<img src="images/ic-imgc-{@index}.png" alt="" />
			</a>
			<span class="text">已获得 <em>{@item.Score}</em> 分，还有 <em>{@item.Task}</em> 分</span>
			{$ if (item.Finished == "1") { $}
				<span class="comple"><img src="images/ic-img-complete.png" alt="" /></span>
			{$ } $}
		</li>
	{$ } $}
{$ } $}
//END//

//BEGIN//{UserMsg}
{$ if ( O.Status != "norecords" ) { $}
	{$ 	var dat = O.Data; $}
	{$ for ( var i = 0, len = dat.length; i < len; i++ ) { $}
	{$ 	var item = dat[i]; $}
		<p><a href="javascript:;" rel="{@item.MessageType}" mid="{@item.ID}" iid="{@item.InviteID}" fromn="{@item.FromNickName}" uid="{@item.From}"{@item.IsRead ? '' : ' class="n"'}>{@item.Content}</a></p>
	{$ } $}
{$ } else { $}
	<p class="nodat">暂无数据</p>
{$ } $}
//END//

//BEGIN//{UserBaseInfo}
{$ var Lottery = DataMap.Prize[O.Profile.Lottery] || ""; $}
{$ var ptext = (Lottery + O.Profile.Prize) || "暂无"; $}
<div class="img portrait float-l">
	<div class="portrait-frame"><a href="javascript:;" onclick="Powin.get(\'Powin_avatar\').open()" CClicki="个人中心-更换头像" title="更换头像"><img src="./images/avatar/{@CommJS.png242png8(O.Profile.Avatar || 'T01')}.png" id="CommAvatarBox" alt="" /></a></div>
	<div class="userimg"><img src="{@O.Profile.AvatarUrl}" alt="" /></div>
</div>
{$ var Coach; $}
<div class="item-l-msg float-l">
	<h2 class="user-name">{@O.NickName}</h2>
{$ 	if ( Coach = O.Profile.Coach ) { $}
		<p>{@DataMap.Country[Coach][0]}{@O.Profile.SitNumber}号座位</p>
{$ 	} else { $}
		<p>未组团</p>
{$ 	} $}
	<span style="color:#3e9fd8">活动奖品：<em>{@ptext}</em></span>
	<a href="javascript:void(0);" id="UsercRouteUpdata" title="点击登记领奖信息" CClicki="个人中心-点击登记领奖信息">点击登记领奖信息</a>
	<a href="./games.html" class="get-turk" title="立即登车" CClicki="个人中心-立即登车">立即登车</a>
</div>
<div style="clear:both;"></div>
<div class="user-id">
	<p style="margin-top: 5px;color:#636363;" id="CommAvatarText">
	{$ if ( O.Profile.Avatar ) { $}
		{@DataMap.Avatar[O.Profile.Avatar]}
	{$ } else { $}
		<a href="javascript:;" onclick="Powin.get(\'Powin_avatar\').open()">马上设置您的头像</a>
	{$ } $}
	</p>
</div>
//END//