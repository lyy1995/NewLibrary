import requests
import sys
import os
from bs4 import BeautifulSoup
import random
import urllib.parse
import time

class STULogin:
    URLLogin        = "http://ids.xmu.edu.cn/authserver/login?service=http%3A%2F%2Fi.xmu.edu.cn%2F"
    URLNeedCaptcha  = "http://ids.xmu.edu.cn/authserver/needCaptcha.html"
    URLCaptchaImage = "http://ids.xmu.edu.cn/authserver/captcha.html"

    HEADERS = {
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Referer": "http://ids.xmu.edu.cn/authserver/login",
        "Accept-Encoding" : "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,ru;q=0.6,zh-TW;q=0.5"
    }

    def __init__(self,sid,pwd):
        self.sess = requests.Session()
        self.sid = sid
        self.pwd = pwd
        return

    def __saveCaptchaTo(self,path="./tmp"):      # 验证码保存到本地，以返回给用户，让用户自己输入
        filename = "%s.captcha.jpg" %(self.sid)
        path=os.path.join(path,filename)
        r = self.sess.get(self.URLCaptchaImage,headers=self.HEADERS)
        if r.status_code == 200:
          with open(path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=128):
              f.write(chunk)
          return path
        else:
          return "error.jpg"

    def __getHiddenInputParams(self):            # 获取隐藏参数，不知是干嘛的
        resp=self.sess.get(self.URLLogin,headers=self.HEADERS)
        soup = BeautifulSoup(resp.text, "html.parser")
        params={
          "lt" : soup.find(attrs={"name":"lt"}).get("value"),
          "dllt" : soup.find(attrs={"name":"dllt"}).get("value"),
          "execution" : soup.find(attrs={"name":"execution"}).get("value"),
          "_eventId" : soup.find(attrs={"name":"_eventId"}).get("value"),
          "rmShown" : soup.find(attrs={"name":"rmShown"}).get("value"),
        }
        # print(params)
        return params

    def __getLoginFailedReason(self,r):          # 通过response返回登陆失败原因
        if r.text.find("无效的验证码") !=-1:
            self.loginFailedReason =  "验证码错误"
        elif r.text.find("您提供的用户名或者密码有误")!=-1:
            self.loginFailedReason = "您提供的用户名或者密码有误"
        elif r.text.find("认证服务不可用,请稍后再试，或联系管理员")!=-1:
            self.loginFailedReason = "认证服务不可用,请稍后再试，或联系管理员"
        else:
            self.loginFailedReason = "未知错误，请联系管理员"
            # print(r.text)
        return self.loginFailedReason

    def __loginWithoutCaptcha(self):            # 不需要验证码登陆
        payload = self.__getHiddenInputParams()
        payload["username"] = self.sid
        payload["password"] = self.pwd
        resp=self.sess.post(self.URLLogin,data=payload,headers=self.HEADERS,timeout=100)
        if resp.text.find("欢迎您")!=-1:
            return None
        else:
            return self.__getLoginFailedReason(resp)

    def __loginWithCaptcha(self,captcha):               # 需要验证码的登陆
        payload = self.__getHiddenInputParams()
        payload["captchaResponse"] = captcha
        payload["username"] = self.sid
        payload["password"] = self.pwd
        resp=self.sess.post(self.URLLogin,data=payload,headers=self.HEADERS,timeout=100)
        if resp.text.find("安全退出")!=-1:
            return None
        else:
            return self.__getLoginFailedReason(resp)



    ######################### PUBLIC ####################################
    def getStuInfo(self):
        stu={}
        # 获取名字
        try:
            #resp = self.sess.get(self.URLLogin,headers=self.HEADERS,timeout=50)
            resp = self.sess.get("http://i.xmu.edu.cn",headers=self.HEADERS,timeout=50)
            soup = BeautifulSoup(resp.text, "html.parser")
            stu["name"] = soup.find(id="welcomeMsg").get_text()[4:]
        except:
            stu["name"] = "Unknown"
        return stu

    # 换验证码
    def reloadCaptcha(self):
        return self.__saveCaptchaTo()

    # 判断当前用户是否需要验证码
    def needCaptcha(self):                    # 判断是否需要验证码
        payload={
            "username":self.sid,
            "_": int(time.time()*1000)
        }
        r = self.sess.get(STULogin.URLNeedCaptcha,params=payload,headers=self.HEADERS)
        return r.text.strip() == "true"

    def login(self,captcha=None):
        if captcha!=None:
            return self.__loginWithCaptcha(captcha)
        else:
            return self.__loginWithoutCaptcha()


if __name__ == "__main__":
    stu=STULogin("23020171153044", "181325")
    # stu=STULogin("23020161153315", "159147")
    if stu.needCaptcha():
        stu.reloadCaptcha()
        captcha = input("输入验证码")
        if stu.login(captcha) == None:
              print("login success")
        else:
              print(stu.loginFailedReason)
    else:
        if stu.login() == None:
              print("login success")
        else:
              print(stu.loginFailedReason)
    print(stu.getStuInfo())
