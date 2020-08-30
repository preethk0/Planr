	var express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	flash = require("connect-flash"),
	mongoose  = require("mongoose"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	Event = require("./models/event"),
	User = require("./models/user");

mongoose.connect("mongodb://localhost/planr", {
	useUnifiedTopology: true,
	useNewUrlParser: true,
	useFindAndModify: false
});

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash());

app.use(require("express-session")({
	secret: "secret",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
})

app.get("/", function(req, res) {
	res.render("landing");
});

app.get("/login", function(req, res) {
	res.render("login");
})

app.post("/login", passport.authenticate("local", {
	successRedirect: "/home", 
	failureRedirect: "/login"
	}), function(req, res) {
})

app.get("/signup", function(req, res) {
	res.render("signup");
})

app.post("/signup", function(req, res) {
	User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
		if(err){
			req.flash("error", err.message);
			return res.redirect("/signup");
		} 
		passport.authenticate("local")(req, res, function() {
			req.flash("success", "Welcome to Planr " + user.username + "!");
			res.redirect("/home");
		});
	});
})

app.get("/logout", function(req, res) {
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect("/");
});

app.get("/home", function(req, res) {
	console.log(req.user._id);
	res.render("home");
})

app.post("/home", function(req, res) {
	User.findById(req.user._id, function(err, acc) {
		if(err) {
			console.log(err);
		} else {	
			var title = req.body.title;
			var groupId = req.body.groupId;
			var start = req.body.start;
			var end = req.body.end;
			var newEvent = {title: title, groupId: groupId, start: start, end: end};
			Event.create(newEvent, function(err, ev) {
				if(err) {
					console.log(err);
				} else {
					acc.events.push(ev);
					acc.save();
				}
			})
		}
	})
})

app.put("/home", function(req, res) {
	console.log(req.body.start);
	if(req.body.start == " ") {
		var data = {title: req.body.title};
		console.log(data);
		Event.findOneAndUpdate({groupId: req.body.groupId}, data, {upsert: false}, function(err, doc) {
			if(err) {
				console.log(err);
			}
		});
	} else {
		var data = {title: req.body.title, groupId: req.body.groupId, start: req.body.start, end: req.body.end};
		console.log(data);
		Event.findOneAndUpdate({groupId: req.body.groupId}, data, {upsert: false}, function(err, doc) {
			if(err) {
				console.log(err);
			}
		});
	}
});

app.delete("/home", function(req, res) {
	console.log("event dropped");
	console.log(req.body.gropuId);
	Event.findOneAndRemove({groupId: req.body.groupId}, function(err, ev) {
		console.log(ev);
		if(err) {
			console.log(err);
		}
	});
	console.log("success");
});

app.get("/load", function(req, res) {
	User.findById(req.user._id, function(err, acc) {
		Event.find({'_id': {$in: acc.events}}, function(err, events) {
			res.send(events);
		})
	})
})

app.listen(process.env.PORT || 3000, () => {
	console.log("starting Planr server...");
});