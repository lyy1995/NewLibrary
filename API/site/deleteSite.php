<?php
require_once("../utils.php");
require_once(DIR_DAO."Site.php");
// 添加一个地点
// 
function main(){ 
    // 参数读取
    try{
        \AdminSess\isLoginOrThrowException(); 
        $s = new Site();  
        $id = Utils::getParamWithFilter("id"); 
        $s->deleteSite($id);
        Utils::exit(0,"删除成功");
    } catch (Exception $e) {
        Utils::exit(-2,$e->getMessage());
    }
}
/********* ***************/
main();
?>