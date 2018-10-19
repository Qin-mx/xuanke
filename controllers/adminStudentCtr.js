const formidable = require('formidable')
const path = require('path')
const fs = require('fs')
const url = require('url')

// 导入xlsx处理模块
const xlsx  = require('node-xlsx')
const format = require('date-format');
const Student = require('./../modles/Students.js');

// 管理员学生管理 - 路由
exports.showAdminStudents = (req,res)=>{
    res.render('admin/students',{
        page: 'adminStudentsIndex'
    })
}
// 导入学生路由
exports.showAdminStudentsImport= (req,res)=>{
    res.render('admin/studentsImport',{
        page: 'adminStudentsIndex'
    })
}

// 添加学生
exports.showAdminStudentsInfo = (req,res)=>{
    res.render('admin/studentsInfo',{
        page: 'adminStudentsIndex'
    })
}