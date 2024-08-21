import dayjs from 'dayjs'
import RcGantt from 'rc-gantt'
import React, { useState } from 'react'

interface Data {
  id: number
  name: string
  startDate: string
  endDate: string
}

const data = [
  {
    estimation: { title: 'Story Points' },
    actual: { title: 'Story Points' },
    _id: '66b875e2c4186dd3d2a43a22',
    companyId: '66b875cfc4186dd3d2a43935',
    projectId: '66b875e0c4186dd3d2a43983',
    parentTask: null,
    activityName: 'Task 1',
    key: 'K4LF07-1',
    assignee: [{ _id: '66b875c4c4186dd3d2a43917', email: 'vineet-testing@yopmail.com', name: 'Vineet Testing' }],
    isMilestone: false,
    reported: '66b875c4c4186dd3d2a43917',
    activityType: null,
    type: 'Task',
    projectTaskStatus: {
      _id: '66b875e0c4186dd3d2a439a0',
      taskStatus: 'In Progress',
      referenceStatus: 'In Progress',
      taskStatusColor: '#B9E6FE',
      displayOrder: 3,
      id: '66b875e0c4186dd3d2a439a0',
    },
    position: 1,
    taskAccess: 'PUBLIC',
    dueDate: '2024-08-24T00:00:00.000Z',
    startDate: '2024-08-18T00:00:00.000Z',
    subTaskCount: 2,
    tagList: [],
    commentCount: 0,
    customFieldValue: [],
    waitingOnDependencyCount: 0,
    blockingOnDependencyCount: 0,
    id: '66b875e2c4186dd3d2a43a22',
  },
  {
    estimation: { title: 'Story Points' },
    actual: { title: 'Story Points' },
    _id: '66b875e2c4186dd3d2a43a23',
    companyId: '66b875cfc4186dd3d2a43935',
    projectId: '66b875e0c4186dd3d2a43983',
    parentTask: null,
    activityName: 'Task 2',
    key: 'KZ8GU6-2',
    assignee: [{ _id: '66b875c4c4186dd3d2a43917', email: 'vineet-testing@yopmail.com', name: 'Vineet Testing' }],
    isMilestone: false,
    reported: '66b875c4c4186dd3d2a43917',
    activityType: null,
    type: 'Task',
    projectTaskStatus: {
      _id: '66b875e0c4186dd3d2a4399e',
      taskStatus: 'Open',
      referenceStatus: 'Open',
      taskStatusColor: '#FFE5A0',
      displayOrder: 1,
      id: '66b875e0c4186dd3d2a4399e',
    },
    position: 2,
    taskAccess: 'PUBLIC',
    dueDate: '2024-08-29T00:00:00.000Z',
    startDate: '2024-08-18T00:00:00.000Z',
    subTaskCount: 2,
    tagList: [],
    commentCount: 0,
    customFieldValue: [],
    waitingOnDependencyCount: 1,
    blockingOnDependencyCount: 0,
    id: '66b875e2c4186dd3d2a43a23',
  },
  {
    estimation: { title: 'Story Points' },
    actual: { title: 'Story Points' },
    _id: '66b875e2c4186dd3d2a43a24',
    companyId: '66b875cfc4186dd3d2a43935',
    projectId: '66b875e0c4186dd3d2a43983',
    parentTask: null,
    activityName: 'Task 3',
    key: 'B1C1U3-3',
    assignee: [],
    isMilestone: false,
    reported: '66b875c4c4186dd3d2a43917',
    activityType: null,
    type: 'Task',
    projectTaskStatus: {
      _id: '66b875e0c4186dd3d2a4399e',
      taskStatus: 'Open',
      referenceStatus: 'Open',
      taskStatusColor: '#FFE5A0',
      displayOrder: 1,
      id: '66b875e0c4186dd3d2a4399e',
    },
    position: 3,
    taskAccess: 'PUBLIC',
    dueDate: '2024-09-09T00:00:00.000Z',
    startDate: '2024-08-24T00:00:00.000Z',
    subTaskCount: 0,
    tagList: [],
    commentCount: 0,
    customFieldValue: [],
    waitingOnDependencyCount: 0,
    blockingOnDependencyCount: 1,
    id: '66b875e2c4186dd3d2a43a24',
  },
]

const formattedData = data.map((task, index) => ({
  id: index + 1,
  name: task.activityName,
  startDate: dayjs(task.startDate).format('YYYY-MM-DD'),
  endDate: dayjs(task.dueDate).format('YYYY-MM-DD'),
  ...task, // keep the rest of the properties the same
}))

const App = () => {
  const [data, setData] = useState(formattedData)
  // console.log('data', data)
  return (
    <div style={{ width: '100%', height: 500 }}>
      <RcGantt<Data>
        data={data}
        columns={[
          {
            name: 'name',
            label: '名称',
            width: 100,
          },
        ]}
        onUpdate={async (row, startDate, endDate) => {
          // console.log('update', row, startDate, endDate)
          setData(prev => {
            const newList = [...prev]
            const index = newList.findIndex(val => val.id === row.id)
            newList[index] = {
              ...row,
              startDate: dayjs(startDate).format('YYYY-MM-DD'),
              endDate: dayjs(endDate).format('YYYY-MM-DD'),
            }
            return newList
          })
          return true
        }}
      />
    </div>
  )
}

export default App
