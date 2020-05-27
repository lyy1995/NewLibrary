<?php
require_once("../utils.php");
require_once(DIR_DAO."Books.php");
// 获取馆中图书
function main(){ 
    // 参数读取
    try{ 
        $page = Utils::getParamWithFilter("page_id","digit"); 
        $books_each_page = Utils::getParamWithFilter("books_each_page","digit");
        $b = new Books(); 
        $data = $b->getBooksListInLibraryAtPage($page,$books_each_page);
        Utils::exit(0,$data);
    } catch (Exception $e) {
        Utils::exit(-2,$e->getMessage());
    }
}
/********* ***************/
main();
?>


