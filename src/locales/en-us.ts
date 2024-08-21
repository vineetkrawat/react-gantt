import type { GanttLocale } from '../Gantt'

export const enUS: GanttLocale = Object.freeze({
  today: 'Today',
  day: 'Day',
  days: 'Days',
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  halfYear: 'Half year',
  firstHalf: 'First half',
  secondHalf: 'Second half',
  majorFormat: {
    day: 'MMMM, YYYY',
    week: 'MMMM, YYYY',
    month: 'MMMM, YYYY',
    quarter: 'MMMM, YYYY',
    halfYear: 'MMMM, YYYY',
  },
  minorFormat: {
    day: 'D',
    week: 'wo [week]',
    month: 'MMMM',
    quarter: '[Q]Q',
    halfYear: 'YYYY-',
  },
})
