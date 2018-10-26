var formidable = require('formidable');
//导入加密模块
const crypto = require("crypto");
var Student = require('../modles/Students');
var Course = require('../modles/Course');

exports.showLogin = function(req,res){
    res.render('login')
}

exports.showEditPwd = function(req,res){
    res.render('EditPwd',{
        "sid": req.session.sid,
        "name": req.session.name,
        "noPassword": req.session.noPassword,
        "login":  req.session.login,
    })
}

// 登录接口
exports.doLogin = function(req,res){
    // 需要验证两种情况
    // 1. 密码更改
    // 2. 密码未更改
    // 如果未更改，此时匹配数据库
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var sid = fields.sid, 
            password = fields.password; // 用户名和密码
        Student.find({sid},function(err,result){
            if(err){
                res.json({
                    msg:'当前请求失败',
                    code: 404,
                })
                return;
            }
            if(result.length == 0 ){
                res.json({
                    msg: '数据库不存在！',
                    code: 402,
                })
                return;
            }
            // 接下来因为有数据，就需要判断密码是否修改过密码
            var noPassword = result[0].noPassword;
            if(!noPassword){
                // 当前判断是判断未修改过密码
                if(password === result[0].password){
                    // 成功以后发一串session
                    req.session.login = true;
                    req.session.sid = sid;
                    req.session.name = result[0].name;
                    req.session.noPassword = result[0].noPassword;
                    res.json({
                        msg: 'ok',
                        code: 200,
                        url: '/editpwd',
                        login: req.session.login
                    })
                }else{
                    res.json({
                        msg: '密码错误',
                        code: 403
                    })
                }
            }else{
                let md5 = crypto.createHash("sha256");
                let newPas = md5.update(password).digest("hex");
                // 当前是在密码修改以后调用这个方法
                if(result[0].password  === newPas){
                    // 成功以后发一串session
                    req.session.login = true;
                    req.session.sid = sid;
                    req.session.name = result[0].name;
                    req.session.noPassword = result[0].noPassword;
                    res.json({
                        msg: 'ok',
                        code: 200,
                        url: '/',
                        login: req.session.login
                    })
                }else{
                    res.json({
                        msg: '密码错误',
                        code: 403
                    })
                }
            }
        })
    })

}


// 显示报名表
exports.showTable = function (req,res){
    if(req.session.login != true ){
        res.redirect('/login')
        return;
    }
    res.render('index',{
        "sid": req.session.sid,
        "name": req.session.name
    })
}

// 退出功能代码
exports.doLogout = function (req,res) {
    req.session.sid = '';
    req.session.login = false;
    req.session.name = '';
    res.json({
        code: 200,
        msg: 'ok'
    })
}

 // 修改密码功能
 exports.doChangePass = function (req,res){
    var form = new formidable.IncomingForm();
    var md5 = crypto.createHash("sha256");
            // 判断权限
            if(req.session.login != true ){
                res.json({
                    msg: '请重新登陆',
                    code: -1
                })
                return;
            }
    form.parse(req, function (err, fields, files) {
        if(err) return res.json({code:404,msg:'服务器错误'})

        // 判断当前密码是否一致
        if(fields.password !== fields.repassword){
            res.json({
                msg: '当前密码不一致',
                code: 200
            })
        }
        // 先获取到当前的密码，然后修改数据的密码
        console.log(req.session.sid)
        Student.find({sid:req.session.sid},function(err,results){
            if(err) return res.json({code:404,msg:'服务器错误'});
            if(results[0].length == 0 ) return res.json({code:201,msg:'操作失败'});
            var newPas = md5.update(fields.password).digest("hex");
            // 修改数据库内容
            var result = results[0];
            result.password = newPas;
            result.noPassword = true;

            req.session.name = result.name;
            req.session.noPassword = result.noPassword;
            result.save(function(err){
                if (err) {
                    res.json({
                        msg: '修改密码失败',
                        code: '404'
                    })
                } else {
                    req.session.login = false
                    res.json({
                        msg: '修改密码成功',
                        code: '200',
                    })
                }
            })

        })
    })
 
 }

//  校验登录状态
exports.checkLogin = function(req,res){
    if(req.session.login == true){
        res.json({
            code: 200
        })
    }else{
        res.json({
            code: 404
        })
    }
}

// 检查课程是否可以报名
exports.checkBaoName = function(req,res){
    // res.send('1')
    var results = [];
    // 先找到这个人
    Student.find({sid: req.session.sid},function(err,students){
        if(err){
            res.json({code:500,msg: '服务器异常，请重试！'})
            return
        }
        if(students.length == 0){
            res.json({code:404,msg:'当前用户不存在！'})
        }

        var thestudent = students[0];
        // 在我们找到人以后就需要遍历获取他报名的课程
        var courses = thestudent.mycourses;
        var grade = thestudent.grade;
        // 映射对象将报名的与星期对应起来
        // 被占用的星期
        var myWeek = [];
        // 接下来判断选课
        Course.find({},function(err,data){
            data.forEach((item)=>{
                // 如果当前序号存在就 拿到当前的日期，最后去比较当前日期是否使用过
                if(courses.indexOf(item.cid) != -1){
                    // push到被占用的星期
                    myWeek.push(item.dayofweek)
                }
            })

            data.forEach((item=>{
                  // 拿到当前选课信息，比较用户
                if(courses.indexOf(item.cid) !== -1){
                   results.push({cid: item.cid,msg:'已报名'})
                }else if(item.number <= 0){
                    results.push({cid: item.cid,msg:'人数已满'})
                }else if(myWeek.indexOf(item.dayofweek) != -1){
                    results.push({cid: item.cid,msg:'当前周期已占用'})
                }else if(item.allow.indexOf(grade) == -1 ){
                    results.push({cid: item.cid,msg:'当前年级不满足'})
                }else{
                    results.push({cid: item.cid,msg:1})
                }
            }))
            
            res.json({
                results
            })

        })
    })

}