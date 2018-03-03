var mongoose = require('mongoose');
Schema = mongoose.Schema;
var articleSchema = new Schema(
{
        title:{ type: String,
            required: [true, 'Zoom is required']},
        text: { type: String,
            required: [true, 'Zoom is required']},
        image: { type: String,
            required: [true, 'Zoom is required']},
        searchCount: { type: Number,
            required: [true, 'Zoom is required']}
    }
);
var Article = mongoose.model('Article', articleSchema);
exports.articleSchema = articleSchema;
exports.Article = Article;