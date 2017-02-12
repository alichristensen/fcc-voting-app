var express = require('express'), 
	router  = express.Router(), 
	Poll    = require('../models/poll');


//==============================ROUTES====================================
router.get("/", function(req, res){
	Poll.find({}, function(err, polls){
		if (err) {
			console.log(err);
		} else {
			res.render("polls", {polls: polls});
		}
	});
});

router.get("/polls", function(req, res){
	Poll.find({}, function(err, polls){
		if (err) {
			console.log(err);
		} else {
			res.render("polls", {polls: polls});
		}
	});
});

router.get("/polls/new", isLoggedIn, function(req, res){
	res.render("new.ejs");
});

router.post("/polls", isLoggedIn, validatePollItems, function(req, res){
	var author = {
		id: req.user._id, 
		username: req.user.username
	};
	Poll.create({
		name: req.body.title, 
		items: items, 
		author: author, 
		date_created: Date.now()
	}, function(err, poll){
		if (err) {
			console.log(err);
		} else {
			res.redirect("/polls");
		}
	});
});

router.get("/polls/:id", function(req, res){
	var count = 0;
	Poll.findById(req.params.id, function(err, found){
		if (err) {
			console.log(err);
		} else {
			found.items.forEach(function(item) {
				count = count + item.voteTotal;
			});
			res.render("show", {poll: found, total: count});
		}
	});
});

//edit route
router.get("/polls/:id/edit", validatePollOwnership, function(req, res){
	Poll.findById(req.params.id, function(err, found){
		if (err) {
			console.log(err);
		} else {
			res.render("edit", {poll: found});
		}
	});
});

//update route
router.put("/polls/:id", validatePollOwnership, updatePollItems, function(req, res){
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

//update vote count route
router.put("/polls/:id/vote/:itemID", validateIP, function(req, res){
	var updatedVoteTotal;
	var newItems = [];
	var ip_address = req.header('x-forwarded-for') || req.connection.remoteAddress;
	Poll.findById(req.params.id, function(err, found) {
		if (err) {
			console.log(err);
		} else {
			found.ips.push(ip_address);
			found.save();
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
router.delete("/polls/:id", validatePollOwnership, function(req, res){
	Poll.findByIdAndRemove(req.params.id, function(err){
		if (err) {
			res.redirect("/polls");
		} else {
			res.redirect("/polls");
		}
	});
});

//AUTH ROUTES
router.get("/register", function(req, res){
	res.render("register");
});

router.post("/register", function(req, res) {
	User.register(new User({
		username: req.body.username
	}), req.body.password, function(err, user){
		if (err) {
			return res.render("register", {"error" : err.message});
		} 
		passport.authenticate("local")(req, res, function(){
			req.flash('success', 'You are now registered as ' + user.username);
			res.redirect("/polls");
		});
	});
});

router.get("/login", function(req, res){
	res.render("login");
});

router.post("/login", passport.authenticate("local", {
	successRedirect: "/polls", 
	failureRedirect: "/login"
}), function(req, res){
});

router.get("/logout", function(req, res){
	req.logout();
	res.redirect("/polls");
});

//=====================MIDELWARES==========================

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
				if (!found.items[2]) {
					items.push({
						label: req.body.item3, 
						voteTotal: 0
					});
				} else {
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

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		req.flash('success', "You must be logged in to do that");
		res.redirect("/login");
	}
}

function validatePollOwnership(req, res, next) {
	if (req.isAuthenticated()) {
		Poll.findById(req.params.id, function(err, found){
			if (err) {
				res.redirect("back");
			} else {
				if (found.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash('error', "You don't have permission to do that");
					res.redirect("/polls");
				}
			}
		});
	}
}

function validateIP(req, res, next) {
	var duplicateIP = false;
	Poll.findById(req.params.id, function(err, found){
		if (err) {
			res.redirect("back");
		} else {
			found.ips.forEach(function(ip){
				if (ip === (req.header('x-forwarded-for') || req.connection.remoteAddress)) {
					duplicateIP = true;
				}
			}); 
			if (duplicateIP) {
				req.flash('error', "You've already voted in this poll");
				res.redirect("back");
			} else {
				next();
			}
		}
	})
}

module.exports = router;