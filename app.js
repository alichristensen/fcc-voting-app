var express        = require('express'), 
	app            = express(), 
	port           = process.env.PORT || 5000,
	flash          = require('connect-flash');
	mongoose       = require('mongoose'), 
	bodyParser     = require('body-parser'), 
	methodOverride = require('method-override'), 
	Poll           = require('./models/poll.js'), 
	User           = require('./models/user.js'), 
	passport       = require('passport'), 
	LocalStrategy  = require('passport-local'); 

var indexRoutes = require('./routes/index');

mongoose.connect(process.env.DATABASEURL); 
app.set("view engine", "ejs"); 
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());

var items = [];

//PASSPORT CONFIG
app.use(require('express-session')({
	secret: "pearl is my favorite", 
	resave: false, 
	saveUninitialized: false
})); 
app.use(passport.initialize()); 
app.use(passport.session()); 
passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success'); 
	next();
});

app.use(indexRoutes);

app.listen(port, function(){
	console.log("listening at port: " + port);
});