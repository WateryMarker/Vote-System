<?php
// แสดง error ตอนพัฒนา (ปิดได้ภายหลัง)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

// helper: อ่าน input (JSON หรือ form)
function inbody() {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw, true);
  return is_array($j) ? $j : $_POST;
}

// helper: ตอบกลับ
function ok($data = null){ echo json_encode(['ok'=>true,  'data'=>$data], JSON_UNESCAPED_UNICODE); exit; }
function err($msg, $code = 400){ http_response_code(200); echo json_encode(['ok'=>false, 'error'=>$msg], JSON_UNESCAPED_UNICODE); exit; }
