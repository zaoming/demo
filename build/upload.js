const qiniu = require("qiniu");

/**
 * 1.配置Access Key和Secret Key
 */
qiniu.conf.ACCESS_KEY = 'Jsz8U5Tc7gsHrx5X73u9sKuUd8LSIQxkrOnkwm1J';
qiniu.conf.SECRET_KEY = 'BFXCrKBmvIPui3sv_rxcCZH7JkVbd-Omt4YDxckE';

/**
 * 2.获取上传token
 */
bucket = 'zaoming_net'; //要上传的空间
key = 'index.html'; //上传到七牛后保存的文件名
function uptoken(bucket, key) {
  let putPolicy = new qiniu.rs.PutPolicy(bucket + ":" + key);
  return putPolicy.token();
}
//生成上传 Token
token = uptoken(bucket, key);

/**
 * 3.文件上传
 */
//要上传文件的本地路径
filePath = './dist/index.html'
//构造上传函数
function uploadFile(uptoken, key, localFile) {
  let extra = new qiniu.io.PutExtra();
  qiniu.io.putFile(uptoken, key, localFile, extra, function(err, ret) {
    if (!err) {
      // 上传成功， 处理返回值
      console.log(ret.hash, ret.key, ret.persistentId);
    } else {
      // 上传失败， 处理返回代码
      console.log(err);
    }
  });
}
//调用uploadFile上传
uploadFile(token, key, filePath);