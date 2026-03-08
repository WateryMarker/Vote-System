<?php
require_once __DIR__.'/db.php';
$in = inbody();

$num  = isset($in['num'])  ? intval($in['num'])  : 0;
$diff = isset($in['diff']) ? intval($in['diff']) : 0;
if ($num <= 0 || $num > 9999) err('หมายเลขไม่ถูกต้อง');
if ($diff === 0) err('diff ต้องไม่เป็นศูนย์');

// สร้างเริ่มต้นถ้ายังไม่มี
$mysqli->query("INSERT IGNORE INTO recycle_vote (num, name, votes) VALUES ($num, '', 0)");

// อัปเดตคะแนน (ไม่ต่ำกว่า 0)
$sql = "UPDATE recycle_vote
        SET votes = GREATEST(0, votes + ?)
        WHERE num = ?";
$stmt = $mysqli->prepare($sql);
if(!$stmt) err('prepare failed: '.$mysqli->error);
$stmt->bind_param('ii', $diff, $num);
if(!$stmt->execute()) err('โหวตไม่สำเร็จ: '.$stmt->error);

ok(['num'=>$num, 'diff'=>$diff]);
