const express = require("express")
const app = express();
const mongoose = require("mongoose")
const port = 3000;
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
const Articles = require("./models/myarticles")
const AuthUser = require("./models/authUser")
var moment = require("moment");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
var jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const { check, validationResult } = require("express-validator");
app.use(express.json())
require('dotenv').config()
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, "torrent", (err) => {
            if (err) { res.redirect("/login"); } else { next(); }
        });
    } else {
        res.redirect("/login");
    }
};

const checkIfUser = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, "torrent", async (err, decoded) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                const currentUser = await AuthUser.findById(decoded.id);
                res.locals.user = currentUser;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};
app.get("*", checkIfUser);

app.get("/signout", (req, res) => {
    res.cookie("jwt", "", { maxAge: 1 });
    res.redirect("/");
});

app.get("/home", requireAuth, (req, res) => {
    // result ==> array of objects
    Articles.find()
        .sort({ createdAt: -1 })
        .then((result) => {
            res.render("index", { arr: result, moment: moment });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/", (req, res) => {
    res.render("before");
});

app.get("/user/add", requireAuth, (req, res) => {
    res.render("user/add");
});

app.get("/login", (req, res) => {
    res.render("authUser/login");
});

app.get("/signup", (req, res) => {
    res.render("authUser/signup");
});

app.post("/signup",
    [
        check("email", "Please provide a valid email").isEmail(),
        check("password", "Password must be at least 8 characters with 1 upper case letter and 1 number").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/),
    ],
    async (req, res) => {
    try {
        const objError = validationResult(req);
        console.log(objError.errors);
        if (objError.errors.length > 0) {
            return res.json({ validationError: objError.errors });
        }
        const isCurrentEmail = await AuthUser.findOne({ email:  req.body.email    })
        console.log(isCurrentEmail)
        if (isCurrentEmail) {
            return res.json({ existEmail: "Email already exist" });
        }
        const newUser = await AuthUser.create(req.body);
        var token = jwt.sign({ id: newUser._id }, "torrent");
        res.cookie("jwt", token, { httpOnly: true, maxAge: 2592000000 });
        res.json({id:newUser._id});

    } catch (error) {
        console.log(error);
    }
});


app.post("/login", async (req, res) => {
    const loginUser = await AuthUser.findOne({ email: req.body.email });
    console.log(loginUser);

    if (loginUser == null) {
        res.json({ noEmailexist: "Email no exist , Try to signup" });
    } else {
        const match = await bcrypt.compare(req.body.password, loginUser.password);
        if (match) { // true
            var token = jwt.sign({ id: loginUser._id }, "torrent");
            res.cookie("jwt", token, { httpOnly: true, maxAge: 2592000000 });
            res.json({ id: loginUser._id });
        } else {
            res.json({wrongPassword : "Wrong Password"})
        }
    }
});


app.get("/forget_password", (req, res) => {
    res.render("authUser/forget_password");
});


app.post("/user/add", (req, res) => {
    Articles.create(req.body)
        .then(() => { 
            res.redirect('/home') 
        })
        .catch((err) => {
        console.log(err)
    })
});


app.post("/user/update/:id", (req, res) => {
    console.log("Updating document with ID:", req.params.id);
    console.log("Request body:", req.body);

    Articles.updateOne({ _id: req.params.id }, req.body)
        .then(() => {
            console.log("Document updated successfully");
            res.redirect("/home");
        }).catch((err) => {
            console.log(err);
        });
});

app.get("/user/update/:id", requireAuth, (req, res) => {
    Articles.findById(req.params.id)
        .then((result) => {
            res.render("user/update", { obj: result, moment: moment });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/user/view/:id", requireAuth, (req, res) => {
    const ID_USER = req.params.id;
    Articles.findById(ID_USER).then((result) => {
        res.render("user/view", { arr: result, moment: moment });
    }).catch((err) => {
        console.log(err);
    })
});

app.delete('/user/delete/:id', requireAuth, (req, res) => {
    Articles.deleteOne({ _id: req.params.id }).then((result) => {
        res.redirect("/home");
    });
})

mongoose.connect(process.env.connectMongoose)
    .then(() => {
        app.listen(port, () => {
            console.log(`http://localhost:${port}/`);
        });
    })
    .catch((err) => {
        console.log(err);
    })