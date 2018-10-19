const mongoose = require('mongoose');

// 创建一个schema
const CourseSchema = new mongoose.Schema({
    "cid" : String,
    "name" : String,
    "dayofweek" : String,
    "number" : Number,
    "allow" :  [String],
    "teacher" : String,
    "briefintro" : String
})

// 创建模型
const Course = mongoose.model('course',CourseSchema)

module.exports = Course;