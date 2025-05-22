//使用knockout.js实时监测输入数据
var filterText = ko.observable("");
var map;
var infoWindow;
//定义纽约时报API地址;
// Hardcoded API key removed from here.
var surlBase="http://api.nytimes.com/svc/search/v2/articlesearch.json?sort=newest&q="; 
var nytCache = {}; // Cache for NYT API responses

// Function to fetch NYT articles with caching
function fetchNytArticles(placeTitle, callback) {
    var apiKey = window.NYT_API_KEY;

    if (!apiKey) {
        console.error("NYT API Key (window.NYT_API_KEY) is not configured.");
        callback("NYT API Key not configured. Cannot fetch articles.");
        return; // Stop further execution
    }

    if (nytCache[placeTitle]) {
        callback(nytCache[placeTitle]);
        return;
    }

    var requestUrl = surlBase + placeTitle + "&api-key=" + apiKey;

    $.ajax({
        url: requestUrl, 
        dataType: "json",
        timeout: 6000
    }).done(function(data) {
        if (data.response && data.response.docs && data.response.docs.length > 0) {
            var snippet = data.response.docs[0].snippet;
            nytCache[placeTitle] = snippet; 
            callback(snippet);
        } else {
            var noArticleMsg = "No articles found for " + placeTitle;
            nytCache[placeTitle] = noArticleMsg; 
            callback(noArticleMsg);
        }
    }).fail(function() {
        var errorMsg = "can't access NYtimes";
        // Do not cache general API access errors for a specific placeTitle here,
        // as it might be a temporary issue or related to the key for all requests.
        callback(errorMsg);
    });
}

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
	var self=this;
	this.position=data.position;
	this.title=data.title;
	this.visible=ko.computed(function(){
		var re=filterText().toLowerCase();
		var placeName=self.title.toLowerCase();
		return(placeName.indexOf(re)!=-1)
	});
	this.marker=new google.maps.Marker({
		position: self.position,
		title: self.title,
		animation:google.maps.Animation.DROP
	});
	google.maps.event.addListener(self.marker,"click", function(){
		infoWindow.setContent("<div><strong>" + self.title + "</strong></div><div><em>Loading NYT articles...</em></div>");
		infoWindow.open(map,self.marker);
		if(self.marker.getAnimation()!=null){
			self.marker.setAnimation(null);
		} else {
			self.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function(){
				self.marker.setAnimation(null);
			},2000); 
		}
		fetchNytArticles(self.title, function(content) {
			if (infoWindow.getMap() && infoWindow.anchor === self.marker) {
				infoWindow.setContent("<div><strong>" + self.title + "</strong></div><div>" + content + "</div>");
			} 
		});
	});
};

var viewModel=function(){
	var self=this;
	self.placesList=[];
	placesData.forEach(function(item){
		self.placesList.push(new Place(item))
	});

    // Function to update marker visibility based on place.visible()
    function updateMarkerVisibility() {
        self.placesList.forEach(function(place) {
            if (place.visible()) {
                place.marker.setMap(map);
            } else {
                place.marker.setMap(null);
            }
        });
    }

    // Initial marker visibility setup
    updateMarkerVisibility();

    // Subscribe to filterText changes to update marker visibility
    filterText.subscribe(updateMarkerVisibility);

	self.filteredList=ko.computed(function(){
		var result=[];
		self.placesList.forEach(function(place){
			if(place.visible()){
				result.push(place);
			}
		});
		return result;	
	});

	self.listClick=function(place){
		google.maps.event.trigger(place.marker,"click");
	};
};

function goError(){
	// alert("can't access google map"); // Old alert
	var errorDiv = document.getElementById("map-error-display");
	if (errorDiv) {
		errorDiv.textContent = "Failed to load Google Maps. Please check your internet connection or try again later.";
		errorDiv.style.display = "block"; // Make the error div visible
	} else {
		// Fallback if the div is somehow not found (though it should be)
		alert("Failed to load Google Maps and error display element is missing.");
	}
}

function start(){
	map=new google.maps.Map(document.getElementById("map"), {center:placesData[1].position,zoom:9});
	infoWindow=new google.maps.InfoWindow();
	ko.applyBindings(new viewModel());
};

$("button").click(function(){
	$("#side-menu").toggle();
});
