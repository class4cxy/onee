<?php
	header("Content-Type:text/html;charset=UTF-8");

	$re = array("artist"=>"","album"=>"","cover"=>"");

	if ( isset($_GET["key"]) ) {
		$key = preg_replace("/\s/", "", $_GET["key"]);
		// 演唱者
		$rArtist = '/<a[^>]+href="http:\/\/www\.xiami\.com\/artist\/\d+[^"]+"[^>]+title="(.*?)"/';
		// 专辑
		$rAlbum = '/<a[^>]+href="(http:\/\/www\.xiami\.com\/album\/\d+)"[^>]+title="(.*?)"/';
		// 封面图
		$rAlbumCover = '/<a[^>]+id="cover_lightbox"[^>]+href="(.*?)"/';

		// $songList = preg_replace("/[\t\n\r]/", "", file_get_contents("http://www.xiami.com/search/song/?key=".$key));

		// echo ($songList);
		$songList = file_get_contents("http://www.xiami.com/search/song/?key=".$key);

		// $songList = preg_replace("/[\t\n\r]/", "", $songList);

		// 采集歌手名
		preg_match($rArtist, $songList, $artist);

		// print_r($artist);
		if ( count($artist) ) {
			$re['artist'] = $artist[1];
		}

		// 采集专辑名/专辑链接
		preg_match($rAlbum, $songList, $album);

		if ( count($album) ) {
			$re['album'] = $album[2];
			// echo $album[1];
			$albumCon = file_get_contents($album[1]);
			// 采集封面
			preg_match($rAlbumCover, $albumCon, $cover);

			// print_r($cover[1]);
			if ( count($cover) ) {
				$re['cover'] = $cover[1];
			}
			
		}
	}

	echo json_encode($re);
	// echo $con;
?>