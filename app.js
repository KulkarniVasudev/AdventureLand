
//================================================================================================================================
//							PHASE 3 / VERSION 3 / ADVENTURES - LAND 
//							AUTHOR: VASUDEV KRISHNA KULKARNI
//							COPYRIGHTS RESERVED.
//-===============================================================================================================================

/* ACCOMPLISHED:

				 * FETCH THE DATA FROM USER THROUGH THE FORM AND POST IT ON THE /POSTS WALL.
				 * STYLE THE /POST WALL
				 * CREATE A DB AND ENTER A FEW INITAL RECS AND ALSO UPDATE  THOSE RECORDS ENTERED BY USER THRU FORMS.
				 * FETCH THE DATA FROM DB AND SHARE IT ON THE WALL.
				 * WHENEVER A POST IS CLICKED, DIRECT TO A SEPERATE ROUTE AND DISPLAY THE CONTENT. /SHOW ROUTE.
				 * DESCRIPTION ADDED.
				 * COMMENTS ADDED.  COMMENTS ARE BEING DISPLAYED SUCCESSFULY
				 * CREATE A COMMENT BUTTON AND TAKE THE COMMENT FROM THE FORM ADD IT TO THE COMMENTS.
				 * DISPLAY THE COMMENT ON THE WALL.
				 * STYLE THE FOLLOWING: 
					- 1.  THE JUMBOTRON.
					- 2.  /POSTS WALL
					- 3. POSTS/NEW WALL (THE FORM FOR ADDING NEW POST WITH VALIDATION.)
					- 4. POSTS/:ID WALL FOR INDIVISUAL DISPLAY
					- 5. COMMENT SECTION
					- 6. COMMENT FORM WALL WITH VALIDATION

	  			
TO-DO: 
				* ADDING AUTHENTICATION

				
*/


var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(express.static("public"));

//Setting up the database.
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/adventureposts",{useNewUrlParser: true, useUnifiedTopology: true});

var commentSchema = mongoose.Schema({
	name: String,
	text: String
});

var Comment = mongoose.model("Comment", commentSchema); 

var AdventureSchema = new mongoose.Schema({
	name: String,
	image: String,
	location: String,
	description: String,
	comments:  [commentSchema]
});
var Adventure = mongoose.model("Adventure", AdventureSchema);
//************************************************************************************
//CONFIGURING THE PASSPORT.JS														
	var passport = require("passport");										
	var localStrategy = require("passport-local");								
	app.use(require("express-session")({
	secret: "Once again the same",
	resave: false,
	saveUninitialized: false
}));


	var User = require("./models/user");
	
	app.use(passport.initialize());
app.use(passport.session());
	passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
//************************************************************************************
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});
//This is a landing page.
app.get("/", function(req, res){

	res.redirect("/posts");
});
//This route will display all the posts. ANd any post added by the user will be displayed on this page.
app.get("/posts", function(req,res){

	Adventure.find({}, function(err, postArray){
		if(err){
			console.log(err);
		}
		else{
		res.render("posts",{ postArray : postArray});
	}
	});
	
});

//This route will get the data from form and post it on the post wall.
app.post("/posts",isLoggedIn, function(req, res){
	 var name = req.user.username;
	 var location = req.body.location;
	 var image = req.body.image;
	 var description = req.body.description;
	 var obj = {
	 	name: name,
	 	image: image,
	 	location: location,
	 	description: description
	 }
	 Adventure.create(obj,function(err,posts){
	 	if(err){
	 		console.log("Error occured in fetching the data from the form and storing it on the database.");
	 	}
	 });
	 res.redirect("/posts");
});

//This route will allow user to enter the data . ie. form.
app.get("/posts/new",isLoggedIn, function(req, res){
	res.render("new");
});

//This route will display the indivisual post details.
app.get("/posts/:id",isLoggedIn, function(req,res){
		Adventure.findById(req.params.id, function(err, specificpost){
			if(err){
				console.log(err);
			}
			else{
				res.render("show",{specificpost: specificpost});
			}
		});
});

//Commments
app.post("/posts/:id/comments",isLoggedIn, function(req, res){
	Adventure.findById(req.params.id, function(err,co){
			if(err){
				console.log(err);
			}
			else{
				 var name = req.user.username;
				 var text= req.body.comms;

				Comment.create({
					name:name,
					text:text
				}, function(err, c){
					if(err){
						console.log(err);
					}
					else{
						co.comments.push(c);
						co.save();
					}
				});
			
				res.redirect("/posts/"+co._id);
			}
	});
});
//A from that allows the user to add a new comment.
app.get("/posts/:id/comments/new",isLoggedIn, function(req,res){
	Adventure.findById(req.params.id, function(err, coa){
		if(err){
			console.log(err);
		}
		else{
			res.render("newcomment",{ coa: coa});
		}
	});
	 
});
//*********************************************************
//Authentication routes.
//Signup/ register roues 1. get 2.post

app.get("/register", function(req, res){
	res.render("register");

});

//2.Register post route
app.post("/register", function(req, res){
	User.register(new User({username: req.body.username}), req.body.password, function(err, user){
		if(err){
			console.log(err);
			res.render("register");
		}
		passport.authenticate("local")(req, res, function(){
				res.redirect("/posts");
		});
	});
});

//LOGI ROUTES 1.LOGIN-GET 2.LOGIN-POST
app.get("/login", function(req,res){
	res.render("login");
});

//LOGIN POST
app.post("/login", passport.authenticate("local", {
	successRedirect: "/posts",
	failureRedirect: "/login"
}));

///LOGOUT
app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");
});

/// edit
app.get("/posts/:id/edit", function(req, res){
		Adventure.findById(req.params.id, function(err, campsedit){
				if(err){
					res.redirect("/posts");
				}
				else{
					res.render("edit",{campsedit:campsedit});
				}
		});
});


app.post("/posts/:id", function(req, res){
	Adventure.findByIdAndUpdate(req.params.id, req.body.campsedit, function(err, camps){
			if(err){
				res.redirect("/posts");
			}
			else{
				res.redirect("/posts/"+req.params.id);
			}
	});
});

app.post("/:id", function(req, res){
Adventure.findByIdAndRemove(req.params.id, function(err, output){
	if(err){
		res.redirect("/posts");
	}
	else{
		res.redirect("/posts");
	}
});
});
//isLoggedIn
function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}
app.listen(3000, function(req,res){
	console.log("Server started.");
});