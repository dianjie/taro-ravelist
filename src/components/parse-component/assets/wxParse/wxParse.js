/**
 * author: Di (微信小程序开发工程师)
 * organization: WeAppDev(微信小程序开发论坛)(http://weappdev.com)
 *               垂直微信小程序开发交流社区
 *
 * github地址: https://github.com/icindy/wxParse
 *
 * for: 微信小程序富文本解析
 * detail : http://weappdev.com/t/wxparse-alpha0-1-html-markdown/184
 */

/**
 * utils函数引入
 **/
import showdown from './showdown.js';
import HtmlToJson from './html2json.js';
/**
 * 配置及公有属性
 **/
var realWindowWidth = 0;
var realWindowHeight = 0;
wx.getSystemInfo({
  success: function (res) {
    realWindowWidth = res.windowWidth
    realWindowHeight = res.windowHeight
  }
})
/**
 * 主函数入口区
 **/
function wxParse(bindName = 'wxParseData', type='html', data='<div style="color:red;">数据不能为空</div>', target,imagePadding) {
  var that = target;
  var transData = {};//存放转化后的数据
  if (type == 'html') {
    transData = HtmlToJson.html2json(data, bindName);
    // console.log(JSON.stringify(transData, ' ', ' '));
  } else if (type == 'md' || type == 'markdown') {
    var converter = new showdown.Converter();
    var html = converter.makeHtml(data);
    transData = HtmlToJson.html2json(html, bindName);
    // console.log(JSON.stringify(transData, ' ', ' '));
  }
  transData.view = {};
  transData.view.imagePadding = 0;
  if(typeof(imagePadding) != 'undefined'){
    transData.view.imagePadding = imagePadding
  }
  var bindData = {};
  // 先把之前的数据给重置了，这样下拉刷新就会重新触发wxParseImgLoad事件
  bindData[bindName] = {}
  that.setData(bindData)
  // 最终要设置的真实数据
  bindData[bindName] = transData;
  that.setData(bindData)
  // that[bindName] = transData
  that.wxParseImgLoad = wxParseImgLoad;
  that.wxParseImgTap = wxParseImgTap;
  // 修改
  that.bindData = bindData
}
// 图片点击事件
function wxParseImgTap(e) {
  var that = this;
  var nowImgUrl = e.target.dataset.src;
  var tagFrom = e.target.dataset.from;
  if (typeof (tagFrom) != 'undefined' && tagFrom.length > 0) {
    wx.previewImage({
      current: nowImgUrl, // 当前显示图片的http链接
      // 修改
      urls: that.bindData[tagFrom].imageUrls // 需要预览的图片http链接列表
    })
  }
}

/**
 * 图片视觉宽高计算函数区
 **/
function wxParseImgLoad(e) {
  var that = this;
  var tagFrom = e.target.dataset.from;
  var idx = e.target.dataset.idx;
  if (typeof (tagFrom) != 'undefined' && tagFrom.length > 0) {
    calMoreImageInfo(e, idx, that, tagFrom)
  }
}
// 假循环获取计算图片视觉最佳宽高
function calMoreImageInfo(e, idx, that, bindName) {
  var temData = that.bindData[bindName];
  if (!temData || temData.images.length == 0) {
    return;
  }
  var temImages = temData.images;
  // 因为无法获取view宽度 需要自定义padding进行计算，稍后处理
  var recal = wxAutoImageCal(e.detail.width, e.detail.height, idx, that, bindName);
  // temImages[idx].width = recal.imageWidth;
  // temImages[idx].height = recal.imageheight;
  // temData.images = temImages;
  // var bindData = {};
  // bindData[bindName] = temData;
  // that.setData(bindData);
  var index = temImages[idx].index
  var key = `${bindName}`
  for (var i of index.split('.')) key += `.nodes[${i}]`
  var keyW = key + '.width'
  var keyH = key + '.height'
  var keyClass = key + '.classStr'
  that.setData({
    [keyW]: recal.imageWidth,
    [keyH]: recal.imageheight,
    [keyClass]: 'loaded'
  })
}

// 计算节点的最佳宽度
function getDomWidth(idx, that, bindName) {
  let temData = that.bindData[bindName]
  // 最终节点最佳宽度
  let domWidth = 0
  // 自行设置的间距值
  let padding = temData.view.imagePadding * 2
  // 最终image所有父元素计算出来的padding-left值
  let leftPx = 0
  // 最终image所有父元素计算出来的padding-right值
  let rightPx = 0
  let temImages = temData.images
  let index = temImages[idx].index
  let indexArr = index.split('.')
  let tempObj = temData
  let widthArr = []
  let dataToPx = (data) => {
    let num = parseFloat(data)
    if (data.indexOf('em') > -1) return 16 * num
    if (data.indexOf('%') > -1) return realWindowWidth * (num / 100)
    return num
  }
  // 循环计算image所有父元素的padding值
  indexArr.forEach((item) => {
    tempObj = tempObj['nodes']
    tempObj = tempObj[`${item}`]
    if (tempObj && tempObj.styleStr) {
      // 含有padding的style
      if (/padding/ig.test(tempObj.styleStr)) {
        // 把styleStr分割成数组
        let tempText = tempObj.styleStr + ';'
        let lastPaddingArr = []
        // 筛选含有padding的style
        let arr = tempText.match(/padding.*?;/ig)
        arr.forEach((item) => {
          // 分割padding-xxx类型
          let arr1 = item.split('-')
          // padding-xxx: xxx;
          if (arr1.length === 2) {
            let tempArr = arr1[1].split(':')
            let result = dataToPx(tempArr[1])
            lastPaddingArr.push(`${tempArr[0]}: ${result}`)
          } else {
            // padding: xxx;
            let arr2 = item.split(':')
            let arr3 = arr2[1].split(' ')
            arr3 = arr3.filter((value) => {
              // 去除为 '' 的数组
              return !!value
            })
            switch (arr3.length) {
              // 值为负数不生效，直接排除
              case 1:
                if (parseFloat(arr3[0]) > 0) {
                  let result = dataToPx(arr3[0])
                  lastPaddingArr.push(`right: ${result}`)
                  lastPaddingArr.push(`left: ${result}`)
                }
                break
              case 2:
              case 3:
                if (parseFloat(arr3[1]) > 0) {
                  let result = dataToPx(arr3[1])
                  lastPaddingArr.push(`right: ${result}`)
                  lastPaddingArr.push(`left: ${result}`)
                }
                break
              case 4:
                if (parseFloat(arr3[1]) > 0) {
                  let result = dataToPx(arr3[1])
                  lastPaddingArr.push(`right: ${result}`)
                }
                if (parseFloat(arr3[3]) > 0) {
                  let result = dataToPx(arr3[3])
                  lastPaddingArr.push(`left: ${result}`)
                }
                break
              default:
                break
            }
          }
          let leftArr = lastPaddingArr.filter((item) => {
            return /left/ig.test(item)
          })
          let rightArr = lastPaddingArr.filter((item) => {
            return /right/ig.test(item)
          })
          leftPx += leftArr.length ? parseFloat(leftArr[leftArr.length - 1].split(':')[1]) : 0
          rightPx += rightArr.length ? parseFloat(rightArr[rightArr.length - 1].split(':')[1]) : 0
        })
      }
      // 含有width的style
      if (/width/ig.test(tempObj.styleStr)) {
        // 把styleStr分割成数组
        let tempText = tempObj.styleStr + ';'
        // 筛选含有padding的style
        let arr = tempText.match(/-?width.*?;/ig)
        arr.forEach((item) => {
          let arr2 = item.split(':')
          if (arr2[1].indexOf('%') > -1 && !/-width/ig.test(arr2[0])) {
            let num = parseFloat(arr2[1]) / 100
            if (num !== 1) {
              widthArr.push(num)
            }
          }
        })
      }
    }
  })
  // 最终padding值
  padding += leftPx + rightPx
  domWidth = realWindowWidth - padding
  let withLen = widthArr.length
  // 含有百分比的宽度
  if (withLen) {
    widthArr.forEach(item => {
      if (item < 1 || withLen !== 1) {
        domWidth = domWidth * item
      }
    })
  }
  return domWidth
}

// 计算视觉优先的图片宽高
function wxAutoImageCal(originalWidth, originalHeight, idx, that, bindName) {
  // 获取图片的原始长宽
  var windowWidth = 0, windowHeight = 0;
  var autoWidth = 0, autoHeight = 0;
  var results = {};

  windowWidth = getDomWidth(idx, that, bindName)
  windowHeight = realWindowHeight;
  // 判断按照那种方式进行缩放
  // console.log("windowWidth" + windowWidth);
  if (originalWidth > windowWidth) {//在图片width大于手机屏幕width时候
    autoWidth = windowWidth;
    // console.log("autoWidth" + autoWidth);
    autoHeight = (autoWidth * originalHeight) / originalWidth;
    // console.log("autoHeight" + autoHeight);
    results.imageWidth = autoWidth;
    results.imageheight = autoHeight;
  } else {//否则展示原来的数据
    results.imageWidth = originalWidth;
    results.imageheight = originalHeight;
  }
  return results;
}

function wxParseTemArray(temArrayName,bindNameReg,total,that){
  var array = [];
  var temData = that.bindData;
  var obj = null;
  for(var i = 0; i < total; i++){
    var simArr = temData[bindNameReg+i].nodes;
    array.push(simArr);
  }

  temArrayName = temArrayName || 'wxParseTemArray';
  obj = JSON.parse('{"'+ temArrayName +'":""}');
  obj[temArrayName] = array;
  that.setData(obj);
}

/**
 * 配置emojis
 *
 */

function emojisInit(reg='',baseSrc="/wxParse/emojis/",emojis){
   HtmlToJson.emojisInit(reg,baseSrc,emojis);
}

module.exports = {
  wxParse: wxParse,
  wxParseTemArray: wxParseTemArray,
  emojisInit: emojisInit,
  wxParseImgLoad: wxParseImgLoad,
  wxParseImgTap: wxParseImgTap
}


