import Taro, { Component } from '@tarojs/taro'
import { View } from '@tarojs/components'
import './wxParse.scss'

let WxParse = {wxParse: () => {}}
if (process.env.TARO_ENV === 'weapp') {
  WxParse = require('./assets/wxParse/wxParse')
}
export default class ParseComponent extends Component {
  static defaultProps = {
    detail: '<div style="color: red">我是默认显示内容</div>'
  }
  componentDidUpdate () {
    console.log('componentDidUpdate')
    WxParse.wxParse('article', 'html', this.props.detail, this.$scope, 5)
  }
  componentWillUnmount() {
    console.log('componentWillUnmount')
  }
  render () {
    return (
      <View className='htmlContent'>
        <import src='./assets/wxParse/wxParse.wxml' />
        <template is='wxParse' data='{{wxParseData:article.nodes}}' />
      </View>
    )
  }
}
