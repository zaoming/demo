const qiniu = require("qiniu");
const fs = require('fs');
const path = require('path');

// ================================== 参数初始化 =====================================
/**
 * 1.1配置Access Key和Secret Key，获取mac值
 */
const accessKey = 'Jsz8U5Tc7gsHrx5X73u9sKuUd8LSIQxkrOnkwm1J';
const secretKey = 'BFXCrKBmvIPui3sv_rxcCZH7JkVbd-Omt4YDxckE';
let mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

/**
 * 1.2创建upload对象
 */
let config = new qiniu.conf.Config();
config.zone = qiniu.zone.Zone_z1;  // 空间对应的机房
let formUploader = new qiniu.form_up.FormUploader(config);

/**
 * 1.3构造CDN管理对象
 */
let cdnManager = new qiniu.cdn.CdnManager(mac);
// ================================== //参数初始化 =====================================

// ================================== 文件遍历与上传 =====================================
const bucket = 'zaoming_net'; //要上传的空间
const local_base = './dist/'; // 本地根目录

/**
 * 2.1获取文件列表
 */
let file_list = []; // 本地文件列表
function getFileList(local_base, key_base = '') {
  let absolute_path = path.resolve(local_base); // 把路径解析为绝对路径
  let files = fs.readdirSync(absolute_path) // 同步获取文件列表
  // 遍历文件列表
  files.forEach((fileName) => {
    // console.log('files:', fileName)
    let key = key_base + fileName
    let filePath = path.join(local_base, fileName)
    let stats = fs.statSync(filePath) // 同步读取文件信息
    // 判断文件类型：文件、文件夹
    if (stats.isFile()) {
      // 文件类型
      file_list.push(key)
    } else if (stats.isDirectory()) {
      // 文件夹类型:递归遍历
      getFileList(filePath, key + '/')
    } else {
      // 其他类型
    }
  })
}
getFileList(local_base);
console.log('file_list:', file_list)

/**
 * 2.2遍历文件并上传
 */
file_list.forEach((fileKey) => {
  let token = uptoken(bucket, fileKey); //生成上传 Token
  let filePath = local_base + fileKey; //要上传文件的本地路径
  //调用uploadFile上传
  uploadFile(token, fileKey, filePath,function(){ 
    /**
     * 2.3刷新首页文件
     */
    if(fileKey==='index.html'){
      refreshURLs(['http://demo.zaoming.net/index.html'])
    }
  }); 
})

/**
 * 获取token的函数
 */
function uptoken(bucket, key) {
  let options = {
    scope: bucket + ":" + key
  }
  let putPolicy = new qiniu.rs.PutPolicy(options);
  return putPolicy.uploadToken(mac);
}

/**
 * 文件上传的函数
 */
function uploadFile(uptoken, key, localFile,successFn) {
  let extra = new qiniu.form_up.PutExtra();
  formUploader.putFile(uptoken, key, localFile, extra, function(err, ret) {
    if (!err) {
      // 上传成功， 处理返回值
      console.log('uploadFile-success:', ret.hash, ret.key, ret.persistentId);
      successFn && successFn()
    } else {
      // 上传失败， 处理返回代码
      console.warn('uploadFile-error:', err);
    }
  });
}

/**
 * 刷新URL列表:单此请求数量不要超过100个
 */
function refreshURLs(URLs){
  let URLs_list = chunkArray(URLs,100)
  URLs_list.forEach((_URLs)=>{
    console.log('refreshURLs:',_URLs)
    cdnManager.refreshUrls(_URLs, function(err, respBody, respInfo) {
      if (!err) {
        let {statusCode}=respInfo
        let {code} = JSON.parse(respBody)||{}
        console.log('refreshURLs-success:',statusCode,code);
      }else{
        console.warn('refreshURLs-err:',err)
      }
  });
  })
}

/**
 * 数组分割
 */
function chunkArray(array,size=100){
  let length=array.length;
  let slicedArray = [];
  for(let i=0;i<length;i=i+size){
    slicedArray.push(array.slice(i,i+size));
  }
  return slicedArray;
}
// ================================== //文件遍历与上传 =====================================