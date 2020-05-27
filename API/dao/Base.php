<?php  
  /* 
     DBBase 类： (1) 连接数据库 (2) sql代码执行
     当
   */
  /* 单例模式 */
  Class Base{
    static protected $s_conn;
    public $error_msg;
    //(1)构造函数和clone函数
    public  function __construct(){
    }
    //(3) 连接数据库,成功返回数据库对象，单例模式
    protected function getInstance(){ 
      if (!isset(self::$s_conn)){ 
         $dbconf=Utils::$g_config["db"];
         self::$s_conn=new mysqli($dbconf["host"],$dbconf["user"],$dbconf["pass"],$dbconf["dbname"]);
         if (self::$s_conn->connect_error){ 
            Utils::exit(-1,"can't connect to mysql!");
         }
      }
      return self::$s_conn;
    }    
    public function lastAffectedRows(){ 
        return self::$s_conn->affected_rows;
    }
    //sql特殊符号转义(可用于防止攻击). bool/digit/string
    protected function escape($val){
      if (is_bool($val)) return intval($val); //由于false变成字符串会是""空，这里转换下
      if (!is_numeric($val))
        $val =mysqli_real_escape_string(self::$s_conn,$val); 
      return $val;
    }
    // 执行sql 语句. 直接执行应先通过createSQL 做escape过滤
    public function runSQLAssoc($sql){
      $rst = self::$s_conn->query($sql);
      if (gettype($rst)=="boolean") return $rst;
      $data = array();
      while ($row = $rst->fetch_assoc()){
        $data[] = $row;
      }
      return $data;
    }
    // 执行sql 语句. 直接执行应先通过createSQL 做escape过滤
    public function runSQL($sql){
        $rst = self::$s_conn->query($sql);
        if (gettype($rst)=="boolean") return $rst;
        return $rst->fetch_all();
    }
    //创建sql. 自动会对所有参数执行escape操作。
    public function createSQL(){
        $args=func_get_args();
        for($i=1;$i<count($args);$i++) $args[$i]=self::escape($args[$i]);
        $sql=sprintf(...$args);
        return $sql;
    }
    // 如：createSQLAndRun("select * from stu where id=%s and name='%s'",1,"LIUYuying")
    // 创建并执行sql. 自动会对所有参数执行escape操作。
    public function createSQLAndRun(){ 
        $sql=self::createSQL(...func_get_args());   
        // echo $sql;
        return self::runSQL($sql);
    }
    public function createSQLAndRunAssoc(){ 
      $sql=self::createSQL(...func_get_args());  
      //echo $sql;
      return self::runSQLAssoc($sql);
    }
    public function getValueByID($table,$id,$col_name){
      $ret = $this->createSQLAndRun("select %s from %s where id = %d",
                                    $col_name,
                                    $table,
                                    $id);
      if (count($ret)==0) return null;
      return $ret[0][0];
    }
    public function getValueByISBN($table,$isbn,$col_name){
      $ret = $this->createSQLAndRun("select %s from %s where isbn = %d",
                                    $col_name,
                                    $table,
                                    $isbn);
      if (count($ret)==0) return null;
      return $ret[0][0];
    }
 } 
?>
