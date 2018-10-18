// 创建express程序
const express = require('express')
// 创建app
const app = express();
// 引入session
const session = require('express-session') 

// 引入管理员模块
const adminCtr = require('./controllers/adminCtr.js')


// 链接数据库
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Elective', { useNewUrlParser: true })

// 登录验证的时候设置一个session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
 }))

// 设置模版
app.set('view engine','ejs')

// 中间件，路由清单
// 管理员路由
app.get('/admin',adminCtr.showAdminHome)
app.get('/admin/students',adminCtr.showAdminStudents)
app.get('/admin/course',adminCtr.showAdminCourse)
app.get('/admin/report',adminCtr.showAdminReport)
// 管理员学生管理 - 路由
app.get('/admin/students/import',adminCtr.showAdminStudentsImport)
app.get('/admin/students/info',adminCtr.showAdminStudentsInfo)
app.post('/admin/students/import',adminCtr.doAdminStudentsImport)

app.get('/students', adminCtr.getAllStudents) // 得到所有学生信息
app.post('/students',adminCtr.addStudent) //增加学生
// app.get('/students/111') // 查询当前学生
app.post('/students/:sid',adminCtr.updateStudent) // 修改数据
app.delete('/students/:sid',adminCtr.RemoveStudent) // 删除数据
// app.propfind('/students/111') // 查询是否存在
// 静态资源
app.use(express.static('public'))

// 设置404，上面路由没有获取的
app.use( (req,res)=>{
    res.send('404')
})
// 监听
app.listen(3000,'127.0.0.1')

console.log('http://127.0.0.1:3000/admin')