var express        = require('express'), 
	app            = express(), 
	port           = 5000;
	mongoose       = require('mongoose'), 
	bodyParser     = require('body-parser'), 
	methodOverride = require('method-override'); 

mongoose.connect("mongodb://localhost/voting_app"); 
app.set("view engine", "ejs"); 
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));

var items = [];
var count; 

var pollSchema = new mongoose.Schema({
	name: String,
	items: [
		 {
			label: String, 
			voteTotal: {type: Number, default: 0}
		}
	]
});
var Poll = mongoose.model("Poll", pollSchema);

app.get("/", function(req, res){
	res.render("index");
});

app.get("/polls", function(req, res){
	Poll.find({}, function(err, polls){
		if (err) {
			console.log(err);
		} else {
			res.render("polls", {polls: polls});
		}
	});
});

app.get("/polls/new", function(req, res){
	res.render("new.ejs");
});

app.post("/polls", validatePollItems, function(req, res){
	Poll.create({
		name: req.body.title, 
		items: items
	}, function(err, poll){
		if (err) {
			console.log(err);
		} else {
			res.redirect("/polls");
		}
	});
});

app.get("/polls/:id", function(req, res){
	Poll.findById(req.params.id, function(err, found){
		if (err) {
			console.log(err);
		} else {
			res.render("show", {poll: found});
		}
	});
});

//edit route
app.get("/polls/:id/edit", function(req, res){
	Poll.findById(req.params.id, function(err, found){
		if (err) {
			console.log(err);
		} else {
			res.render("edit", {poll: found});
		}
	});
});

//update route
app.put("/polls/:id", updatePollItems, function(req, res){
	Poll.findByIdAndUpdate(req.params.id, {
		name: req.body.title, 
		items: items
	}, function(err, updated){
		if (err) {
			console.log(err);
		} else {
			console.log(updated);
			res.redirect("/polls/" + updated._id);
		}
	});
});

app.put("/polls/:id/vote/:itemID", function(req, res){
	var updatedVoteTotal;
	var newItems = []
	Poll.findById(req.params.id, function(err, found) {
		if (err) {
			console.log(err);
		} else {
			found.items.forEach(function(i){
				if (i._id == req.params.itemID) {
					updatedVoteTotal = ++(i.voteTotal);
					newItems.push({label: i.label, voteTotal: updatedVoteTotal});
				} else {
					newItems.push({label: i.label, voteTotal: i.voteTotal});
				}
			});
			Poll.findByIdAndUpdate(req.params.id, {
				items: newItems
			}, function(err, updated){
				if (err) {
					console.log(err);
				} else {
					res.redirect("/polls/" + req.params.id);
				}
			});
		}
	});
});

//destroy route
app.delete("/polls/:id", function(req, res){
	Poll.findByIdAndRemove(req.params.id, function(err){
		if (err) {
			res.redirect("/polls");
		} else {
			res.redirect("/polls");
		}
	});
});

function validatePollItems(req, res, next) {
	//clear items array
	items = [];
	if (req.body.item1 == "" || req.body.item2 =="") {
		return res.send("you must enter at least two polling options");
	}
	items.push({
		label: req.body.item1
	}, 
	{
		label: req.body.item2
	});
	if (req.body.item3 !== "") {
		items.push({
			label: req.body.item3
		});
	}
	return next();
}

function updatePollItems(req, res, next) {
	//clear items array
	items = [];
	if (req.body.item1 == "" || req.body.item2 =="") {
		return res.send("you must enter at least two polling options");
	}
	Poll.findById(req.params.id, function(err, found){
		if (err) {
			console.log(err);
		} else {
			items.push({
				label: req.body.item1,
				voteTotal: found.items[0].voteTotal
			}, 
			{
				label: req.body.item2,
				voteTotal: found.items[1].voteTotal
			});
			if (req.body.item3 !== "") {
				if (!found.items[2].voteTotal) {
					console.log("empty");
					items.push({
						label: req.body.item3, 
						voteTotal: 0
					});
				} else {
					console.log("created");
					items.push({
						label: req.body.item3, 
						voteTotal: found.items[2].voteTotal
					});
				}
			}
			return next();
		}
	});
}

app.listen(port, function(){
	console.log("listening at port: " + port);
});
