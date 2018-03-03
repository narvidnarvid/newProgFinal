var article = require('../models/article');
var Article = article.Article;
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;

module.exports = {
    createArticle: function (callback, newArticle) {
        newArticle = new Article(newArticle);
        newArticle.save(function (err, article) {
            if (err){
                console.error(err);
            }
            else {
                callback(null, article.id);
            }
        });
    },
    listArticle: function (callback) {
        Article.find({}, function (err, articles) {
            callback(null, articles);
        });
    },
    getArticleByID: function (callback, _id) {
        Article.findOne({'_id': _id}, function (err, article) {
            callback(null, article);
        })
    },
    updateArticleCount: function (callback, article) {
        Article.findOne({'_id': article._id}, function (err, dbArticle) {
            dbArticle.searchCount++; 
            dbArticle.save(function (err) {
                if (err) {
                    console.error(err);
                }
                else {

                    callback(null);
                }
            });
        });
    },
};