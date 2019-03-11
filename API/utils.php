<?php
define('DIR_API', str_replace('\\', '/', realpath(__DIR__ . '/')) . "/"); 
define("DIR_DAO", DIR_API."dao/"); 
require_once(DIR_API."filter.php");
require_once(DIR_API."xsession.php");
/****
 * (1) 不考虑多线程的情况，不加锁，线程不安全
 */
class Utils
{
    static function init(){ // 全局初始化函数 
        date_default_timezone_set('PRC');
        session_start();
        // 记录每次访问的URL和参数和IP.
        $post_data="";
        foreach($_POST as $key=>$val)
            $post_data.=sprintf("&%s=%s",$key,substr($val,0,100)); 
        $who=\StuSess\getKey("sid");
        $data = sprintf("[URL]%s\n[POST]%s\n[IP]%s[USER]%s\n",
                    $_SERVER['REQUEST_URI'],
                    $post_data, 
                    $_SERVER['REMOTE_ADDR'],
                    $who);
        self::log($data);
    }
    // 全局配置
    static $g_config = array(
        "log_path" => DIR_API . "log.txt",
        "pyAddr" => "http://localhost:81",
        "db" => array(
            "host" => "localhost",
            "user" => "root",
            "pass" => "youpass",
            "dbname" => "XLibrary"
        )
    ); 
    //返回数据给前端,如果error_code不为0，则$data返回具体出错信息，否则返回前端需要的信息
    static function exit($error_code, $data)
    {
        $arr = array("error_code" => $error_code,
            "data" => $data);
        die(json_encode($arr, true));
    }

    //读取POST/GET参数
    // 不定参数
    static private function __getParam($key){
        $default= null;   // 没有传递时的默认值
        $val = $default;
        if (isset($_POST[$key])) 
            $val = $_POST[$key];
        else
            if (isset($_GET[$key])) 
               $val = $_GET[$key];
        return $val;
    }
    static function getParams(){
        $kv=array();
        $args = func_get_args();
        for($i=0;$i<func_num_args();$i++){
            $key = $args[$i];
            $kv[$key]=self::__getParam($key);
        }
        return $kv;
    }
    //最后一个参数是正则匹配类型
    static function getParamWithFilter($key,$re_type=null){
        $val=self::__getParam($key);
        if ($re_type!=null){
            Filter::match($val,$re_type);
        }
        return $val;
    }  
    static private function getBacktrace(){     // 记录php栈调用信息.
        $bt = debug_backtrace();
        $rst="";  
        for ($i=count($bt)-1;$i>=2;$i--){ 
            $file= $bt[$i]["file"];
            $file= substr($file,strpos($file,"API")+4);  // 将共有的API前缀去掉
            $rst.= sprintf(" -> %s[L%s:%s][args:%s]" , $file,$bt[$i]["line"],$bt[$i]["function"],json_encode($bt[$i]["args"]));
        }
        return $rst;
    } 
    //记录日志
    static public function log($str){ 
        $str=str_replace("\n","\t",$str);
        $fp = fopen(self::$g_config["log_path"],'a'); 
        $data=sprintf("[Time]%s\n  [Data]%s\n  [Stack]%s\n",date("Y-m-d H:i:s"),$str,self::getBacktrace());
        fwrite($fp,$data);
        fclose($fp);
    }
    # 查询豆瓣上isbn对应图书信息，查找不到则扔出异常
    static public function getDoubanJson($isbn){  
        $pyAddr=Utils::$g_config["pyAddr"]; 
        $url = "$pyAddr/isbn/$isbn"; 
        $douban_json = file_get_contents($url);
        $douban_json = json_decode($douban_json,true); 
        if ($douban_json["error_code"]!=0)
            throw new Exception("在豆瓣API查询不到ISBN= $isbn 的图书");
        return $douban_json["data"];
    }
}

// 执行初始化函数
Utils::init();
?>