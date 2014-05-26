<?php
	header("Content-Type:text/html;charset=UTF-8");

	$re = '{"status":true,"message":"","data":{"trackList":null,"lastSongId":0,"type":"default","type_id":1,"clearlist":null,"vip":0,"vip_role":0,"hqset":0},"jumpurl":null}';

	if ( isset($_GET["key"]) ) {
		$key = preg_replace("/\s/", "", $_GET["key"]);
		// 匹配音乐ID
		$rSongID = '/href="http:\/\/www\.xiami\.com\/song\/(\d+)/';

		// 采集音乐在虾米的ID
		preg_match($rSongID, file_get_contents("http://www.xiami.com/search/song/?key=".$key), $SongIDs);

		if ( count($SongIDs) ) {
			$re = file_get_contents("http://www.xiami.com/song/playlist/id/".$SongIDs[1]."/cat/json");
		}

	}

	echo $re;
?>