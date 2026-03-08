<?php
// api.php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-cache");

require_once __DIR__ . "/db.php";

/**
 * ตั้งค่า PIN ฝั่งเซิร์ฟเวอร์
 * - เปลี่ยนค่าด้านล่างให้ตรงกับที่ใช้ใน staff.html
 * - ถ้าจะให้ปลอดภัยขึ้น: เก็บใน .env หรือไฟล์นอก webroot
 */
define("STAFF_PIN", "147");

$action = $_GET["action"] ?? $_POST["action"] ?? "list";

// ฟังก์ชันช่วย
function ok($data){ echo json_encode(["ok"=>true] + $data, JSON_UNESCAPED_UNICODE); exit; }
function err($msg, $code=400){ http_response_code($code); echo json_encode(["ok"=>false, "error"=>$msg], JSON_UNESCAPED_UNICODE); exit; }
function need_pin(){
  $pin = $_POST["pin"] ?? $_GET["pin"] ?? "";
  if ($pin !== STAFF_PIN) err("PIN ไม่ถูกต้อง", 403);
}

if ($action === "list") {
  $q = $mysqli->query("SELECT id,num,name,votes FROM contestants ORDER BY votes DESC, num ASC");
  $rows = [];
  while($row = $q->fetch_assoc()) $rows[] = $row;
  ok(["items"=>$rows]);
}

if ($action === "stats") {
  $q1 = $mysqli->query("SELECT COUNT(*) c FROM contestants");
  $q2 = $mysqli->query("SELECT COALESCE(SUM(votes),0) s FROM contestants");
  $c  = $q1->fetch_assoc()["c"];
  $s  = $q2->fetch_assoc()["s"];
  ok(["count"=>$c, "sumVotes"=>$s]);
}

if ($action === "add") {
  need_pin();
  $num  = intval($_POST["num"] ?? 0);
  $name = trim($_POST["name"] ?? "");
  if ($num <= 0) err("หมายเลขไม่ถูกต้อง");
  // upsert: ถ้ามีอยู่แล้ว อัปเดตชื่อได้
  $stmt = $mysqli->prepare("INSERT INTO contestants(num,name) VALUES(?,?)
                            ON DUPLICATE KEY UPDATE name=VALUES(name)");
  $stmt->bind_param("is", $num, $name);
  $stmt->execute();
  ok(["num"=>$num]);
}

if ($action === "vote") {
  need_pin();
  $num   = intval($_POST["num"] ?? 0);
  $delta = intval($_POST["delta"] ?? 0); // +1 +5 -1
  if ($num <= 0 || $delta === 0) err("ข้อมูลไม่ถูกต้อง");
  // ป้องกันคะแนนติดลบ
  $stmt = $mysqli->prepare("UPDATE contestants SET votes = GREATEST(0, votes + ?) WHERE num = ?");
  $stmt->bind_param("ii", $delta, $num);
  $stmt->execute();
  ok(["num"=>$num, "delta"=>$delta]);
}

if ($action === "remove") {
  need_pin();
  $num = intval($_POST["num"] ?? 0);
  if ($num <= 0) err("หมายเลขไม่ถูกต้อง");
  $stmt = $mysqli->prepare("DELETE FROM contestants WHERE num=?");
  $stmt->bind_param("i", $num);
  $stmt->execute();
  ok(["num"=>$num]);
}

err("unknown action");
