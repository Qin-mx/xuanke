const formidable = require('formidable')
const path = require('path')
const fs = require('fs')

// 导入xlsx处理模块
const xlsx  = require('node-xlsx')

exports.showAdminHome = (req,res)=>{
    res.render('admin/index',{
        page: 'adminIndex'
    })
}

exports.showAdminStudents = (req,res)=>{
    res.render('admin/students',{
        page: 'adminStudentsIndex'
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

exports.showAdminStudentsImport = (req,res)=>{
    res.render('admin/studentsImport',{
        page: 'adminStudentsIndex'
    })
}

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
            res.json({
                results: workSheetsFromBuffer
            })
        }
    });
}