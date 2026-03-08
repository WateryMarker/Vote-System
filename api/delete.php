<?php
require_once __DIR__.'/db.php';
$in  = inbody();
$num = isset($in['num']) ? intval($in['num']) : 0;
if ($num <= 0 || $num > 9999) err('หมายเลขไม่ถูกต้อง');

$stmt = $mysqli->prepare("DELETE FROM recycle_vote WHERE num=?");
if(!$stmt) err('prepare failed: '.$mysqli->error);
$stmt->bind_param('i', $num);
if(!$stmt->execute()) err('ลบไม่สำเร็จ: '.$stmt->error);

ok(['num'=>$num]);
