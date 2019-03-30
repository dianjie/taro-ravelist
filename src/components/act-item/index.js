import Taro, { Component } from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import './index.scss'

export default class ActItem extends Component {
  static defaultProps = {
    item: {
      isSameOrAfter: false,
      imageUrl: '',
      title: '',
      timeText: '',
      performers: [],
    }
  }
  handleClick = (item) => {
    Taro.navigateTo({
      url: `/pages/item/item?itemId=${item.id}`
    })
  }
  render () {
    const { item } = this.props
    return (
      <View className={`item ${item.isSameOrAfter ? '' : 'end'}`} onClick={this.handleClick.bind(this, item)}>
        <View className='item-image'>
          <Image src={item.imageUrl} />
        </View>
        <View className='content'>
          <Text className='title'>{item.title}{item.isSameOrAfter ? '' : '（已结束）'}</Text>
          <View className='describeText'>
            <Text className='time' >活动时间：{item.timeText}</Text>
            {item.performers.length > 0 &&
              <View className='artist'>
                <Text>参演艺人：</Text>
                {item.performers.map((artist, index) => (
                  <Text key={String(index)}>{artist} 、</Text>
                ))}
              </View>
            }
          </View>
        </View>
      </View>
    )
  }
}
