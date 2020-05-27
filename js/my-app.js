// Initialize your app
var myData={
	isLogin:false,
	user_info: null,          //登陆信息
	cur_book_info:null,
	cur_book_donators:null,
	cur_book_borrower:null,
	cur_book_stock_in_sites:null,
	sites: null,              // 藏书点
	returned_books:[],
	not_returned_books:[],
	donation_books:{
		accepted:[],
		rejected:[],
		waiting:[]
	}
} 
var myApp = new Framework7({
    animateNavBackIcon: true,
    // Enable templates auto precompilation
    precompileTemplates: true,
    // Enabled pages rendering using Template7
	swipeBackPage: false,
	swipePanelOnlyClose: true,
	pushState: true,
	template7Pages: true 
});
// 正在处理窗口
var pending={
    show:(msg="正在处理，请稍后...")=>{
        myApp.openModal(".popup-pending");
		$(".popup-pending").show();
		$(".popup-pending").find(".pendding-text").text(msg);
    },
    close: () =>{
        myApp.closeModal();
    }
}
var error_window={
    show:(msg="出错！")=>{
        myApp.openModal(".popup-error");
		$(".popup-error").show();
		$(".popup-error").find(".error-text").text(msg);
    },
    close: () =>{
        myApp.closeModal();
    }
} 
// 图书封面找不到时，触发此事件
function image_not_found(ele){
	$(ele).attr("src","images/books_cover/not_found.jpg");
}
/* 判断是否登陆，如果登陆，载入登陆信息、存取书信息 */
function index_init(){   
	home_vue = new Vue({
		el:'.user_login_info',
		delimiters: ['${', '}'],
		data:{ 
			g_data:myData
		},
        methods: { 
			logout: function(){
				$.get("./API/account/logout.php",function(data){ 
					obj = JSON.parse(data);
					if(obj.error_code==0){
						location.href="index.html";
					}else
					    alert(obj.data);
				});
			}
		}
	});  
	//借阅记录
	rent_recorts = new Vue({
		el :"#rent-records",
		delimiters: ['${', '}'],
		data:{
			"title":"我的借阅记录",
			g_data:myData
		},
		methods:{
			showReturnImage: (filename)=>{
				if (filename==null){
					alert("还书无上传图片");
					return;
				} 
				path=`API/uploads/return_book_images/${filename}`; 
				window.open(path);
			}
		}
	}); 
	donation_records = new Vue({
		el :".popup-donation-records",
		delimiters: ['${', '}'],
		data:{ 
			g_data :myData
		} 
	});
	menu_vue = new Vue({
		el : ".toolbar-icon",
		delimiters: ['${', '}'],
		data:{
			g_data :myData
		}
	});

	personal_info_vue = new Vue({
		el : ".popup-personal-info",
		delimiters: ['${', '}'],
		data:{
			g_data :myData
		},
		methods:{
			update_user_info:(e)=>{
				$.ajax({
					url: "./API/account/updateUserInfo.php",
					dataType: "json",
					data: myData.user_info, 
					success: function (data) {  
						if(data.error_code==0){  
							alert("更新成功");
							myApp.closeModal();
						}else {   
							alert(data.data);
						}
					}
				});
				e.preventDefault();
			}
		}
	});

	book_detail_vue = new Vue({
		el : ".popup-book-detail",
		delimiters: ['${', '}'],
		data:{
			g_data :myData
		},
		methods:{
			update_cur_book:(book)=>{
				myData.cur_book_info=book; 
				myData.cur_book_donators=null;
				myData.cur_book_borrower=null;
				myData.cur_book_stock_in_sites=null;
				// 载入捐赠者信息
				$.ajax({
					url: `./API/public_api/whoDonateTheBook.php?isbn=${book.isbn}`,
					dataType: "json",
					data: myData.user_info, 
					success: function (data) {  
						if(data.error_code==0){   
							myData.cur_book_donators=data.data;
						}else {   
							alert(data.data);
						}
					}
				});
				// 载入借阅者信息
				$.ajax({
					url: `./API/public_api/whoBorrowTheBook.php?isbn=${book.isbn}`,
					dataType: "json",
					data: myData.user_info, 
					success: function (data) {  
						if(data.error_code==0){   
							myData.cur_book_borrower=data.data;
						}else {   
							alert(data.data);
						}
					}
				});
				//载入藏书点藏书信息
				url =`./API/site/getStockInAllSites.php?book_id=${book.id}`;
				$.get(url,function(data){
					obj= JSON.parse(data);
					if (obj.error_code==0){
						myData.cur_book_stock_in_sites=obj.data;
					}
				});
				myApp.openModal(".popup-book-detail");
				$(".popup-book-detail").show();
			}
		}
	})
	/* 以下通过ajax获取信息 */
	// 用户信息
	$.ajax({
		url: "./API/account/getCurUserInfo.php",
		dataType: "json",
		data: {
			isLogin :false,
			user_info:{}
		},
		async: true,
		success: function (data) { 
			if(data.error_code==0){ 
				home_vue.g_data.user_info = data.data;
				home_vue.g_data.isLogin = true; 
			}else {  
				home_vue.g_data.isLogin=false;
				myApp.popup(".popup-login");
			}
		}
	});
	
	$.ajax({
		url: "./API/site/getAllSites.php",
		dataType: "json",  
		success: function (data) { 
			myData.sites=data.data;
		}
	});
	//借阅记录
	$.ajax({
		url: "./API/book/myBooksBorrowList.php",
		dataType: "json",
		data: {},
		async: true,
		success: function (data) {
			if(data.error_code==0){
				myData.returned_books =data.data.returned;
				myData.not_returned_books= data.data.not_returned;
			}else {
				console.log("无法获取借书记录，可能是未登录");
			}
		}
	});
	//捐书记录
	$.ajax({
		url: "./API/book/myBooksDonationList.php",
		dataType: "json",
		data: {},
		async: true,
		success: function (data) { 
			if(data.error_code==0){ 
				myData.donation_books.accepted = data.data["审核通过"]; 
				myData.donation_books.rejected = data.data["审核失败"];
				myData.donation_books.waiting = data.data["等待审核"];
			}else{
				console.log("无法获取捐书记录，可能是未登录");
			}
		}
	});
}
// Export selectors engine
var $$ = Dom7;
myApp.onPageBeforeInit('home', function(page){ 
})
myApp.onPageInit('home', function(page) {
	console.log("By LIUYuying@XMU,2020.For any questions you can contact me at 447246534@qq.com");
	index_init();
}).trigger(); //And trigger it right away 

// Add main View
var mainView = myApp.addView('.view-main', {
    // Enable dynamic Navbar
    dynamicNavbar: false,
});
var subnaview = myApp.addView('.view-subnav');


$(document).ready(function() {
		$("#RegisterForm").validate();
		$("#LoginForm").validate();
		$("#ForgotForm").validate();
		$(".close-popup").click(function() {					  
			$("label.error").hide();
		});
		$('.close_info_popup').click(function(e){
			$('.info_popup').fadeOut(500);						  
		});
});


$$(document).on('pageInit', function (e) {
		$("#RegisterForm").validate();
		$("#LoginForm").validate();
		$("#ForgotForm").validate();
		$(".close-popup").click(function() {					  
			$("label.error").hide();
		});

	
})

$("#LoginForm").validate({
	submitHandler: function(form){
		var formData = myApp.formToJSON('#LoginForm');
		pending.show("正在登陆,请等待...(~.~)");
		$.ajax({
			url: "./API/account/login.php",
			//dataType: "json",
			data: formData,
			type: "post",
			async: true,
			success: function (data) {
			    console.log(data);
				pending.close();
				if(data.error_code==0){
					myApp.closeModal('.popup-login');
					$("#login").attr("disabled",true);
					location.reload();
					}
//				}else
//				if(data.error_code==-3){
//					alert("需要输入验证码！请先前往 i.xmu.edu.cn 尝试登陆，登陆成功后再在此页面登陆。点击确定跳转过去。")
//					window.open("http://i.xmu.edu.cn");
//				}else
//				{
//					alert("用户名或密码错误");
//				}
			},
			error: function (xhr, textStatus) {
				console.log('错误');
				console.log(xhr);
				console.log(textStatus);
			},
		});

	}
});
 

myApp.onPageInit('books_list', function (page) {
    // Do something here when page with data-page="about" attribute loaded and initialized
    books_each_page = 10;
    books_list_vue = new Vue({
        delimiters: ['${', '}'],
        el: '#books-list-div',
        data: {
            books:[],
            page_id:1,
			total_pages:0,
			total_books:0,
			search_mode: false,
			stocks_sum:0,
			lended_sum:0
        },
        // computed:{},
        methods: { 
			getbook: (page_id)=>{
				books_list_vue.page_id = page_id;
				$.ajax({
					url: "./API/public_api/getBooksListInLibrary.php",
					dataType: "json",
					data:{
						page_id: page_id,
						books_each_page: books_each_page,
					},
					success(data){
						if (data.error_code==0){ 
							books_list_vue.books= data.data.books; 
							books_list_vue.total_pages=data.data.total_pages; 
							books_list_vue.total_books=data.data.total_books;
							books_list_vue.stocks_sum=data.data.stocks_sum;
							books_list_vue.lended_sum=data.data.lended_sum;
						}else{
							alert("读取失败");
						}
					}
				})
			}, 
			goto_page: (pageid)=>{
				pageid-=1;
				total = books_list_vue.total_pages;
				pageid = (pageid%total+total)%total+1;
				books_list_vue.getbook(pageid);
			},
            prev_page: (event)=> {
				books_list_vue.goto_page(books_list_vue.page_id-1); 
            },
            next_page: (event)=> {
				books_list_vue.goto_page(books_list_vue.page_id+1); 
            }
        }
	}); 
	books_list_vue.getbook(1);
});

myApp.onPageInit('index', function (page) { 
	location.href="./";
});
myApp.onPageInit('books_retrieval', function (page) {
	books_retrieval_vue=new Vue({
		el:"#books-retrieval-div",
		delimiters:["@{","}"],
		data:{
			 search_str:"",
			 books:null,   // null表示未搜索
			 show_items:10,
			 search_finish: false
		},
		methods:{
			more: ()=>{
				books_retrieval_vue.show_items+=10;
			},
			search_book: ()=>{
				str=books_retrieval_vue.search_str;
				if (str== ""){
					error_window.show("搜索内容不能为空！") 
					return;
				}
				pending.show(); 
				url=`API/public_api/bookRetrieval.php?qry=${str}`;
				$.get(url,function(data){
					obj = JSON.parse(data);
					if (obj.error_code==0){
						books_retrieval_vue.books=obj.data; 
						pending.close(); 
					}else{
						alert(obj.data); 
					}
				});
			}
		}
	});
});
myApp.onPageInit('return-book', function (page) {  
	return_book_vue=new Vue({
		el:"#return—book-div",
		delimiters:["@{","}"],
		data:{
			g_data : myData,
			return_site_id : 0
		},
		methods:{
			choose_image:(isbn)=>{
				if (return_book_vue.return_site_id == 0){
					alert("请选择还书地点");
					return;
				}
				alert("请将书放在还书书架上，并拍照上传"); 
				dom_file=$("<input type=file accept='image/*'></input>");
				dom_file.change(function(){    
					// 获取图片blob地址src
					let src, url = window.URL || window.webkitURL || window.mozURL, files = dom_file[0].files;
					if (files.length==0) {alert("没有选择图片");return ;} 
					return_book_vue.return_book(isbn,files[0]);
					//开始还书
				});
				dom_file.click();  
			},
			return_book:(isbn, file)=>{
				var returnForm = new FormData();
				returnForm.append("image",file);
				returnForm.append("isbn",isbn);
				returnForm.append("site_id",return_book_vue.return_site_id)
				pending.show("正在处理还书请求...");
				$.ajax({
					url: "./API/book/returnBookWithImage.php",
					dataType: "json",
					data: returnForm,
					type: "post",
					processData: false,
					contentType: false,
					success: function (data) {
						pending.close();
						if(data.error_code==0){
							alert("还书成功");
							location.reload();
						}else {
							error_window.show(`出错啦！${data.data}`);
						} 
					}
				});
			}
		}
	});
});
myApp.onPageInit('borrow_book', function (page) { 
	borrow_book_vue = new Vue({
		el: '#borrow_div',
		delimiters:["@{","}"],
		data: {
			cur_status: 0,               // 0表示等待识别图片，1表示正在识别，2表示识别成功 
			isbn : "",
			phone : "", 
			book:{},
			stock_in_sites:[],
			borrow_site_id:0
		},
		methods: { 
			selectImage: () => {
				dom_file=$("<input type=file accept='image/*'></input>");
				dom_file.change(function(){
					pending.show("正在识别ISBN码");
					let src, url = window.URL || window.webkitURL || window.mozURL, files = dom_file[0].files;
					if (files.length==0) return;
					let file = files[0];
					if (url) {
						src = url.createObjectURL(file);
					} else {
						src = e.target.result;
					}
					RecognizeBarCode(src,borrow_book_vue.cbAfterRecogBarcode);
				});
				dom_file.click();
			},
			inputISBNbyHand:()=>{
				borrow_book_vue.fetchBookInfo();
			},
			cbAfterRecogBarcode: (result)=> { 
				if (!result ||!result.codeResult){ 
					pending.close();
					error_window.show("无法识别图中ISBN条形码，请重新拍摄或手工输入ISBN!");
					borrow_book_vue.cur_status=0;
					return ;
				}
				borrow_book_vue.isbn=result.codeResult.code;
				borrow_book_vue.fetchBookInfo();
			},
			getCurrentISBN: ()=>{
				_isbn=borrow_book_vue.isbn;
				isbn="";
				for (var i=0;i<_isbn.length;i++){
					if (_isbn[i]>='0' && _isbn[i]<='9'){
						isbn+=_isbn[i];
					}
				}  
				return isbn;
			},
			borrow_book:()=> {
				site_id= borrow_book_vue.borrow_site_id;
				if (site_id==0){
					alert("请选中借书的地点~");
					return;
				} 
				$.ajax({
					url: "API/book/borrowBook.php",
					dataType: "json",
					data: {
						"isbn": borrow_book_vue.getCurrentISBN(),
						"site_id" : site_id
					},
					async: false,
					success: function (data) { 
						if(data.error_code==0){
							alert("借书成功！");
							borrow_book_vue.cur_status=0;
							location.href="./";
						}else{
							alert(data.data);
						}
					}
				});
			},
			fetchStockInSites: (book_id)=>{ 
				//载入藏书点藏书信息
				url =`./API/site/getStockInAllSites.php?book_id=${book_id}`;
				$.get(url,function(data){
					obj= JSON.parse(data);
					if (obj.error_code==0){
						borrow_book_vue.stock_in_sites=obj.data;
					}
				});
			},
			fetchBookInfo:()=> {  
				isbn = borrow_book_vue.getCurrentISBN();
				pending.show(`正在获取ISBN码为${isbn}的图书信息...`);
				if (isbn==""){
					pending.close();
					borrow_book_vue.cur_status=0; 
					error_window.show("ISBN 不能为空");
					return ;
				}
				$.ajax({
					url: "./API/isbn.php",
					dataType: "json",
					data: {
						"isbn": isbn,
					},
					async: true,
					success: function (data) {
						pending.close();
						if(data.error_code==0){
							borrow_book_vue.cur_status = 2; 
							borrow_book_vue.book = data.data;
							borrow_book_vue.fetchStockInSites(data.data.id);
						}else {
							borrow_book_vue.cur_status=0; 
							error_window.show(data.data);
						}
					}
				});
			}
		}
	});
});  
myApp.onPageInit('books_donation', function (page) { 
	books_donation = new Vue({
		el: '#books_donation_div',
		delimiters:["@{","}"],
		data: {
			g_data:myData,
			cur_status: 0,               // 0表示等待识别图片，1表示正在识别，2表示识别成功 
			isbn : null, 
			seen: false,
			fetchType: 1,            // 1:送至分馆；2: 上门取书 , 3: 放到书箱
			fetchAddr:window.localStorage["fetchAddr"]==undefined?"":window.localStorage["fetchAddr"],            // 上门取书此字段才有意义 
			book: { 
			},
			word: ""
		},
		methods: {
			change_contact: ()=>{
				alert("即将跳转到个人信息页面修改联系方式"); 
				myApp.openModal(".popup-personal-info");
				$(".popup-personal-info").show(); 
			},
			setFetchType: (type) => {
				return;
	            books_donation.fetchType=type;
			},
			selectImage: (e) =>{
				dom_file=$("<input type=file accept='image/*'></input>");
				dom_file.change(function(){   
					pending.show("正在识别图片ISBN码...");
					let src, url = window.URL || window.webkitURL || window.mozURL, files = dom_file[0].files;
					if (files.length==0) return;
					let file = files[0]; 
					if (url) {
						src = url.createObjectURL(file);
					} else {
						src = e.target.result;
					}  
					RecognizeBarCode(src,books_donation.cbAfterRecogBarcode);
				});
				dom_file.click();   
			},
			inputISBNbyHand: ()=>{ 
				books_donation.updateBookInfo();
			},
			updateBookInfo:()=>{
				isbn=filterISBN(books_donation.isbn);
				pending.show(`正在获取ISBN码为${isbn}的图书信息...`);
				$.ajax({
					url: "./API/isbn.php",
					dataType: "json",
					data: {
						"isbn": isbn,
					},
					async: true,
					success: function (data) {
						pending.close();
						if(data.error_code==0){
							books_donation.cur_status=2; 
							books_donation.book=data.data;
						}else {
							books_donation.cur_status=0; 
							error_window.show(data.data);
						}
					},
					error:function(){
						pending.close();
					}
				});
			},
			cbAfterRecogBarcode: (result) => { 
				if (!result ||!result.codeResult){ 
					pending.close();
					error_window.show("无法识别图中ISBN条形码，请重新拍摄!");
					books_donation.cur_status=0;
					return;
				} 
				books_donation.isbn=result.codeResult.code;
				books_donation.updateBookInfo();
			},
			cancel: (e)=>{
				e.preventDefault();
				books_donation.cur_status=0;
			},
			DonateBook:(e)=>{
				e.preventDefault();  
				how_to_fetch={
					"how":books_donation.fetchType
				} 
				if (books_donation.fetchType==2){ //上门取书
					if (books_donation.fetchAddr==""){
						alert("请输入取书地点");
						return ;
					}
					
					window.localStorage["fetchAddr"]=books_donation.fetchAddr;
					how_to_fetch["where"]=books_donation.fetchAddr; 
				}
				$.ajax({
					url: "API/book/donateBook.php",
					dataType: "json",
					data: {
						"isbn": filterISBN(books_donation.isbn),
						"donator_word":books_donation.word,
						"how_to_fetch": JSON.stringify(how_to_fetch)  
					},
					async: false,
					success: function (data) { 
						if(data.error_code==0){
							alert(data.data);
							location.reload(); 
						}else{
							alert(data.data);
						}
					},
					error: function (xhr, textStatus) {
						console.log('错误');
						console.log(xhr);
						console.log(textStatus);
					},
				}); 
			}
		}
	});
}) 
