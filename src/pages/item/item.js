import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import './item.scss'
import { getActDetail } from '@api'
import { handleActivity } from '@utils'
import { ActInfo, ParseComponent } from '@components'

export default class ActDetail extends Component {
  config = {
    navigationBarTitleText: '活动详情',
    // 使用微信小程序插件
    // usingComponents: {
    //   'txv-video': 'plugin://tencentvideo/video'
    // }
  }
  constructor () {
    super(...arguments)
    this.state = {
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
    this.itemId = parseInt(this.$router.params.itemId)
  }
  componentDidMount () {
    this.loadDetail()
  }
  async loadDetail () {
    const {itemId} = this
    if (!itemId) return
    Taro.showLoading({title: '加载中',mask: true})
    try {
      const res = await Taro.request({
        url: getActDetail(itemId)
      })
      const result = handleActivity.call(this, res)
      this.setState(result)
      setTimeout(function () {
        Taro.hideLoading()
      }, 1600)
    } catch (error) {
      Taro.hideLoading()
      handleActivity.call(this)
      Taro.showToast({
        title: '获取数据失败'
      })
    }
  }
  render () {
    const { detail, timeText, title, imageUrl, cityName, venueId, address, venueName, performers } = this.state
    return (
      <View>
        <ActInfo
          timeText={timeText}
          title={title}
          imageUrl={imageUrl}
          cityName={cityName}
          venueId={venueId}
          address={address}
          venueName={venueName}
          performers={performers}
        />
        { process.env.TARO_ENV === 'weapp' ? <ParseComponent detail={detail} /> : <View>只在小程序里支持</View> }
      </View>
    )
  }
}
