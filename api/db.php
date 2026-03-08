<?php
require_once __DIR__.'/_bootstrap.php';

// !! ใส่ค่าของคุณเอง !!
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'sciday';

$mysqli = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_errno) err('เชื่อมต่อฐานข้อมูลไม่ได้: '.$mysqli->connect_error);

// utf8mb4
$mysqli->set_charset('utf8mb4');
