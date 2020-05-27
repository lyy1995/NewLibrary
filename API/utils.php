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
    // 全局配置，从config.json中读取配置
    static $g_config =null; 
    static function initConfig(){  // 读取配置文件
        $config_file = DIR_API."config.json";
        $f=fopen($config_file,"r");
        $config= json_decode(fread($f,99999),true);

        // 字符串替换，将${DIR_API} 替换成真实地址DIR_API。仅支持一层递归
        foreach($config as $key=>$val){
            if (is_string($val)){
                $config[$key] = str_ireplace('${DIR_API}',DIR_API,$val,$count);
            }
        }

        self::$g_config = $config;
    }
    static function init(){ // 全局初始化函数 
        date_default_timezone_set('PRC');
        self::initConfig();
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
        try{
            if ($re_type!=null){
                Filter::match($val,$re_type);
            } 
        }catch (Exception $e) {
            throw new Exception("参数$key = $val 格式错误");
        } 
        return $val;
    }  
    // 获取参数中的图片并保存
    static function saveUploadedFile($key,
                                    $save_path_without_prefix,
                                    $suffix_allowed,
                                    $max_size_in_MB){ 
        $suffix_allowed = explode("|",$suffix_allowed);
        if (isset($_POST)){
            $name = $_FILES[$key]['name']; 
            $size = $_FILES[$key]['size']; 
            $name_tmp = $_FILES[$key]['tmp_name'];  
            if (empty($name)) {
                throw new Exception("未上传图片");
            } 
            $suffix = strtolower(substr(strrchr($name, '.'), 1)); //获取文件类型 
            if (!in_array($suffix, $suffix_allowed)) {  
                throw new Exception("仅支持以下文件格式：".json_encode($suffix_allowed));
            } 
            if ($size > ($max_size_in_MB <<20)) { 
                throw new Exception(sprintf("文件大小应小于%dMB,当前文件大小：%sMB",$max_size_in_MB,$size/1024/1024));  
            }  
            // 保存的路径
            $path = sprintf("%s.%s",$save_path_without_prefix,$suffix); 
            if (!move_uploaded_file($name_tmp, $path)) 
                throw new Exception("请检测服务器权限，无法移动上传文件。");
            return $path;
        }else
            throw new Exception("请用POST方式上传文件,Key=$key");
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
    
    # 
    # 查询isbn对应图书信息，查找不到则扔出异常
    static public function getBookInfoByISBN($isbn){  
        $pyAddr=Utils::$g_config["pyAddr"]; 
        $url = "$pyAddr/isbn/$isbn"; 
        $book_json = file_get_contents($url); 
        $book_json = json_decode($book_json,true); 
        if ($book_json["error_code"]!=0)
            throw new Exception("查询不到ISBN= $isbn 的图书");
        // 转换格式 
        return $book_json["data"];
    }
    
}

// 执行初始化函数
Utils::init();
?>
