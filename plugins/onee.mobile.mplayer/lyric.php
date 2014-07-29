<?php
	header("Content-Type:text/html;charset=UTF-8");

	if ( isset($_GET["file"]) ) {
		echo file_get_contents($_GET["file"]);
	}
	
?>