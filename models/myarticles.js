const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const myarticles = new Schema({
    elnasher :String,
    id : String ,
    addressOfArticle : String,
    bodyOfArticle : String
}, { timestamps: true })  // timestamps

//  { timestamps: true } 

/*
    created on
    updated on
*/

const Article = mongoose.model("article", myarticles);

// export the model
module.exports = Article;
