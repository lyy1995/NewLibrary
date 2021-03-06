import requests
import sys
import os
from bs4 import BeautifulSoup
import random
import urllib.parse
import time
import json
### 豆瓣 API ###
# (1) [XML]  http://api.douban.com/book/subject/isbn/9787308083256
# (2) [JSON] https://api.douban.com/v2/book/isbn/:9787111128069
def doubanBooksAPI(isbn):
    url = "https://api.douban.com/v2/book/isbn/%s" %(isbn)
    resp = requests.get(url)
    parsed = json.loads(resp.text)
    if "msg" in parsed:
        return None
    else:
        return parsed

def jisuAPI(isbn):
    url = "http://api.jisuapi.com/isbn/query?appkey=c36391e4c1161d28&isbn=%s" %(isbn)
    resp = requests.get(url)  
	#print(type
    #obj = json.loads(resp.text)
    obj = json.loads(resp.content.decode("utf-8"))
    if int(obj["status"]) == 0:    
        print(obj["result"]["title"])	
        obj = obj["result"] 
        return {
            "isbn" : isbn,
            "author" : obj["author"],
            "publisher": obj["publisher"],
            "title" : obj["title"],
            "subtitle" : obj["subtitle"],
            "pubdate" : obj["pubdate"],
            "summary" : obj["summary"],
            "picture" : obj["pic"],
            "other" : obj
        }
    else:
        return None 
"""
成功返回
{
  "isbn": "xx", 
  "author" : [""],
  "publisher" :"xx",
  "pubdate" : "",
  "summary" : ""
  "picture" : ""
  "others" : ""
}
"""
def getBookInfoByISBN(isbn):
    data = jisuAPI(isbn) 
    return data 
if __name__ == "__main__":
    a=getBookInfoByISBN("9787308083256")
    if a==None:
        print("No")
    else:
        print(a)