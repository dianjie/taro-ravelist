import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import './index.scss'
import { globalUri } from '@utils'

export default class ActInfo extends Component {
  static defaultProps = {
    timeText: '',
    title: '',
    imageUrl: '',
    cityName: '',
    venueId: '',
    address: '',
    venueName: '',
    performers: []
  }
  goSearchPage = (artist) => {
    const obj = {
      url: `/pages/index/index?keyword=${encodeURIComponent(artist)}`
    }
    if (process.env.TARO_ENV === 'weapp') {
      Taro.reLaunch(obj)
    }
    if (process.env.TARO_ENV === 'h5') {
      Taro.redirectTo(obj)
    }
  }
  imgPreview () {
    let url = globalUri + '/' + this.props.imageUrl.replace(/thumb/ig, 'upload')
    Taro.previewImage({
      current: url, // 当前显示图片的http链接
      urls: [url] // 需要预览的图片http链接列表
    })
  }
  render () {
    const { timeText, title, imageUrl, cityName, venueId, address, venueName, performers } = this.props
    return (
      <View className='container'>
        <View className='img-box'>
          <View className='big-img'>
            {
              imageUrl && <Image className='bg' src={`${globalUri}/${imageUrl}`} />
            }
          </View>
          <View className='content'>
            <View className='inner'>
              <View className='small-img'>
                {
                  imageUrl && <Image mode='widthFix' src={`${globalUri}/${imageUrl}`} onClick={this.imgPreview.bind(this)} />
                }
            </View>
            <Text className='title'>{title}</Text>
          </View>
          </View>
        </View>
        <View className='detail'>
          <View className='inner'>
            {
              timeText &&
              <View>
                <Text> 时间：{timeText}</Text>
              </View>
            }
            {
              venueId &&
              <View>
                <Text> 场所：</Text>
                <Text className='link-text'>{cityName} {venueName}</Text>
              </View>
            }
            {
              address &&
              <View>
                <Text> 地址：{address}</Text>
              </View>
            }
            {
              performers.length > 0 &&
              <View>
                <Text> 艺人：</Text>
                {performers.map((artist, index) => (
                  <Text className='link-text' key={String(index)} onClick={this.goSearchPage.bind(this, artist)}>{artist} 、</Text>
                ))}
              </View>
            }
          </View>
        </View>
      </View>
    )
  }
}
