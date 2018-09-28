const mongoose = require('mongoose');

// 创建schema
const StudentSchema = new mongoose.Schema({
    "sid": Number,
    "name": String,
    "sex": String,
    "grade": Number , // 定义 1- 初一 ； 2 - 初二 ； 3 - 初三； 4 - 高一； 5 - 高二； 6- 高三
    "password": String,
    'noPassword': Boolean,
})


// 靜態方法
StudentSchema.statics.importStudent = function(data){
    // 定义字母表
    var str = 'QWERTYUIOPASDFGHJKLZXCVBNM123456789qwertyuiopasdfghjklzxcvbnm';

    // 删除全部  - 直接操作  
    mongoose.connection.collection('students').drop(function(){
        // 再插入,
        for( var i = 0; i < data.length; i++){
            for(var j = 1; j < data[i].data.length; j++){

                // 生成密码// 随机密码下发 6位数
                var password = '';
                for( var m = 0; m < 6;m++){
                    password += str.charAt(parseInt(Math.random() * str.length));
                }
                var s = new Student({
                    sid: data[i].data[j][0],
                    name: data[i].data[j][1],
                    sex: data[i].data[j][2],
                    grade: i+ 1,
                    password: password,
                    noPassword: false
                })
                s.save()
            }
        }
    })
}

// 创建模型
const Student = mongoose.model('Student',StudentSchema);

// 导出
module.exports = Student