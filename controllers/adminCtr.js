const formidable = require('formidable')
const path = require('path')
const fs = require('fs')
const url = require('url')

// 导入xlsx处理模块
const xlsx  = require('node-xlsx')
const Student = require('./../modles/Students.js');
// 这些是接口跳转
exports.showAdminHome = (req,res)=>{
    res.render('admin/index',{
        page: 'adminIndex'
    })
}

exports.showAdminCourse = (req,res)=>{
    res.render('admin/course',{
        page: 'adminCourse'
    })
}


exports.showAdminReport = (req,res)=>{
    res.render('admin/report',{
        page: 'adminReport'
    })
}

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
// 执行表格上传
exports.doAdminStudentsImport = (req,res)=>{
    var form = new formidable.IncomingForm();
    
    form.uploadDir = "./uploads";
    form.keepExtensions = true;
    console.log(path.join(__dirname,'../uploads'))
    fs.readdir('./uploads',(err,files)=>{
        for( var i in files){
            console.log(files[i])
            fs.unlink('./',(err)=>{
                if (err) throw err;
                console.log('成功删除' + files[i]);
            })
        }

    })
return
    form.parse(req, function(err, fields, files) {
        if(!files.studentsexcel.name){
            return res.send('请先选择文件上传~')
        }
        // 判断文件是否正确
        if(path.extname(files.studentsexcel.name) != ".xlsx"){
           res.send('上传的文件类型不正确，请重新上传') 
           fs.unlink('./' + files.studentsexcel.path ,(err) => {
            if (err) throw err;
            console.log('成功删除 /tmp/hello');
           })
        }else{
            // 开始读取当前表格 同步
            const workSheetsFromBuffer = xlsx.parse('./' + files.studentsexcel.path);

            // 检查数组是否符合规范
            if(workSheetsFromBuffer.length != 6){
                res.send("当前表格缺少子表格")
                return
            }
            // 循环检查每个表的表头是否完整
            for (var i = 0; i< 6; i++){
                if(workSheetsFromBuffer[i].data[0][0]!="学号"){
                    res.send("当前表格缺少学号")
                    return
                }

                if(workSheetsFromBuffer[i].data[0][1]!="姓名"){
                    res.send("当前表格缺少姓名")
                    return
                }

                // if(workSheetsFromBuffer[i].data[0][2]!="性别"){
                //     res.send("当前表格缺少性别")
                //     return
                // }
            }
            Student.importStudent(workSheetsFromBuffer)
            res.send('上传成功，请到学生清单查看');
            // res.json({
            //     results: workSheetsFromBuffer
            // })
        }
    });
}

// 获取全部数据
exports.getAllStudents = function( req, res){
    // 获取参数
    var pageSize = parseInt(url.parse(req.url,true).query.pageSize) ,
        page = parseInt(url.parse(req.url,true).query.page -1),
        keyword = url.parse(req.url,true).query.keyword;
        // 定义排序的参数，可用可不用
    var sordNumber = 'asc' ? 1 : -1;
    if( keyword == undefined || keyword == ''){
       var  filter = {}
    }else{
        var reg = new RegExp(keyword,'g'); // 生成正则对象
        var filter = {
            $or:[
                {sid: reg},
                {name: reg},
                {grade: reg},
            ]
        }
    }
    Student.countDocuments(filter,function(err,count){
        if(err) {
            res.json({
                msg: '获取数据失败',
                code: '404'
            })
        }else{
            // 总页数
            var total = Math.ceil(count/pageSize);
            var sortobj = {};
            // 动态绑定一个键
            sortobj['sid'] = sordNumber;
            Student.find(filter).sort(sortobj).limit(pageSize).skip(page * pageSize).exec(function(err,results){
                if( err ){
                    res.json({
                        msg: '获取数据失败',
                        code: '404'
                    })
                }else{
                    res.json({
                        msg: '获取数据成功',
                        code: '200',
                        results,
                        size: total, // 总页数
                        total: count,
                    })
                }
            })
        }
    })

}

/**
 * 下面的就是增删改查数据
 */
// 添加学生
exports.addStudent = function(req,res){
    var form = new formidable.IncomingForm();
    // 定义正则表达式
    var regSid = /^[\d]{9}$/,
        regName = /^[\u4E00-\u9FA5\uf900-\ufa2d·s]{2,20}$/,
        regSex=/^(男|女)$/,
        regPass = /^[0-9a-zA-Z]{6}$/;
    
    form.parse(req, function (err, fields, files) {
        if(err) {
           return res.json({
                msg: '获取信息失败',
                code: '404'
            })
        }
        if(!regSid.test(fields.sid) || !regName.test(fields.name) || !regSex.test(fields.sex) || !regPass.test(fields.password)){
            return res.json({
                msg: '数据填写不完整',
                code: '404'
            })
        }

        // 检查合法性 是否添加过学号
        Student.checkedSid(fields.sid,function(result){
            console.log('dangq ' + result)
            if( result ){
                // 表示当前sid不存在
                console.log(fields)
                var s = new Student({
                    sid: fields.sid,
                    name: fields.name,
                    sex: fields.sex,
                    grade: fields.grade,
                    password: fields.password,
                    noPassword: false
                })
                s.save((err,data) =>{
                    if(err) {
                        res.json({
                            msg: '添加数据失败',
                            code: '404'
                        })
                    }else{
                        res.json({
                            msg: '添加数据成功',
                            code: '200',
                        })
                    }
                });
            }else{
                res.json({
                    msg: '数据库中存在当前学号',
                    code: '404'
                })
            }
        })

    })
}

// 修改数据
exports.updateStudent = function(req,res){
    var sid = req.params.sid;
    
    var form = new formidable.IncomingForm();
    
    form.parse(req, function (err, fields, files) {
       Student.find({sid:sid},function(err,results){
        //    如果不存在
           if(results.length  < 1){
               res.json({
                msg: '所修改的数据不存在',
                code: '404'
               })
           }else{
            //    更改数据
            results[0].name = fields.name;
            results[0].sex = fields.sex;
            results[0].grade = fields.grade;
            
            results[0].save((err) => {
                if (err) {
                    res.json({
                        msg: '修改数据失败',
                        code: '404'
                    })
                } else {
                    res.json({
                        msg: '修改数据成功',
                        code: '200'
                    })
                }
            })
           }
       })
    });
}

// 删除数据

exports.RemoveStudent = function(req,res){
    var sid = req.params.sid;
    console.log(sid);
    // Student.remove({sid: [150104004,150104005]}).function(){
    //     
    // }
        Student.find({sid},function(err,results){
            console.log(results)
            if (err) {
                res.json({
                    msg: '数据不存在',
                    code: '404'
                })
                return
            }
            results[0].remove(function (err) {
                if (err) {
                    res.json({
                        msg: '删除失败',
                        code: '404'
                    })
                } else {
                    res.json({
                        msg: '删除成功',
                        code: '200'
                    })
                }
            })
    
        })
}