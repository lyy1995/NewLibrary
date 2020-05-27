import pymysql
import json
import platform
import threading
import time
class BookRetrieval:
    @staticmethod  
    def osType():  # Linux返回 1，window返回2 （解决use_unicode的问题，虽然方法不优美）
        str = platform.platform()
        if str.find("Linux")!=-1:
            return 1
        elif str.find("Windows")!=-1:
            return 2
        else:
            exit(-3)
        return 

    def connDB(self):
        config = self.config["db"]
        if BookRetrieval.osType()==1:
            use_unicode = True
            charset = "utf8"
        else:
            use_unicode = False
            charset = "latin1"
        return pymysql.connect(host=config["host"],
                                     user=config["user"],
                                     passwd=config["pass"],
                                     db=config["dbname"],
                                     use_unicode=use_unicode,
                                     charset=charset) 

    def __init__(self,config): 
        self.last_update_time=-9999       # 最后更新books的时间
        self.config= config 
        self.id2book = {}                 # 需要考虑库存量、已借出图书数量的更新
        self.kgram = {}                   # 图书信息一般不变，同一本书无需更新 
        self.update_books() 
        return

    # 添加关键字  key(电脑) -> book_id (2) ->score(10)
    def add(self,key,book):
        if key not in self.kgram:
            self.kgram[key] ={}
        book_id = book["id"]
        if book_id not in self.kgram[key]:
            self.kgram[key][book_id]=0
        score = 1
        if len(key)==2:
            score = 5
        self.kgram[key][book_id] +=score
        return

    def updateKGram(self,book):
        str = book["title"]+  book["subtitle"]+ book["author"]+book["publisher"]+book["summary"]
        # unigram
        l = len(str)
        for i in range(l):
            # unigram
            uni = str[i:i+1]
            self.add(uni,book)
            # bigram
            bi = str[i:i+2]
            if len(bi)==2 :
                self.add(bi,book)
        return

    def myUtf8Decoder(self,kv):
        for key in kv:
            val=kv[key]
            if type(val)==type(b""):
                val = str(val, encoding="utf8")
            kv[key]=val
        return kv

    # 从服务器读取
    def update_books(self):
        # 最多10秒与数据库更新数据
        if time.time()-self.last_update_time < 10 :
            return 
        conn = self.connDB() # 由于有超时存在，每次重新连接数据库
        cursor = conn.cursor()
        # 查看当前存储的东西是否更新
        cursor.execute("select * from book")  # 库存为空的情况也算进去，查询的时候再剔除
        data = cursor.fetchall()
        field_name = [field[0] for field in cursor.description]

        for item in data:
            item = dict(zip(field_name, item)) #todo
            book = self.myUtf8Decoder(item)
            if book["id"] not in self.id2book:  # 新书，加入查询key
                self.updateKGram(book)  
            self.id2book[book["id"]] = book     # 更新图书信息
            # print("[*]update_books: %s" %(book["title"]))
        
        self.last_update_time = time.time()
        return

    # 返回 book_id -> score
    def find(self,result,key):
        if key in self.kgram:
            idsets = self.kgram[key]
            for id in idsets:
                score = idsets[id]
                if id not in result:
                    result[id] = 0
                result[id] +=score
        return

    # 返回{ book_id -> cnt} , {book_id->book}
    def user_search(self,str,max_num=50): 
        self.update_books()
        id2score={}
        id2b = {}
        l = len(str)
        for i in range(l):
            # unigram
            uni = str[i:i+1]
            self.find(id2score,uni)
            # bigram
            bi = str[i:i+2]
            if len(bi)==2 :
                self.find(id2score,bi)
        for id in id2score:
            id2b[id] = self.id2book[id] 

        books=[]
        # 按照分数从高到低排序
        while len(id2score)!=0: 
            max_score=-1
            max_id = -1
            for id in id2score:
                if id2score[id]> max_score:
                    max_score = max(id2score[id], max_score)
                    max_id = id
            id2score.pop(max_id) 
            # 
            if len(books)>max_num:
                break
            # 超过5本，且score太小
            if len(books)>5 and max_score<=1:
                break
            if id2b[max_id]["stock"]>0:
                books.append(id2b[max_id]) 
        return books
        

####### 测试 #########
import os
def load_config(path):
    f = open(path,"r")
    data = f.read()
    obj = json.loads(data)
    return obj
if __name__ == "__main__":
    config_path= os.path.join(os.path.split(__file__)[0],"../config.json")
    config=load_config(config_path)
    b = BookRetrieval(config)
    books = b.user_search("法学书籍")
    for b in books:
        print(b["title"])
    # b.show();