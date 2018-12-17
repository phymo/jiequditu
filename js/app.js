//使用knockout.js实时监测输入数据
var filterText = ko.observable("");
var map;
var infoWindow;
//定义纽约时报API地址;
var surl="http://api.nytimes.com/svc/search/v2/articlesearch.json?sort=newest&api-key=8a605aa4c0ee4dca8ae70fff8c1fd30d&q=";

//保存地点数据
var placesData=[{
	position: {lat:34.70, lng:135.49},
	title: "Osaka"
	},
	{
	position: {lat:34.96, lng:135.79},
	title: "Kyoto"
	},
	{
	position: {lat:34.66, lng:135.19},
	title: "Kobe"
	},
	{
	position: {lat:34.70, lng:135.79},
	title: "Nara"
	},
	{
	position: {lat:35.24, lng:136.89},
	title: "Nagoya"
	}
];

//定义对象,传入地点数据
var Place=function(data){
//	定义self,为了内部函数使用
	var self=this;
	this.position=data.position;
	this.title=data.title;
//	当输入数据与存储数据一致时返回visible为true
	this.visible=ko.computed(function(){
		var re=filterText().toLowerCase();
		var placeName=self.title.toLowerCase();
		return(placeName.indexOf(re)!=-1)
		
	});
//	使用Google API确定marker位置和动画
	this.marker=new google.maps.Marker({
		position: self.position,
		title: self.title,
		animation:google.maps.Animation.DROP
	});
//	点击时infowindow 打开 并显示动画
	google.maps.event.addListener(self.marker,"click", function(){
		infoWindow.setContent(self.title);
		infoWindow.open(map,self.marker);
		
		if(self.marker.getAnimation()!=null){
			self.marker.setAnimation(null);
		}
		else{
			self.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function(){
				self.marker.setAnimation(null);
			},2000)
		}
//		使用AJAX传入纽约时报API 文章搜索数据并将最新文章snippet显示在infowindow
	 	$.ajax({
	 		url: surl+self.title,
	 		dataType:"json",
	 		timeout:6000
	 	}).done(function(data){
	 		infoWindow.setContent(data.response.docs[0].snippet);
	 		infoWindow.open(map,self.marker);
	 	}).fail(function(){
	 		infoWindow.setContent("can't access NYtimes");
	 		infoWindow.open(map,self.marker);
	 	})
	
	
	})
	
};

var viewModel=function(){
	var self=this;
	this.placesList=[];
//	传入数据和marker
	placesData.forEach(function(place){
		self.placesList.push(new Place(place))
	});
	this.placesList.forEach(function(place){
		place.marker.setMap(map,place.position);
	});
//	符合搜索条件的item加入filteredlist 并显示
	this.filteredList=ko.computed(function(){
		var result=[];
		self.placesList.forEach(function(place){
			if(place.visible()){
				result.push(place);
				place.marker.setMap(map,place.position);
			}
			else{
				place.marker.setMap(null);
			}
		})
		return result;	
	})
//	列表点击触发marker点击动作
	this.listClick=function(place){
		google.maps.event.trigger(place.marker,"click");
		
	}
}
//当Google map加载出错时,alert
function goError(){
	alert("can't access google map");
}
//在Googlemap API调用成功后执行start 函数,加载谷歌地图
function start(){
	map=new google.maps.Map(document.getElementById("map"), {center:placesData[1].position,zoom:9});
	infoWindow=new google.maps.InfoWindow();
	ko.applyBindings(new viewModel());
};

//function showHide(){
//	if($("#side-menu").display==block){
//		$("#side-menu").display==none;
//	}
//}
$("button").click(function(){
	$("#side-menu").toggle();
});
