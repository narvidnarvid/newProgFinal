var express = require('express');
var articleManager = require('../managers/articleManager');

module.exports = function (app) {

    // Get all Articles
    app.get('/Articles/GetAll', function (req, res, next) {
        articleManager.listArticle(function (err, articles) {
            if (err) {
                console.log('GetAllArticles Err: ' + err);
                res.next();
            } else {
                res.json(articles);
            }
        });
    });

        // Update article
        app.put('/Articles/UpdateArticleCount', function (req, res, next) {
            articleManager.updateArticleCount(function (err, id) {
                    if (err) {
                        console.log('updateArticleCount Err: ' + err);
                        res.next();
                    } else {
                        res.json({'id': id})
                    }
                },
                req.body)
        });
}

