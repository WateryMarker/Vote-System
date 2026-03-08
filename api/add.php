<?php
require_once __DIR__.'/db.php';
$in = inbody();

$num  = isset($in['num'])  ? intval($in['num']) : 0;
$name = isset($in['name']) ? trim($in['name'])   : '';

if ($num <= 0 || $num > 9999) err('หมายเลขไม่ถูกต้อง');
if (mb_strlen($name) > 255)   err('ชื่อยาวเกินไป');

// INSERT ถ้ามีแล้วให้อัปเดตชื่อ (votes คงเดิม)
$sql = "INSERT INTO recycle_vote (num, name, votes)
        VALUES (?, ?, 0)
        ON DUPLICATE KEY UPDATE name = VALUES(name)";
$stmt = $mysqli->prepare($sql);
if (!$stmt) err('prepare failed: '.$mysqli->error);
$stmt->bind_param('is', $num, $name);
if (!$stmt->execute()) err('เพิ่มไม่สำเร็จ: '.$stmt->error);

ok(['num'=>$num, 'name'=>$name]);
