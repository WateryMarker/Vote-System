<?php
require __DIR__ . "/_bootstrap.php";
try {
  $conn->query("TRUNCATE TABLE recycle_vote");
  jres(["ok"=>true]);
} catch(Exception $e){
  jres(["ok"=>false, "error"=>"RESET_FAILED", "detail"=>$e->getMessage()]);
}
