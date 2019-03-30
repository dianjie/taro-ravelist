import Taro, { Component } from '@tarojs/taro'
import { View, ScrollView } from '@tarojs/components'
import { AtSearchBar } from 'taro-ui'
import './index.scss'
import { searchActList } from '@api'
import { handleList, getWindowHeight } from '@utils'
import { ActList } from '@components'

export default class Index extends Component {
  config = {
    navigationBarTitleText: 'RaveList'
  }
  constructor () {
    super(...arguments)
    const { keyword } = this.$router.params
    this.state = {
      value: keyword ? decodeURIComponent(this.$router.params.keyword) : '',
      list: [],
      currentPage: 1,
      showPage: 1,
      loading: false,
      info: ''
    }
    this.preSearch = this.state.value
  }
  componentDidMount () {
    this.loadList()
  }
  async loadList (obj) {
    if (this.state.loading) return
    this.setState({
      loading: true
    })
    Taro.showLoading({title: '加载中',mask: true})
    const { value } = this.state
    this.preSearch = value
    if (!obj) {
      obj = {
        cityCode : '',
        keyword: value,
        page: 1
      }
    }
    try {
      const res = await Taro.request({
        url: searchActList(obj)
      })
      const result = handleList.call(this, res)
      this.setState(result)
      setTimeout(function () {
        Taro.hideLoading()
      }, 1600)
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '获取数据失败'
      })
    }
  }
  loadMore() {
    let {currentPage, showPage, loading, value} = this.state
    if (loading) return
    if (++currentPage > showPage) {
      this.setState({
        info: '没有更多的活动',
        loading: false
      })
      return
    }
    this.loadList({
      cityCode : '',
      keyword: value,
      page: currentPage
    })
  }
  onChange (value) {
    this.setState({
      value: value
    })
    // 清空了搜索
    if(!value && this.preSearch !== value) {
      if (process.env.TARO_ENV === 'h5') {
        Taro.redirectTo({
          url: `/pages/index/index`
        })
      } else {
        this.loadList({
          cityCode : '',
          keyword: '',
          page: 1
        })
        this.preSearch = ''
      }
    }
  }
  onActionClick () {
    if (process.env.TARO_ENV === 'h5') {
      const { value } =  this.state
      Taro.redirectTo({
        url: `/pages/index/index?keyword=${encodeURIComponent(value)}`
      })
    } else {
      this.loadList()
    }
  }
  render () {
    const {list, value, loading, info} = this.state
    const height = getWindowHeight(false) - 45
    return (
      <View>
        <View>
          <AtSearchBar
            value={value}
            onChange={this.onChange.bind(this)}
            onActionClick={this.onActionClick.bind(this)}
          />

          <ScrollView className='container'
            scrollY
            enableBackToTop
            scrollWithAnimation
            scrollTop='0'
            style={`height: ${height}px`}
            onScrollToLower={this.loadMore.bind(this)}
          >
            <ActList list={list} />
            {loading ? <View className='txcenter'>加载中</View>
              : <View className='txcenter'>{info}</View>
            }
          </ScrollView>
        </View>
      </View>
    )
  }
}
