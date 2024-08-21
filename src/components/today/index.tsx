import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'
import Context from '../../context'
import './index.less'

const Today: React.FC = () => {
  const { store, prefixCls } = useContext(Context)

  // You can derive the dynamic styles here, or they can come from the store
  const todayLineStyles = {
    background: '#7073fc', // Replace with your dynamic logic
    width: '3px', // Replace with your dynamic logic
    height: store.bodyScrollHeight,
  }

  return (
    <div
      className={`${prefixCls}-today`}
      style={{
        transform: `translate(${store.todayTranslateX}px)`,
      }}
    >
      <div className={`${prefixCls}-today_line`} style={todayLineStyles} />
    </div>
  )
}

export default observer(Today)
