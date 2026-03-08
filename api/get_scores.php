<?php
require_once __DIR__.'/db.php';

$sql = "SELECT num,
               MAX(NULLIF(name, '')) AS name,
               SUM(votes) AS votes
        FROM recycle_vote
        GROUP BY num
        ORDER BY votes DESC, num ASC";

$res = $mysqli->query($sql);
$data = [];
if ($res) while ($row = $res->fetch_assoc()) $data[] = $row;

ok($data);
