import moment from 'moment'
import he from 'he'
import Taro from '@tarojs/taro'

const NAVIGATOR_HEIGHT = 44
const TAB_BAR_HEIGHT = 50
const globalUri = 'https://jjboom.net'

function getDate(time) {
  return time ? moment(time).utcOffset(8) : moment().utcOffset(8)
}

function getNowDay() {
  return moment().format('DD').replace(/^0/, '')
}

function format(time) {
  return getDate(time).format('YYYY-MM-DD')
}
function getJson(data) {
  // wey.request 有时获取到的data是个文本类型值
  if (typeof data === 'string') {
    // preserve newlines, etc - use valid JSON
    data = data.replace(/\\n/g, '\\n')
      .replace(/\\'/g, "\\'")
      .replace(/\\"/g, '\\"')
      .replace(/\\&/g, '\\&')
      .replace(/\\r/g, '\\r')
      .replace(/\\t/g, '\\t')
      .replace(/\\b/g, '\\b')
      .replace(/\\f/g, '\\f')
    // remove non-printable and other non-valid JSON chars
    data = data.replace(/[\u0000-\u0019]+/g, '')
    data = JSON.parse(data)
  }
  return data
}

function getListData(res) {
  let resData = res.data || {}
  resData = getJson(resData)
  let {data = []} = resData
  return data
}

function replaceText(detail = '') {
  // 为null时再重设值为 ''
  if (!detail) {
    detail = ''
  }
  detail = he.decode(detail)
  // 替换图片源地址
  detail = detail.replace(/src="\/upload/ig, `src="${globalUri}/upload`)
  // 背景图源地址
  detail = detail.replace(/url\(\/upload/ig, `url(${globalUri}/upload`)
  // 替换视频区块
  detail = detail.replace(/(position: relative;width: 100%;height: 0;).*?padding-bottom: 56%;/ig, '')
  // 替换视频iframe
  detail = detail.replace(/<iframe([\s\S]*?)<\/iframe>/ig, '<p class="noTxvPlugin">因为无appId，把视频给替换了</p>')
  return detail
}
function replaceAreaText(text = '') {
  // 城区 郊县 市 地区
  if (!text) {
    text = ''
  }
  text = text.replace(/城区|郊县|市|地区/ig, '')
  return text
}

// {"province":{"code":"","value":"省"},"city":{"code":"","value":"市"}}
function getCityNameByAreaData(obj = {'province': {'code': '', 'value': '省'}, 'city': {'code': '', 'value': '市'}}) {
  try {
    obj = JSON.parse(obj)
  } catch (e) {}
  return replaceAreaText(obj.city.value)
}

function handleList(res) {
  const { currentPage, list } = this.state
  let obj = {
    list: [],
    currentPage: 1,
    showPage: 1,
    info: '',
    loading: false
  }
  let arr = []
  let resData = res.data || {}
  resData = getJson(resData)
  let serverData = resData.data || []
  serverData.forEach(function (item) {
    let isSameOrAfter = getDate(item.endTime).isSameOrAfter(getDate(), 'day')
    let timeText
    if (getDate(item.startTime).isSame(getDate(item.endTime), 'day')) {
      timeText = format(item.startTime)
    } else {
      timeText = `${format(item.startTime)} ~ ${format(item.endTime)}`
    }
    item.imageUrl = item.imageUrl ? globalUri + '/' + item.imageUrl.replace(/upload/ig, 'thumb') : globalUri + '/thumb/ravelist_waiting.jpg'
    item.isSameOrAfter = isSameOrAfter
    item.timeText = timeText
    arr = arr.concat(item)
  })
  obj.list = Number(resData.nowPage) === 1 ? arr : list.concat(arr)
  if (currentPage >= (resData.showPage || 1)) {
    obj.info = '没有更多的活动'
  } else {
    obj.info = '上拉加载更多'
  }
  if (currentPage === 1 && !serverData.length) {
    obj.info = '暂无相关活动'
  }
  obj.showPage = resData.showPage || 1
  obj.currentPage = resData.nowPage || 1
  obj.loading = false
  return obj
}
function handleActivity(res = {data: {}}) {
  let resData = res.data || {}
  resData = getJson(resData)
  let { data = {} } = resData
  let { detail = '<p style="color: red">真不忍心告诉你，这是发生错误后显示的内容！</p>', startTime, endTime, title = 'RaveList', imageUrl, performers = '[]', venueId, name, address, areaData } = data
  let obj = {
    detail: '',
    timeText: '',
    title: '',
    imageUrl: '',
    cityName: '',
    venueId: '',
    address: '',
    venueName: '',
    performers: []
  }
  obj.title = title
  // 替换成缩略图地址
  obj.imageUrl = imageUrl ? imageUrl.replace(/upload/ig, 'thumb') : 'thumb/ravelist_waiting.jpg'
  detail = replaceText(detail)
  let timeText
  if (getDate(startTime).isSame(getDate(endTime), 'day')) {
    timeText = format(startTime)
  } else {
    timeText = `${format(startTime)} ~ ${format(endTime)}`
  }
  obj.timeText = timeText
  obj.venueId = venueId
  obj.venueName = name
  obj.address = address
  obj.performers = JSON.parse(performers)
  obj.cityName = getCityNameByAreaData(areaData)
  obj.detail = detail
  return obj
}

/**
 * // NOTE Taro 可用高度的计算有问题，H5、RN 上返回的是窗口高度，暂且简单兼容下
 * @param {*} showTabBar
 */
function getWindowHeight(showTabBar = true) {
  const info = Taro.getSystemInfoSync()
  const { windowHeight, statusBarHeight } = info
  const tabBarHeight = showTabBar ? TAB_BAR_HEIGHT : 0

  if (process.env.TARO_ENV === 'rn') {
    return windowHeight - statusBarHeight - NAVIGATOR_HEIGHT - tabBarHeight
  }

  if (process.env.TARO_ENV === 'h5') {
    return windowHeight - tabBarHeight
  }

  return windowHeight
}

export {
  globalUri,
  getDate,
  getNowDay,
  format,
  getJson,
  getListData,
  replaceText,
  handleList,
  handleActivity,
  getWindowHeight
}
