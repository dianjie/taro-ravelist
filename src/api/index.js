const HOST_URI = 'https://jjboom.net/api/'

const SEARCH_ACT_LIST = 'activity/search'
const GET_ACT_DETAIL = 'activity/getDetail'

function queryString (obj) {
  if (!obj) {
    return ''
  }
  return '?' + Object.keys(obj).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])
  }).join('&')
}

function searchActList (o) {
  return HOST_URI + SEARCH_ACT_LIST  + queryString(o)
}
function getActDetail (id) {
  return HOST_URI + GET_ACT_DETAIL  + queryString({ activityId: id })
}
export {
  searchActList,
  getActDetail,
  queryString
}
