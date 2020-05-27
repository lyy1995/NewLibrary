<?php
require_once("../utils.php");
require_once(DIR_DAO."Students.php");
// 学生账号登陆
function main(){ 
    // 参数读取
    try{
        $sid = Utils::getParamWithFilter("sid");
        $pwd = Utils::getParamWithFilter("pwd");
    } catch (Exception $e) {
        Utils::exit(-2,$e->getMessage());
    } 
    // 登陆
    $stu= new Students();
    $error_code=$stu->login($sid,$pwd);
    if ($error_code==0){
        $stu = new Students();
        $info = $stu->getStuInfo($sid);  
        \StuSess\login($sid,$info["name"],$info);         //设置session值
        Utils::exit(0,"登陆成功!");
    }else{
        Utils::exit($error_code,$stu->error_msg);
    }
}
/********* ***************/
main();
?>


