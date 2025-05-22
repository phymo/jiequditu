//使用knockout.js实时监测输入数据
const filterText = ko.observable("");
let map;
let infoWindow;
//定义纽约时报API地址;
const surlBase="http://api.nytimes.com/svc/search/v2/articlesearch.json?sort=newest&q="; 
const nytCache = {}; // Cache for NYT API responses

// Function to fetch NYT articles with caching
const fetchNytArticles = (placeTitle, callback) => {
    const apiKey = window.NYT_API_KEY;

    if (!apiKey) {
        console.error("NYT API Key (window.NYT_API_KEY) is not configured.");
        callback("NYT API Key not configured. Cannot fetch articles.");
        return; // Stop further execution
    }

    if (nytCache[placeTitle]) {
        callback(nytCache[placeTitle]);
        return;
    }

    const requestUrl = surlBase + placeTitle + "&api-key=" + apiKey;

    $.ajax({
        url: requestUrl, 
        dataType: "json",
        timeout: 6000
    }).done(data => { // Arrow function
        if (data.response && data.response.docs && data.response.docs.length > 0) {
            const snippet = data.response.docs[0].snippet;
            nytCache[placeTitle] = snippet; 
            callback(snippet);
        } else {
            const noArticleMsg = "No articles found for " + placeTitle;
            nytCache[placeTitle] = noArticleMsg; 
            callback(noArticleMsg);
        }
    }).fail(() => { // Arrow function
        const errorMsg = "can't access NYtimes";
        callback(errorMsg);
    });
};

//保存地点数据
const placesData=[{
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
const Place = function(data){ // Constructor function, keep as function for `this` and prototype
	const self=this; // `this` refers to the Place instance
	this.position=data.position;
	this.title=data.title;
	this.visible=ko.computed(() => { // Arrow function, `self` (this of Place) is lexically captured
		const re=filterText().toLowerCase();
		const placeName=self.title.toLowerCase();
		return(placeName.indexOf(re)!=-1)
	});
	this.marker=new google.maps.Marker({
		position: self.position,
		title: self.title,
		animation:google.maps.Animation.DROP
	});
	google.maps.event.addListener(self.marker,"click", () => { // Arrow function, `self` (this of Place) is lexically captured
		infoWindow.setContent("<div><strong>" + self.title + "</strong></div><div><em>Loading NYT articles...</em></div>");
		infoWindow.open(map,self.marker);
		if(self.marker.getAnimation()!=null){
			self.marker.setAnimation(null);
		} else {
			self.marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(() => { // Arrow function, `self` (this of Place) is lexically captured
				self.marker.setAnimation(null);
			},2000); 
		}
		fetchNytArticles(self.title, content => { // Arrow function for callback
			if (infoWindow.getMap() && infoWindow.anchor === self.marker) {
				infoWindow.setContent("<div><strong>" + self.title + "</strong></div><div>" + content + "</div>");
			} 
		});
	});
};

const viewModel = function(){ // Constructor function, keep as function for `this` and prototype
	const self=this; // `this` refers to the viewModel instance
	self.placesList=[];
	placesData.forEach(item => { // Arrow function, `self` (this of viewModel) is lexically captured
		self.placesList.push(new Place(item))
	});

    // Function to update marker visibility based on place.visible()
    // This is a method-like function within viewModel, defined using `const`
    const updateMarkerVisibility = () => { // Arrow function, `self` (this of viewModel) is lexically captured
        self.placesList.forEach(place => { // Arrow function
            if (place.visible()) {
                place.marker.setMap(map);
            } else {
                place.marker.setMap(null);
            }
        });
    };

    // Initial marker visibility setup
    updateMarkerVisibility();

    // Subscribe to filterText changes to update marker visibility
    // `updateMarkerVisibility` is already an arrow function capturing `self`
    filterText.subscribe(updateMarkerVisibility);

	self.filteredList=ko.computed(() => { // Arrow function, `self` (this of viewModel) is lexically captured
		let result=[]; // `let` because it's reassigned with .push
		self.placesList.forEach(place => { // Arrow function
			if(place.visible()){
				result.push(place);
			}
		});
		return result;	
	});

	// listClick is a method of viewModel, keep as function if it were to use `this` directly.
	// However, it's assigned to self.listClick, so it's fine as is, or could be an arrow function.
	// For consistency with Knockout patterns, often methods are left as functions.
	// Let's make it an arrow function as it doesn't use its own `this`.
	self.listClick = (place) => {
		google.maps.event.trigger(place.marker,"click");
	};
};

const goError = () => { // Arrow function, does not use `this`
	const errorDiv = document.getElementById("map-error-display");
	if (errorDiv) {
		errorDiv.textContent = "Failed to load Google Maps. Please check your internet connection or try again later.";
		errorDiv.style.display = "block"; 
	} else {
		alert("Failed to load Google Maps and error display element is missing.");
	}
};

const start = () => { // Arrow function, does not use `this`
	map=new google.maps.Map(document.getElementById("map"), {center:placesData[1].position,zoom:9});
	infoWindow=new google.maps.InfoWindow();
	ko.applyBindings(new viewModel());
};

// jQuery event handler. `this` inside the handler refers to the DOM element.
// If we change to an arrow function, `this` would be the `this` of the surrounding scope (global window object).
// However, this specific function doesn't use `this`, so it's safe to convert.
$("button").click(() => {
	$("#side-menu").toggle();
});
