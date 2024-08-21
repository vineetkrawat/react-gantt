import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import isBetween from 'dayjs/plugin/isBetween'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import weekday from 'dayjs/plugin/weekday'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import throttle from 'lodash/throttle'
import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx'
import type React from 'react'
import { createRef } from 'react'
import { HEADER_HEIGHT, TOP_PADDING } from './constants'
import type { GanttLocale, GanttProps as GanttProperties } from './Gantt'
import { defaultLocale } from './Gantt'
import { Gantt } from './types'
import { flattenDeep, transverseData } from './utils'

dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.extend(quarterOfYear)
dayjs.extend(advancedFormat)
dayjs.extend(isBetween)
dayjs.extend(isLeapYear)

export const ONE_DAY_MS = 86400000

// Get view type list based on locale
export const getViewTypeList = locale => {
  return [
    {
      type: 'day',
      label: locale.day,
      value: Gantt.ESightValues.day,
    },
    {
      type: 'week',
      label: locale.week,
      value: Gantt.ESightValues.week,
    },
    {
      type: 'month',
      label: locale.month,
      value: Gantt.ESightValues.month,
    },
    {
      type: 'quarter',
      label: locale.quarter,
      value: Gantt.ESightValues.quarter,
    },
    {
      type: 'halfYear',
      label: locale.halfYear,
      value: Gantt.ESightValues.halfYear,
    },
  ] as Gantt.SightConfig[]
}

// Function to check if a date is a rest day (weekend)
function isRestDay(date: string) {
  const calc = [0, 6]
  return calc.includes(dayjs(date).weekday())
}

class GanttStore {
  constructor({
    rowHeight,
    disabled = false,
    customSights,
    locale,
  }: {
    rowHeight: number
    disabled: boolean
    customSights: Gantt.SightConfig[]
    locale: GanttLocale
  }) {
    makeObservable(this, {
      data: observable,
      originData: observable,
      columns: observable,
      dependencies: observable,
      scrolling: observable,
      scrollTop: observable,
      collapse: observable,
      tableWidth: observable,
      viewWidth: observable,
      width: observable,
      height: observable,
      bodyWidth: observable,
      translateX: observable,
      sightConfig: observable,
      showSelectionIndicator: observable,
      selectionIndicatorTop: observable,
      dragging: observable,
      draggingType: observable,
      disabled: observable,
      setData: action,
      toggleCollapse: action,
      setRowCollapse: action,
      setOnUpdate: action,
      setColumns: action,
      setDependencies: action,
      setHideTable: action,
      handlePanMove: action,
      handlePanEnd: action,
      syncSize: action,
      handleResizeTableWidth: action,
      initWidth: action,
      setTranslateX: action,
      switchSight: action,
      scrollToToday: action,
      handleWheel: action,
      handleMouseMove: action,
      showSelectionBar: action,
      handleDragStart: action,
      handleDragEnd: action,
      handleInvalidBarLeave: action,
      handleInvalidBarHover: action,
      handleInvalidBarDragStart: action,
      handleInvalidBarDragEnd: action,
      updateBarSize: action,
      updateTaskDate: action,
      getBarList: computed,
      todayTranslateX: computed,
      scrollBarWidth: computed,
      scrollLeft: computed,
      scrollWidth: computed,
      bodyClientHeight: computed,
      getColumnsWidth: computed,
      totalColumnWidth: computed,
      bodyScrollHeight: computed,
      pxUnitAmp: computed,
      translateAmp: computed,
      getVisibleRows: computed,
    })

    this.width = 1320
    this.height = 418
    this.viewTypeList = customSights.length ? customSights : getViewTypeList(locale)
    const sightConfig = customSights.length ? customSights[0] : getViewTypeList(locale)[0]
    const translateX = dayjs(this.getStartDate()).valueOf() / (sightConfig.value * 1000)
    const bodyWidth = this.width
    const viewWidth = 704
    const tableWidth = 500
    this.viewWidth = viewWidth
    this.tableWidth = tableWidth
    this.translateX = translateX
    this.sightConfig = sightConfig
    this.bodyWidth = bodyWidth
    this.rowHeight = rowHeight
    this.disabled = disabled
    this.locale = locale
  }

  locale = { ...defaultLocale }

  _wheelTimer: number | undefined

  scrollTimer: number | undefined

  data: Gantt.Item[] = []

  originData: Gantt.Record[] = []

  columns: Gantt.Column[] = []

  dependencies: Gantt.Dependence[] = []

  scrolling = false

  scrollTop = 0

  collapse = false

  tableWidth: number

  viewWidth: number

  width: number

  height: number

  bodyWidth: number

  translateX: number

  sightConfig: Gantt.SightConfig

  showSelectionIndicator = false

  selectionIndicatorTop = 0

  dragging: Gantt.Bar | null = null

  draggingType: Gantt.MoveType | null = null

  disabled = false

  viewTypeList = getViewTypeList(this.locale)

  gestureKeyPress = false

  mainElementRef = createRef<HTMLDivElement>()

  chartElementRef = createRef<HTMLDivElement>()

  isPointerPress = false

  startDateKey = 'startDate'

  endDateKey = 'endDate'

  autoScrollPos = 0

  clientX = 0

  rowHeight: number

  onUpdate: GanttProperties['onUpdate'] = () => Promise.resolve(true)

  isRestDay = isRestDay

  getStartDate() {
    return dayjs().subtract(10, 'day').toString()
  }

  setIsRestDay(function_: (date: string) => boolean) {
    this.isRestDay = function_ || isRestDay
  }

  setData(data: Gantt.Record[], startDateKey: string, endDateKey: string) {
    this.startDateKey = startDateKey
    this.endDateKey = endDateKey
    this.originData = data
    this.data = transverseData(data, startDateKey, endDateKey)
  }

  toggleCollapse() {
    if (this.tableWidth > 0) {
      this.tableWidth = 0
      this.viewWidth = this.width - this.tableWidth
    } else {
      this.initWidth()
    }
  }

  setRowCollapse(item: Gantt.Item, collapsed: boolean) {
    item.collapsed = collapsed
  }

  setOnUpdate(onUpdate: GanttProperties['onUpdate']) {
    this.onUpdate = onUpdate
  }

  setColumns(columns: Gantt.Column[]) {
    this.columns = columns
  }

  setDependencies(dependencies: Gantt.Dependence[]) {
    this.dependencies = dependencies
  }

  setHideTable(isHidden = false) {
    if (isHidden) {
      this.tableWidth = 0
      this.viewWidth = this.width - this.tableWidth
    } else {
      this.initWidth()
    }
  }

  handlePanMove(translateX: number) {
    this.scrolling = true
    this.setTranslateX(translateX)
  }

  handlePanEnd() {
    this.scrolling = false
  }

  syncSize(size: { width?: number; height?: number }) {
    if (!size.height || !size.width) return

    const { width, height } = size
    if (this.height !== height) this.height = height

    if (this.width !== width) {
      this.width = width
      this.initWidth()
    }
  }

  handleResizeTableWidth(width: number) {
    const columnsWidthArr = this.columns.filter(column => column.width > 0)
    if (this.columns.length === columnsWidthArr.length) return
    this.tableWidth = width
    this.viewWidth = this.width - this.tableWidth
  }

  initWidth() {
    this.tableWidth = this.totalColumnWidth || 250
    this.viewWidth = this.width - this.tableWidth
    if (this.viewWidth < 200) {
      this.viewWidth = 200
      this.tableWidth = this.width - this.viewWidth
    }
  }

  setTranslateX(translateX: number) {
    this.translateX = Math.max(translateX, 0)
  }

  switchSight(type: Gantt.Sight) {
    const target = find(this.viewTypeList, { type })
    if (target) {
      this.sightConfig = target
      this.setTranslateX(dayjs(this.getStartDate()).valueOf() / (target.value * 1000))
    }
  }

  scrollToToday() {
    const translateX = this.todayTranslateX - this.viewWidth / 2
    this.setTranslateX(translateX)
  }

  getTranslateXByDate(date: string) {
    return dayjs(date).startOf('day').valueOf() / this.pxUnitAmp
  }

  get todayTranslateX() {
    return dayjs().startOf('day').valueOf() / this.pxUnitAmp
  }

  get scrollBarWidth() {
    const MIN_WIDTH = 30
    return Math.max((this.viewWidth / this.scrollWidth) * 160, MIN_WIDTH)
  }

  get scrollLeft() {
    const rate = this.viewWidth / this.scrollWidth
    const currentDate = dayjs(this.translateAmp).toString()
    const half = (this.viewWidth - this.scrollBarWidth) / 2
    const viewScrollLeft =
      half + rate * (this.getTranslateXByDate(currentDate) - this.getTranslateXByDate(this.getStartDate()))
    return Math.min(Math.max(viewScrollLeft, 0), this.viewWidth - this.scrollBarWidth)
  }

  get scrollWidth() {
    const init = this.viewWidth + 200
    return Math.max(Math.abs(this.viewWidth + this.translateX - this.getTranslateXByDate(this.getStartDate())), init)
  }

  get bodyClientHeight() {
    return this.height - HEADER_HEIGHT - 1
  }

  get getColumnsWidth(): number[] {
    if (this.columns.length === 1 && this.columns[0]?.width < 200) return [200]
    const totalColumnWidth = this.columns.reduce((width, item) => width + (item.width || 0), 0)
    const totalFlex = this.columns.reduce((total, item) => total + (item.width ? 0 : item.flex || 1), 0)
    const restWidth = this.tableWidth - totalColumnWidth
    return this.columns.map(column => {
      if (column.width) return column.width

      if (column.flex) return restWidth * (column.flex / totalFlex)

      return restWidth * (1 / totalFlex)
    })
  }

  get totalColumnWidth(): number {
    return this.getColumnsWidth.reduce((width, item) => width + (item || 0), 0)
  }

  get bodyScrollHeight() {
    let height = this.getBarList.length * this.rowHeight + TOP_PADDING
    if (height < this.bodyClientHeight) height = this.bodyClientHeight

    return height
  }

  get pxUnitAmp() {
    return this.sightConfig.value * 1000
  }

  get translateAmp() {
    const { translateX } = this
    return this.pxUnitAmp * translateX
  }

  getDurationAmp() {
    const clientWidth = this.viewWidth
    return this.pxUnitAmp * clientWidth
  }

  getWidthByDate = (startDate: Dayjs, endDate: Dayjs) => (endDate.valueOf() - startDate.valueOf()) / this.pxUnitAmp

  getMajorList(): Gantt.Major[] {
    const majorFormatMap: { [key in Gantt.Sight]: string } = {
      day: this.locale.majorFormat.day,
      week: this.locale.majorFormat.week,
      month: this.locale.majorFormat.month,
      quarter: this.locale.majorFormat.quarter,
      halfYear: this.locale.majorFormat.halfYear,
    }
    const { translateAmp } = this
    const endAmp = translateAmp + this.getDurationAmp()
    const { type } = this.sightConfig
    const format = majorFormatMap[type]

    const getNextDate = (start: Dayjs) => {
      if (type === 'day' || type === 'week') return start.add(1, 'month')

      return start.add(1, 'year')
    }

    const getStart = (date: Dayjs) => {
      if (type === 'day' || type === 'week') return date.startOf('month')

      return date.startOf('year')
    }

    const getEnd = (date: Dayjs) => {
      if (type === 'day' || type === 'week') return date.endOf('month')

      return date.endOf('year')
    }

    let currentDate = dayjs(translateAmp)
    const dates: Gantt.MajorAmp[] = []

    while (currentDate.isBetween(translateAmp - 1, endAmp + 1)) {
      const majorKey = currentDate.format(format)

      let start = currentDate
      const end = getEnd(start)
      if (dates.length > 0) start = getStart(currentDate)

      dates.push({
        label: majorKey,
        startDate: start,
        endDate: end,
      })

      start = getStart(currentDate)
      currentDate = getNextDate(start)
    }

    return this.majorAmp2Px(dates)
  }

  majorAmp2Px(ampList: Gantt.MajorAmp[]) {
    const { pxUnitAmp } = this
    return ampList.map(item => {
      const { startDate } = item
      const { endDate } = item
      const { label } = item
      const left = startDate.valueOf() / pxUnitAmp
      const width = (endDate.valueOf() - startDate.valueOf()) / pxUnitAmp

      return {
        label,
        left,
        width,
        key: startDate.format('YYYY-MM-DD HH:mm:ss'),
      }
    })
  }

  getMinorList(): Gantt.Minor[] {
    const minorFormatMap = {
      day: this.locale.minorFormat.day,
      week: this.locale.minorFormat.week,
      month: this.locale.minorFormat.month,
      quarter: this.locale.minorFormat.quarter,
      halfYear: this.locale.minorFormat.halfYear,
    }
    const fstHalfYear = new Set([0, 1, 2, 3, 4, 5])

    const startAmp = this.translateAmp
    const endAmp = startAmp + this.getDurationAmp()
    const format = minorFormatMap[this.sightConfig.type]

    const getNextDate = (start: Dayjs) => {
      const map = {
        day() {
          return start.add(1, 'day')
        },
        week() {
          return start.add(1, 'week')
        },
        month() {
          return start.add(1, 'month')
        },
        quarter() {
          return start.add(1, 'quarter')
        },
        halfYear() {
          return start.add(6, 'month')
        },
      }

      return map[this.sightConfig.type]()
    }
    const setStart = (date: Dayjs) => {
      const map = {
        day() {
          return date.startOf('day')
        },
        week() {
          return date.weekday(1).hour(0).minute(0).second(0)
        },
        month() {
          return date.startOf('month')
        },
        quarter() {
          return date.startOf('quarter')
        },
        halfYear() {
          if (fstHalfYear.has(date.month())) return date.month(0).startOf('month')

          return date.month(6).startOf('month')
        },
      }

      return map[this.sightConfig.type]()
    }
    const setEnd = (start: Dayjs) => {
      const map = {
        day() {
          return start.endOf('day')
        },
        week() {
          return start.weekday(7).hour(23).minute(59).second(59)
        },
        month() {
          return start.endOf('month')
        },
        quarter() {
          return start.endOf('quarter')
        },
        halfYear() {
          if (fstHalfYear.has(start.month())) return start.month(5).endOf('month')

          return start.month(11).endOf('month')
        },
      }

      return map[this.sightConfig.type]()
    }
    const getMinorKey = (date: Dayjs) => {
      if (this.sightConfig.type === 'halfYear')
        return date.format(format) + (fstHalfYear.has(date.month()) ? this.locale.firstHalf : this.locale.secondHalf)

      return date.format(format)
    }

    let currentDate = dayjs(startAmp)
    const dates: Gantt.MinorAmp[] = []
    while (currentDate.isBetween(startAmp - 1, endAmp + 1)) {
      const minorKey = getMinorKey(currentDate)
      const start = setStart(currentDate)
      const end = setEnd(start)
      dates.push({
        label: minorKey.split('-').pop() as string,
        startDate: start,
        endDate: end,
      })
      currentDate = getNextDate(start)
    }

    return this.minorAmp2Px(dates)
  }

  startXRectBar = (startX: number) => {
    let date = dayjs(startX * this.pxUnitAmp)
    const dayRect = () => {
      const stAmp = date.startOf('day')
      const endAmp = date.endOf('day')
      const left = stAmp / this.pxUnitAmp
      const width = (endAmp - stAmp) / this.pxUnitAmp

      return {
        left,
        width,
      }
    }
    const weekRect = () => {
      if (date.weekday() === 0) date = date.add(-1, 'week')

      const left = date.weekday(1).startOf('day').valueOf() / this.pxUnitAmp
      const width = (7 * 24 * 60 * 60 * 1000 - 1000) / this.pxUnitAmp

      return {
        left,
        width,
      }
    }
    const monthRect = () => {
      const stAmp = date.startOf('month').valueOf()
      const endAmp = date.endOf('month').valueOf()
      const left = stAmp / this.pxUnitAmp
      const width = (endAmp - stAmp) / this.pxUnitAmp

      return {
        left,
        width,
      }
    }

    const map = {
      day: dayRect,
      week: weekRect,
      month: weekRect,
      quarter: monthRect,
      halfYear: monthRect,
    }

    return map[this.sightConfig.type]()
  }

  minorAmp2Px(ampList: Gantt.MinorAmp[]): Gantt.Minor[] {
    const { pxUnitAmp } = this
    return ampList.map(item => {
      const { startDate } = item
      const { endDate } = item

      const { label } = item
      const left = startDate.valueOf() / pxUnitAmp
      const width = (endDate.valueOf() - startDate.valueOf()) / pxUnitAmp

      let isWeek = false
      if (this.sightConfig.type === 'day') isWeek = this.isRestDay(startDate.toString())

      return {
        label,
        left,
        width,
        isWeek,
        key: startDate.format('YYYY-MM-DD HH:mm:ss'),
      }
    })
  }

  getTaskBarThumbVisible(barInfo: Gantt.Bar) {
    const { width, translateX: barTranslateX, invalidDateRange } = barInfo
    if (invalidDateRange) return false

    const rightSide = this.translateX + this.viewWidth
    return barTranslateX + width < this.translateX || barTranslateX - rightSide > 0
  }

  scrollToBar(barInfo: Gantt.Bar, type: 'left' | 'right') {
    const { translateX: barTranslateX, width } = barInfo
    const translateX1 = this.translateX + this.viewWidth / 2
    const translateX2 = barTranslateX + width

    const diffX = Math.abs(translateX2 - translateX1)
    let translateX = this.translateX + diffX

    if (type === 'left') translateX = this.translateX - diffX

    this.setTranslateX(translateX)
  }

  get getBarList(): Gantt.Bar[] {
    const { pxUnitAmp, data } = this
    const minStamp = 11 * pxUnitAmp
    const height = 8
    const baseTop = TOP_PADDING + this.rowHeight / 2 - height / 2
    const topStep = this.rowHeight

    const dateTextFormat = (startX: number) => dayjs(startX * pxUnitAmp).format('YYYY-MM-DD')

    const getDateWidth = (start: number, endX: number) => {
      const startDate = dayjs(start * pxUnitAmp)
      const endDate = dayjs(endX * pxUnitAmp)
      return `${startDate.diff(endDate, 'day') + 1}`
    }

    const flattenData = flattenDeep(data)
    const barList = flattenData.map((item, index) => {
      const valid = item.startDate && item.endDate
      let startAmp = dayjs(item.startDate || 0)
        .startOf('day')
        .valueOf()
      let endAmp = dayjs(item.endDate || 0)
        .endOf('day')
        .valueOf()

      if (Math.abs(endAmp - startAmp) < minStamp) {
        startAmp = dayjs(item.startDate || 0)
          .startOf('day')
          .valueOf()
        endAmp = dayjs(item.endDate || 0)
          .endOf('day')
          .add(minStamp, 'millisecond')
          .valueOf()
      }

      const width = valid ? (endAmp - startAmp) / pxUnitAmp : 0
      const translateX = valid ? startAmp / pxUnitAmp : 0
      const translateY = baseTop + index * topStep
      const { _parent } = item
      const record = { ...item.record, disabled: this.disabled }
      const bar: Gantt.Bar = {
        key: item.key,
        task: item,
        record,
        translateX,
        translateY,
        width,
        label: item.content,
        stepGesture: 'end',
        invalidDateRange: !item.endDate || !item.startDate,
        dateTextFormat,
        getDateWidth,
        loading: false,
        _group: item.group,
        _collapsed: item.collapsed,
        _depth: item._depth as number,
        _index: item._index,
        _parent,
        _childrenCount: !item.children ? 0 : item.children.length,
      }
      item._bar = bar
      return bar
    })
    return observable(barList)
  }

  handleWheel = (event: WheelEvent) => {
    if (event.deltaX !== 0) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (this._wheelTimer) clearTimeout(this._wheelTimer)
    if (Math.abs(event.deltaX) > 0) {
      this.scrolling = true
      this.setTranslateX(this.translateX + event.deltaX)
    }
    this._wheelTimer = window.setTimeout(() => {
      this.scrolling = false
    }, 100)
  }

  handleScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const { scrollTop } = event.currentTarget
    this.scrollY(scrollTop)
  }

  scrollY = throttle((scrollTop: number) => {
    this.scrollTop = scrollTop
  }, 100)

  get getVisibleRows() {
    const visibleHeight = this.bodyClientHeight
    const visibleRowCount = Math.ceil(visibleHeight / this.rowHeight) + 10

    const start = Math.max(Math.ceil(this.scrollTop / this.rowHeight) - 5, 0)
    return {
      start,
      count: visibleRowCount,
    }
  }

  handleMouseMove = debounce(event => {
    if (!this.isPointerPress) this.showSelectionBar(event)
  }, 5)

  handleMouseLeave() {
    this.showSelectionIndicator = false
  }

  showSelectionBar(event: MouseEvent) {
    const scrollTop = this.mainElementRef.current?.scrollTop || 0
    const { top } = this.mainElementRef.current?.getBoundingClientRect() || {
      top: 0,
    }
    const contentHeight = this.getBarList.length * this.rowHeight
    const offsetY = event.clientY - top + scrollTop
    if (offsetY - contentHeight > TOP_PADDING) {
      this.showSelectionIndicator = false
    } else {
      const topValue = Math.floor((offsetY - TOP_PADDING) / this.rowHeight) * this.rowHeight + TOP_PADDING
      this.showSelectionIndicator = true
      this.selectionIndicatorTop = topValue
    }
  }

  getHovered = (top: number) => {
    const baseTop = top - (top % this.rowHeight)
    return this.selectionIndicatorTop >= baseTop && this.selectionIndicatorTop <= baseTop + this.rowHeight
  }

  handleDragStart(barInfo: Gantt.Bar, type: Gantt.MoveType) {
    this.dragging = barInfo
    this.draggingType = type
    barInfo.stepGesture = 'start'
    this.isPointerPress = true
  }

  handleDragEnd() {
    if (this.dragging) {
      this.dragging.stepGesture = 'end'
      this.dragging = null
    }
    this.draggingType = null
    this.isPointerPress = false
  }

  handleInvalidBarLeave() {
    this.handleDragEnd()
  }

  handleInvalidBarHover(barInfo: Gantt.Bar, left: number, width: number) {
    barInfo.translateX = left
    barInfo.width = width
    this.handleDragStart(barInfo, 'create')
  }

  handleInvalidBarDragStart(barInfo: Gantt.Bar) {
    barInfo.stepGesture = 'moving'
  }

  handleInvalidBarDragEnd(barInfo: Gantt.Bar, oldSize: { width: number; x: number }) {
    barInfo.invalidDateRange = false
    this.handleDragEnd()
    this.updateTaskDate(barInfo, oldSize, 'create')
  }

  updateBarSize(barInfo: Gantt.Bar, { width, x }: { width: number; x: number }) {
    barInfo.width = width
    barInfo.translateX = Math.max(x, 0)
    barInfo.stepGesture = 'moving'
  }

  getMovedDay(ms: number): number {
    return Math.round(ms / ONE_DAY_MS)
  }

  async updateTaskDate(
    barInfo: Gantt.Bar,
    oldSize: { width: number; x: number },
    type: 'move' | 'left' | 'right' | 'create'
  ) {
    const { translateX, width, task, record } = barInfo
    const oldStartDate = barInfo.task.startDate
    const oldEndDate = barInfo.task.endDate
    let startDate = oldStartDate
    let endDate = oldEndDate

    if (type === 'move') {
      const moveTime = this.getMovedDay((translateX - oldSize.x) * this.pxUnitAmp)
      startDate = dayjs(oldStartDate).add(moveTime, 'day').format('YYYY-MM-DD HH:mm:ss')
      endDate = dayjs(oldEndDate).add(moveTime, 'day').hour(23).minute(59).second(59).format('YYYY-MM-DD HH:mm:ss')
    } else if (type === 'left') {
      const moveTime = this.getMovedDay((translateX - oldSize.x) * this.pxUnitAmp)
      startDate = dayjs(oldStartDate).add(moveTime, 'day').format('YYYY-MM-DD HH:mm:ss')
    } else if (type === 'right') {
      const moveTime = this.getMovedDay((width - oldSize.width) * this.pxUnitAmp)
      endDate = dayjs(oldEndDate).add(moveTime, 'day').hour(23).minute(59).second(59).format('YYYY-MM-DD HH:mm:ss')
    } else if (type === 'create') {
      startDate = dayjs(translateX * this.pxUnitAmp).format('YYYY-MM-DD HH:mm:ss')
      endDate = dayjs((translateX + width) * this.pxUnitAmp)
        .subtract(1)
        .hour(23)
        .minute(59)
        .second(59)
        .format('YYYY-MM-DD HH:mm:ss')
    }
    if (startDate === oldStartDate && endDate === oldEndDate) return

    runInAction(() => {
      barInfo.loading = true
    })
    const success = await this.onUpdate(toJS(record), startDate, endDate)
    if (success) {
      runInAction(() => {
        task.startDate = startDate
        task.endDate = endDate
      })
    } else {
      barInfo.width = oldSize.width
      barInfo.translateX = oldSize.x
    }
  }

  isToday(key: string) {
    const now = dayjs().format('YYYY-MM-DD')
    const target = dayjs(key).format('YYYY-MM-DD')
    return target === now
  }
}

export default GanttStore
