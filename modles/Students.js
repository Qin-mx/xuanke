const mongoose = require('mongoose');

// 创建schema
const StudentSchema = new mongoose.Schema({
    "sid": String,
    "name": String,
    "sex": String,
    "grade": String , // 定义 1- 初一 ； 2 - 初二 ； 3 - 初三； 4 - 高一； 5 - 高二； 6- 高三
    "password": String,
    'noPassword': Boolean,
})


// 靜態方法
StudentSchema.statics.importStudent = function(data){
    // 定义字母表
    var str = 'QWERTYUIOPASDFGHJKLZXCVBNM123456789qwertyuiopasdfghjklzxcvbnm';
console.log(data)
    // 删除全部  - 直接操作  
    mongoose.connection.collection('students').drop(function(){
        // 再插入d,
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
                    grade: data[i].name,
                    password: password,
                    noPassword: false
                })
                s.save()
            }
        }
    })
}

// 验证是否冲突
StudentSchema.statics.checkedSid = function(data,callback) {
    this.find({"sid":data},function(err,results){
        // 如果没有返回true,
        // 如果有返回false
        callback(results.length == 0);
    })
}


// 创建模型
const Student = mongoose.model('Student',StudentSchema);

// 导出
module.exports = Student