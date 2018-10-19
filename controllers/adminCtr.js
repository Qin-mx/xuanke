const formidable = require('formidable')
const path = require('path')
const fs = require('fs')
const url = require('url')
const mongoose = require('mongoose')
// 导入xlsx处理模块
const xlsx = require('node-xlsx')
const format = require('date-format');
const Student = require('./../modles/Students.js');
const Course = require('./../modles/Course.js');
// 这些是接口跳转
exports.showAdminHome = (req, res) => {
    res.render('admin/index', {
        page: 'adminIndex'
    })
}

exports.showAdminCourse = (req, res) => {
    res.render('admin/course/course', {
        page: 'adminCourse'
    })
}
// 导入选课信息
exports.showAdminCourseimport = (req, res) => {
    res.render('admin/course/import', {
        page: 'adminCourse'
    })
}
// 添加
exports.showAdminCourseAdd = (req, res) => {
    res.render('admin/course/add', {
        page: 'adminCourse'
    })
}


exports.showAdminReport = (req, res) => {
    res.render('admin/report', {
        page: 'adminReport'
    })
}

// 执行表格上传
exports.doAdminStudentsImport = (req, res) => {
    var form = new formidable.IncomingForm();

    form.uploadDir = "./uploads";
    form.keepExtensions = true;
    // 该注释代码用来删除文件中的文件
    // console.log(path.join(__dirname,'../uploads'))
    // fs.readdir('./uploads',(err,files)=>{
    //     for( var i in files){
    //         console.log(files[i])
    //         fs.unlink('./uploads/' + files[i] ,(err)=>{
    //             // console.log(data)
    //             if (err) throw err;
    //             console.log('成功删除' + files[i]);
    //         })
    //     }

    // })
    form.parse(req, function (err, fields, files) {
        if (!files.studentsexcel.name) {
            return res.send('请先选择文件上传~')
        }
        // 判断文件是否正确
        if (path.extname(files.studentsexcel.name) != ".xlsx") {
            res.send('上传的文件类型不正确，请重新上传')
            fs.unlink('./' + files.studentsexcel.path, (err) => {
                if (err) throw err;
                console.log('成功删除 /tmp/hello');
            })
        } else {
            // 开始读取当前表格 同步
            const workSheetsFromBuffer = xlsx.parse('./' + files.studentsexcel.path);

            // 检查数组是否符合规范
            if (workSheetsFromBuffer.length != 6) {
                res.send("当前表格缺少子表格")
                return
            }
            // 循环检查每个表的表头是否完整
            for (var i = 0; i < 6; i++) {
                if (workSheetsFromBuffer[i].data[0][0] != "学号") {
                    res.send("当前表格缺少学号")
                    return
                }

                if (workSheetsFromBuffer[i].data[0][1] != "姓名") {
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
exports.getAllStudents = function (req, res) {
    // 获取参数
    var pageSize = parseInt(url.parse(req.url, true).query.pageSize),
        page = parseInt(url.parse(req.url, true).query.page - 1),
        keyword = url.parse(req.url, true).query.keyword;
    // 定义排序的参数，可用可不用
    var sordNumber = 'asc' ? 1 : -1;
    if (keyword == undefined || keyword == '') {
        var filter = {}
    } else {
        var reg = new RegExp(keyword, 'g'); // 生成正则对象
        var filter = {
            $or: [{
                    sid: reg
                },
                {
                    name: reg
                },
                {
                    grade: reg
                },
            ]
        }
    }
    Student.countDocuments(filter, function (err, count) {
        if (err) {
            res.json({
                msg: '获取数据失败',
                code: '404'
            })
        } else {
            // 总页数
            var total = Math.ceil(count / pageSize);
            var sortobj = {};
            // 动态绑定一个键
            sortobj['sid'] = sordNumber;
            Student.find(filter).sort(sortobj).limit(pageSize).skip(page * pageSize).exec(function (err, results) {
                if (err) {
                    res.json({
                        msg: '获取数据失败',
                        code: '404'
                    })
                } else {
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
exports.addStudent = function (req, res) {
    var form = new formidable.IncomingForm();
    // 定义正则表达式
    var regSid = /^[\d]{9}$/,
        regName = /^[\u4E00-\u9FA5\uf900-\ufa2d·s]{2,20}$/,
        regSex = /^(男|女)$/,
        regPass = /^[0-9a-zA-Z]{6}$/;

    form.parse(req, function (err, fields, files) {
        if (err) {
            return res.json({
                msg: '获取信息失败',
                code: '404'
            })
        }
        if (!regSid.test(fields.sid) || !regName.test(fields.name) || !regSex.test(fields.sex) || !regPass.test(fields.password)) {
            return res.json({
                msg: '数据填写不完整',
                code: '404'
            })
        }

        // 检查合法性 是否添加过学号
        Student.checkedSid(fields.sid, function (result) {
            console.log('dangq ' + result)
            if (result) {
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
                s.update((err, data) => {
                    if (err) {
                        res.json({
                            msg: '添加数据失败',
                            code: '404'
                        })
                    } else {
                        res.json({
                            msg: '添加数据成功',
                            code: '200',
                        })
                    }
                });
            } else {
                res.json({
                    msg: '数据库中存在当前学号',
                    code: '404'
                })
            }
        })

    })
}

// 修改数据
exports.updateStudent = function (req, res) {
    var sid = req.params.sid;

    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        Student.find({
            sid: sid
        }, function (err, results) {
            //    如果不存在
            if (results.length < 1) {
                res.json({
                    msg: '所修改的数据不存在',
                    code: '404'
                })
            } else {
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

exports.RemoveStudent = function (req, res) {
    var sid = req.params.sid;
    console.log(sid);
    // Student.remove({sid: [150104004,150104005]}).function(){
    //     
    // }
    Student.find({
        sid
    }, function (err, results) {
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

// 下载学生表格
exports.downloadStudentXlsx = function (req, res) {
    // 整理数据
    var table = [];
    var gradeArr = ['初一', '初二', '初三', '高一', '高二', '高三'];

    // 生成一个迭代器。因为请求是异步的并不确定是那条数据先返回的
    function iterator(i) {
        console.log
        if (i === 6) {
            // 将获取到的文件导出到指定的文件夹下
            var buffer = xlsx.build(table); // Returns a buffer
            // 生成下载文件
            var filename = format.asString('学生清单yyyy年MM月dd日hhmmssSSS', new Date());
            fs.writeFile('./public/xlsx/' + filename + '.xlsx', buffer, function (err) {
                res.redirect('/xlsx/' + filename + '.xlsx')
                // 删除文件
                fs.unlink('/xlsx/' + filename + '.xlsx', function (err) {
                    console.log('删除成功！')
                })
            })

            return;
        }
        // 获取需要的数据
        Student.find({
            grade: gradeArr[i]
        }, function (err, results) {
            var sheetR = []
            results.forEach(function (item) {
                sheetR.push([
                    item.sid,
                    item.name,
                    item.sex,
                    item.grade,
                    item.password
                ])
            })
            table.push({
                name: gradeArr[i],
                data: sheetR
            })
            iterator(++i);
        })


    }
    iterator(0)

}

// 导入选课 进入数据库是一个同步操作
exports.doAdminCourseImport = (req, res) => {
    var form = new formidable.IncomingForm();

    form.uploadDir = "./uploads";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        if (err) {
            return res.send('上传失败，请检查')
        }
        if (path.extname(files.course.name) != ".json") {
            res.send('上传的文件类型不正确，请重新上传')
            fs.unlink('./' + files.course.path, (err) => {
                if (err) throw err;
                console.log('成功删除 /tmp/hello');
            })
        } else {
            // console.log(files.course.path) // 获取到了这文件以后，需要读取出来
            fs.readFile(files.course.path, function (err, data) {
                // console.log(data.toString()); 拿到数据以后直接save
                var dataobj = JSON.parse(data.toString()).courses;
                // 当拿到数据之后，先删除之前的
                mongoose.connection.collection('courses').drop(function () {

                    Course.insertMany(dataobj, function (data, r) {
                        if (err) {
                            return res.send('上传失败，请检查')
                        }
                        res.send('成功导入' + r.length + '条信息')
                    })
                });

            })
        }
    });

}

// 查看所有数据
exports.getAllCourse = function (req, res) {
    // 获取需要的分页
    var page = parseInt(url.parse(req.url, true).query.page - 1), // 页数
        pageSize = parseInt(url.parse(req.url, true).query.pageSize), // 一页需要多少
        keyword = url.parse(req.url, true).query.keyword;
    // 定义排序的参数，可用可不用
    var sordNumber = 'asc' ? 1 : -1;
    if (keyword == undefined || keyword == '') {
        var filter = {}
    } else {
        var reg = new RegExp(keyword, 'g'); // 生成正则对象
        var filter = {
            $or: [{
                    cid: reg
                },
                {
                    name: reg
                },
                {
                    teacher: reg
                },
                {
                    dayofweek: reg
                }
            ]
        }
    }
    // 根据是否需要分页来些
    Course.countDocuments(filter, function (err, count) {
        if (err) {
            res.json({
                msg: '当前没有可用数据',
                code: '404'
            })
        } else {
            // 总页数
            var total = Math.ceil(count / pageSize);
            var sortobj = {};
            // 动态绑定一个键
            sortobj['cid'] = sordNumber;
            // 动态绑定一个键
            Course.find(filter).sort(sortobj).limit(pageSize).skip(page * pageSize).exec(function (err, results) {
                if (err) {
                    res.json({
                        msg: '获取数据失败',
                        code: '404'
                    })
                } else {
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

// 获取选课详情的接口
exports.doGetCourseIdinfo = function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fileds, files) {
        if (err) {
            return res.json({
                msg: '获取选课信息失败',
                code: '404'
            })
        }
        Course.find({
            cid: fileds.cid
        }, function (err, results) {
            if (err) {
                res.json({
                    msg: '获取选课信息失败',
                    code: '404'
                })
            } else {
                res.json({
                    msg: '获取选课信息成功',
                    code: '200',
                    results
                })

            }

        })
    })
}


// 修改选课数据
exports.updateCourse = function (req, res) {
    var cid = req.params.sid;
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        if (err) {
            return res.json({
                msg: '没有找到',
                code: '404'
            })
        }
        var updateData = {
            "cid": cid,
            "name" : fields.name,
            "dayofweek" : fields.dayofweek,
            "number" : fields.number,
            "allow" :  fields['allow[]'],
            "teacher" : fields.teacher,
            "briefintro" : fields.briefintro
        };
        console.log(fields)
        Course.updateOne(updateData, function (err, result) {
            //    如果不存在
            if (err) {
                res.json({
                    msg: '所修改的数据失败',
                    code: '404'
                })
            } else {
                res.json({
                    msg: '修改数据成功',
                    code: '200'
                })
            }
        })
    });
}


// 添加选课
exports.addCourse = function (req, res) {
    var form = new formidable.IncomingForm();
    // 定义正则表达式
    var regSid = /^[\d]{9}$/,
        regName = /^[\u4E00-\u9FA5\uf900-\ufa2d·s]{2,20}$/,
        regSex = /^(男|女)$/,
        regPass = /^[0-9a-zA-Z]{6}$/;

    form.parse(req, function (err, fields, files) {
        if (err) {
            return res.json({
                msg: '获取信息失败',
                code: '404'
            })
        }
        if (!regSid.test(fields.sid) || !regName.test(fields.name) || !regSex.test(fields.sex) || !regPass.test(fields.password)) {
            return res.json({
                msg: '数据填写不完整',
                code: '404'
            })
        }

        // 检查合法性 是否添加过学号
        Student.checkedSid(fields.sid, function (result) {
            console.log('dangq ' + result)
            if (result) {
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
                s.save((err, data) => {
                    if (err) {
                        res.json({
                            msg: '添加数据失败',
                            code: '404'
                        })
                    } else {
                        res.json({
                            msg: '添加数据成功',
                            code: '200',
                        })
                    }
                });
            } else {
                res.json({
                    msg: '数据库中存在当前学号',
                    code: '404'
                })
            }
        })

    })
}