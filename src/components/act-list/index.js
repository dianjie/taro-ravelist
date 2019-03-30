import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { ActItem } from '@components'
import './index.scss'

export default class ItemList extends Component {
  static defaultProps = {
    list: []
  }
  render () {
    const { list } = this.props
    return (
      <View className='item-list'>
        <View className='item-list__wrap'>
          {list.map((item,index)=> (
            <ActItem key={String(index)} item={item} />
          ))}
        </View>
      </View>
    )
  }
}
