<?php
// 约定：所有数据都经过过滤后，才会进去dao层
/****** 接口 *******
 * (1) 登陆：/account/login.php?sid=&pwd=
 * 
 */
require_once(DIR_DAO."Base.php");
Class Students extends Base{
    private $m_conn;            //数据库连接对象 
    //(*)构造函数会自动连接数据库
    public function __construct(){
        $this->m_conn = self::getInstance();
    }
    // --------- 用户登陆 ------------------
    //(*) 从统一门户登陆
    private function loginFromXMU($sid,$pwd){
        $url = Utils::$g_config["pyAddr"]."/login?sid=$sid&pwd=$pwd";
        $ret = file_get_contents($url);
        $ret = json_decode($ret,true);
        return $ret;
    }
    //(*) 从数据库中登陆
    private function loginFromDB($sid,$pwd){
        $pwd=sha1(sha1($pwd));
        $ret=$this->createSQLAndRunAssoc("select * from stu where sid='%s' and pwd = '%s'",$sid,$pwd);
        //die($ret); 
        if ($ret!=""){//count($ret)>0){
            return array("error_code"=>0,
                         "data" => array("student" => $ret["name"])
                        );
        }else  
            return array("error_code"=>-2,
                         "data" => "用户不存在或者密码错误"
                        );
    }

    //(*) 用户是否在数据库中存在.(成功返回true,失败返回false)
    private function stuExistInDB($sid){ 
        $ret=$this->createSQLAndRun("select count(*) from stu where sid='%s'",$sid);
        return $ret[0][0]>0;
    }
    //(*) 登陆,成功返回0，失败返回失败代码。 -3表示需要输入验证码，其他表示用户名密码有误
    public function login($sid,$pwd){
        $ret = $this->loginFromDB($sid,$pwd);
        //$ret = $this->loginFromDB($sid,$pwd);
        if ($ret["error_code"]==0){ //成功
            // 如果用户已经存在，更新密码，否则添加用户
            if (!$this->stuExistInDB($sid))
                $this->register($sid,$pwd,$ret["data"]["student"]);
            else
                $this->updatePwd($sid,$pwd); 
        }else{
            $this->error_msg=$ret["data"]; 
        }
        return $ret["error_code"];
    }
    //(*) 更新密码 (成功返回true，失败返回false)
    public function updatePwd($sid,$pwd){
        $pwd=sha1(sha1($pwd));      
        $rst = $this->createSQLAndRun("update stu set pwd='%s' where sid='%s'",$pwd,$sid);
        if ($rst==false)
          Utils::log("密码更新失败!$sql");
        return $rst;
    }
    
    //(*) 添加用户 (成功返回true，失败返回false)
    public function register($sid,$pwd,$student_info){
        $name=$student_info["name"]; 
        $pwd = sha1(sha1($pwd)); 
        return $this->createSQLAndRun("INSERT INTO stu (sid, name, pwd) VALUES ('%s','%s','%s')",$sid,$name,$pwd);
    }
    
    // -------- 账号信息更新与修改 --------------
    // 想法： 每次登陆都更新似乎太慢了。可以每隔几天统一更新，或者一段时间后再更新，以后实现
    //(*) 获取用户信息
    public function getStuInfo($sid){
        $rst=$this->createSQLAndRunAssoc("select sid,name,phone,wechat_name,head_image,degree,grade,school,other from stu where sid=%s",$sid);
        return $rst[0];
    }
    // 更新用户信息
    public function updateStuInfo($sid,$school,$degree,$wechat_name,$phone,$grade,$other){
        $rst = $this->createSQLAndRun(
            "UPDATE `stu` SET `wechat_name`='%s',`phone`='%s',
                              `degree`='%s',`grade`='%s',`school`='%s',`other`='%s'
                  where sid='%s'",$wechat_name,$phone,$degree,$grade,$school,$other,$sid);
        return $this->lastAffectedRows()==1;
    }
    // 获取所有学生信息
    public function getStudentsList(){
        $rst=$this->createSQLAndRunAssoc("select sid,name,phone,wechat_name,head_image,degree,grade,school,other from stu");
        return $rst;
    }
}; 
?>
