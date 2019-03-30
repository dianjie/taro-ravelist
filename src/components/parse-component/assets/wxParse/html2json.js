/**
 * html2Json 改造来自: https://github.com/Jxck/html2json
 *
 *
 * author: Di (微信小程序开发工程师)
 * organization: WeAppDev(微信小程序开发论坛)(http://weappdev.com)
 *               垂直微信小程序开发交流社区
 *
 * github地址: https://github.com/icindy/wxParse
 *
 * for: 微信小程序富文本解析
 * detail : http://weappdev.com/t/wxparse-alpha0-1-html-markdown/184
 */

var __placeImgeUrlHttps = "https";
var __emojisReg = '';
var __emojisBaseSrc = '';
var __emojis = {};
var wxDiscode = require('./wxDiscode.js');
var HTMLParser = require('./htmlparser.js');
// Empty Elements - HTML 5
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr");
// Block Elements - HTML 5
var block = makeMap("br,a,code,address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");

// Inline Elements - HTML 5
var inline = makeMap("abbr,acronym,applet,b,basefont,bdo,big,button,cite,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

// Special Elements (can contain anything)
var special = makeMap("wxxxcode-style,script,style,view,scroll-view,block");
function makeMap(str) {
    var obj = {}, items = str.split(",");
    for (var i = 0; i < items.length; i++)
        obj[items[i]] = true;
    return obj;
}

function q(v) {
    return '"' + v + '"';
}

function removeDOCTYPE(html) {
    return html
        .replace(/<\?xml.*\?>\n/, '')
        .replace(/<.*!doctype.*\>\n/, '')
        .replace(/<.*!DOCTYPE.*\>\n/, '');
}

function trimHtml(html) {
  // return html
  //       .replace(/\r?\n+/g, '')
  //       .replace(/<!--.*?-->/ig, '')
  //       .replace(/\/\*.*?\*\//ig, '')
  //       .replace(/[ ]+</ig, '<')

  return html
    .replace(/>\r?\n+</g, '><')
    .replace(/<!--.*?-->/ig, '')
    .replace(/\/\*.*?\*\//ig, '')
    .replace(/[ ]+</ig, '<')
}

function getStyleValues(value, node) {
  var values = value.split(';')
  var hasPx = false
  var boxSizing = false
  var style = values.filter(function(n) {
    // 把width给过滤掉
    if (n.indexOf('width') > -1) {
      let widthValues = n.split(':')
      // tag为img width属性选择性删掉
      if (node.tag === 'img') {
        if (/em|rem/ig.test(widthValues[1]) || /-width/ig.test(widthValues[0])) {
          return true
        } else if (widthValues[1].indexOf('%') > -1) {
          return false
        } else if (widthValues[1].indexOf('px') > -1) {
          return parseFloat(widthValues[1]) < 280
        } else {
          return !isNaN(parseFloat(widthValues[1]))
        }
        // 不是img标签的过滤规则
      } else if (widthValues[1].indexOf('%') > -1) {
        // max-width 、width
        if (widthValues[0].indexOf('-') === -1) {
          // 存在width设置为%的时候，都将tab设置为box-sizing: border-box
          // 有些详情width：100%后会超出排版位置，例如丛林活动的排版就有这种情况
          boxSizing = true
        }
        return true
        // 过滤 px
      } else if (widthValues[1].indexOf('px') > -1) {
        // 280以下的px都保留
        hasPx = parseFloat(widthValues[1]) > 280
        return !hasPx
      } else {
        return !isNaN(parseFloat(widthValues[1]))
      }
    } else if (n.indexOf('height') > -1) {
      // 成都的pec存在这样的一种情况，原推文的图片被设置了height,然后就把图片拉得太长。所以这里把图片的height过滤掉
      return node.tag !== 'img'
    } else {
      return n !== ''
    }
  }).join(';')
  style = hasPx ? style ? style + ';width: 100%' : 'width: 100%' : style
  style = boxSizing ? style ? style + ';box-sizing: border-box' : 'box-sizing: border-box' : style
  return style
}

// 增加方法
function getParameterByName(name, url) {
  if (!url) return '';
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function html2json(html, bindName) {
    //处理字符串
    html = removeDOCTYPE(html);
    html = trimHtml(html);
    html = wxDiscode.strDiscode(html);
    //生成node节点
    var bufArray = [];
    var results = {
        node: bindName,
        nodes: [],
        images:[],
        imageUrls:[]
    };
    var index = 0;
    HTMLParser(html, {
        start: function (tag, attrs, unary) {
            //debug(tag, attrs, unary);
            // node for this element
            var node = {
                node: 'element',
                tag: tag,
            };

            if (bufArray.length === 0) {
                node.index = index.toString()
                index += 1
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length
            }

            if (block[tag]) {
                node.tagType = "block";
            } else if (inline[tag]) {
                node.tagType = "inline";
            } else if (closeSelf[tag]) {
                node.tagType = "closeSelf";
            }

            if (attrs.length !== 0) {
                node.attr = attrs.reduce(function (pre, attr) {
                    var name = attr.name;
                    var value = attr.value;
                    if (name == 'class') {
                        // console.dir(value);
                        //  value = value.join("")
                        node.classStr = value;
                    }
                    // has multi attibutes
                    // make it array of attribute
                    if (name == 'style') {
                      node.styleStr = getStyleValues(value, node) || ''
                    }
                    if (value.match(/ /)) {
                        value = value.split(' ');
                    }


                    // if attr already exists
                    // merge it
                    if (pre[name]) {
                        if (Array.isArray(pre[name])) {
                            // already array, push to last
                            pre[name].push(value);
                        } else {
                            // single value, make it array
                            pre[name] = [pre[name], value];
                        }
                    } else {
                        // not exist, put it
                        pre[name] = value;
                    }

                    return pre;
                }, {});
            }

            //对img添加额外数据
            if (node.tag === 'img') {
                node.imgIndex = results.images.length;
                // var imgUrl = node.attr.src;
                // if (imgUrl[0] == '') {
                //     imgUrl.splice(0, 1);
                // }
                var imgUrl = node.attr.src || node.attr['data-src'];
                if (imgUrl && imgUrl[0] == '') {
                  imgUrl.splice(0, 1);
                }
                imgUrl = wxDiscode.urlToHttpUrl(imgUrl, __placeImgeUrlHttps);
                node.attr.src = imgUrl;
                node.from = bindName;
                results.images.push(node);
                results.imageUrls.push(imgUrl);
            }

            // 处理font标签样式属性
            if (node.tag === 'font') {
                var fontSize = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', '-webkit-xxx-large'];
                var styleAttrs = {
                    'color': 'color',
                    'face': 'font-family',
                    'size': 'font-size'
                };
                if (!node.attr.style) node.attr.style = [];
                if (!node.styleStr) node.styleStr = '';
                for (var key in styleAttrs) {
                    if (node.attr[key]) {
                        var value = key === 'size' ? fontSize[node.attr[key]-1] : node.attr[key];
                        node.attr.style.push(styleAttrs[key]);
                        node.attr.style.push(value);
                        node.styleStr += styleAttrs[key] + ': ' + value + ';';
                    }
                }
            }

            //临时记录source资源
            if(node.tag === 'source'){
                results.source = node.attr.src;
            }

            // 处理iframe
            if(node.tag === 'iframe'){
                var vid = getParameterByName('vid', node.attr.src || node.attr['data-src'])
                node.vid = vid
                node.playerId = new Date().getTime()
            }

            if (unary) {
                // if this tag doesn't have end tag
                // like <img src="hoge.png"/>
                // add to parents
                var parent = bufArray[0] || results;
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            } else {
                bufArray.unshift(node);
            }
        },
        end: function (tag) {
            //debug(tag);
            // merge into parent tag
            var node = bufArray.shift();
            if (node.tag !== tag) console.error('invalid state: mismatch end tag');

            //当有缓存source资源时于于video补上src资源
            if(node.tag === 'video' && results.source){
                node.attr.src = results.source;
                delete results.source;
            }

            if (bufArray.length === 0) {
                results.nodes.push(node);
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                parent.nodes.push(node);
            }
        },
        chars: function (text) {
            //debug(text);
            var node = {
                node: 'text',
                text: text,
                textArray:transEmojiStr(text)
            };

            if (bufArray.length === 0) {
                node.index = index.toString()
                index += 1
                results.nodes.push(node);
            } else {
                var parent = bufArray[0];
                if (parent.nodes === undefined) {
                    parent.nodes = [];
                }
                node.index = parent.index + '.' + parent.nodes.length
                parent.nodes.push(node);
            }
        },
        comment: function (text) {
            //debug(text);
            // var node = {
            //     node: 'comment',
            //     text: text,
            // };
            // var parent = bufArray[0];
            // if (parent.nodes === undefined) {
            //     parent.nodes = [];
            // }
            // parent.nodes.push(node);
        },
    });
    return results;
};

function transEmojiStr(str){
  // var eReg = new RegExp("["+__reg+' '+"]");
//   str = str.replace(/\[([^\[\]]+)\]/g,':$1:')

  var emojiObjs = [];
  //如果正则表达式为空
  if(__emojisReg.length == 0 || !__emojis){
      var emojiObj = {}
      emojiObj.node = "text";
      emojiObj.text = str;
      array = [emojiObj];
      return array;
  }
  //这个地方需要调整
  str = str.replace(/\[([^\[\]]+)\]/g,':$1:')
  var eReg = new RegExp("[:]");
  var array = str.split(eReg);
  for(var i = 0; i < array.length; i++){
    var ele = array[i];
    var emojiObj = {};
    if(__emojis[ele]){
      emojiObj.node = "element";
      emojiObj.tag = "emoji";
      emojiObj.text = __emojis[ele];
      emojiObj.baseSrc= __emojisBaseSrc;
    }else{
      emojiObj.node = "text";
      emojiObj.text = ele;
    }
    emojiObjs.push(emojiObj);
  }

  return emojiObjs;
}

function emojisInit(reg='',baseSrc="/wxParse/emojis/",emojis){
    __emojisReg = reg;
    __emojisBaseSrc=baseSrc;
    __emojis=emojis;
}

module.exports = {
    html2json: html2json,
    emojisInit:emojisInit
};

