import dayjs from 'dayjs'
import RcGantt, { enUS } from 'rc-gantt'
import React, { useState } from 'react'

// Define interfaces for the task and dependencies
interface TaskStatus {
  _id: string
  taskStatus: string
  referenceStatus: string
  taskStatusColor: string
  displayOrder: number
  id: string
}

interface Assignee {
  _id: string
  email: string
  name: string
}

interface Dependency {
  _id: string
  taskId: string
  dependencyId: string
  dependencyType: string
  createdBy: string
  status: string
  createdAt: string
  updatedAt: string
  id: string
}

interface Task {
  id: string
  name: string
  startDateExists: boolean
  startDate: string
  endDate: string
  dependencies: string[]
  custom_class: string
  projectTaskStatus: TaskStatus
  assignee: Assignee[]
  children: Task[]
  collapsed: boolean
  dependencyList: Dependency[]
  waitingOnDependencyCount: number
  blockingOnDependencyCount: number
  activityName?: string // Since this property might exist in some tasks
  dueDate?: string // Since this property might exist in some tasks
}

interface Data {
  id: string // Keep this as string to match Task's id
  name: string
  startDate: string
  endDate: string
}

const completeData: Task[] = [
  {
    id: '66bd996f51ca7f1788120bd0',
    name: 'Task 2',
    startDateExists: true,
    startDate: '2024-08-21',
    endDate: '2024-08-28',
    dependencies: [],
    custom_class: 'cc-red',
    projectTaskStatus: {
      _id: '66bd996d51ca7f1788120b50',
      taskStatus: 'Done',
      referenceStatus: 'Done',
      taskStatusColor: '#ACDC79',
      displayOrder: 6,
      id: '66bd996d51ca7f1788120b50',
    },
    assignee: [
      {
        _id: '66bd993a51ca7f1788120adb',
        email: 'vineet-kroolo@yopmail.com',
        name: 'Vineet Kroolo',
      },
    ],
    children: [],
    collapsed: true,
    dependencyList: [
      {
        _id: '66c580e8cc7fe4f5f2854085',
        taskId: '66bd996f51ca7f1788120bd0',
        dependencyId: '66bd996f51ca7f1788120bcf',
        dependencyType: 'Blocking',
        createdBy: '66bd993a51ca7f1788120adb',
        status: 'ACTIVE',
        createdAt: '2024-08-21T05:53:44.793Z',
        updatedAt: '2024-08-21T05:53:44.793Z',
        id: '66c580e8cc7fe4f5f2854085',
      },
    ],
    waitingOnDependencyCount: 0,
    blockingOnDependencyCount: 1,
  },
  {
    id: '66bed9450d8a818543bb1d92',
    name: 'Task 4',
    startDateExists: true,
    startDate: '2024-08-24',
    endDate: '2024-09-07',
    dependencies: [],
    custom_class: 'cc-red',
    projectTaskStatus: {
      _id: '66bd996d51ca7f1788120b4d',
      taskStatus: 'In Progress',
      referenceStatus: 'In Progress',
      taskStatusColor: '#B9E6FE',
      displayOrder: 3,
      id: '66bd996d51ca7f1788120b4d',
    },
    assignee: [
      {
        _id: '66bd993a51ca7f1788120adb',
        email: 'vineet-kroolo@yopmail.com',
        name: 'Vineet Kroolo',
      },
    ],
    children: [],
    collapsed: true,
    dependencyList: [],
    waitingOnDependencyCount: 0,
    blockingOnDependencyCount: 0,
  },
  {
    id: '66bd996f51ca7f1788120bcf',
    name: 'How to add task so that you always add it when ever you feel like.',
    startDateExists: true,
    startDate: '2024-08-29',
    endDate: '2024-09-11',
    dependencies: [],
    custom_class: 'cc-red',
    projectTaskStatus: {
      _id: '66bd996d51ca7f1788120b4b',
      taskStatus: 'Open',
      referenceStatus: 'Open',
      taskStatusColor: '#FFE5A0',
      displayOrder: 1,
      id: '66bd996d51ca7f1788120b4b',
    },
    assignee: [],
    children: [
      {
        id: '66bd999251ca7f1788120c7a',
        name: 'SUbtask 1',
        startDateExists: true,
        startDate: '2024-08-17',
        endDate: '2024-08-21',
        dependencies: ['66bd996f51ca7f1788120bcf'],
        custom_class: 'cc-blue',
        projectTaskStatus: {
          _id: '66bd996d51ca7f1788120b4b',
          taskStatus: 'Open',
          referenceStatus: 'Open',
          taskStatusColor: '#FFE5A0',
          displayOrder: 1,
          id: '66bd996d51ca7f1788120b4b',
        },
        assignee: [],
        children: [],
      },
    ],
    collapsed: true,
    dependencyList: [
      {
        _id: '66c580e8cc7fe4f5f2854083',
        taskId: '66bd996f51ca7f1788120bcf',
        dependencyId: '66bd996f51ca7f1788120bd0',
        dependencyType: 'WaitingOn',
        createdBy: '66bd993a51ca7f1788120adb',
        status: 'ACTIVE',
        createdAt: '2024-08-21T05:53:44.781Z',
        updatedAt: '2024-08-21T05:53:44.781Z',
        id: '66c580e8cc7fe4f5f2854083',
      },
    ],
    waitingOnDependencyCount: 1,
    blockingOnDependencyCount: 0,
  },
]

const formattedData: Data[] = completeData.map(task => ({
  id: task.id, // Use the original `id` from the task
  name: task.name,
  startDate: dayjs(task.startDate).format('YYYY-MM-DD'),
  endDate: dayjs(task.endDate).format('YYYY-MM-DD'),
  // Do not spread the original task to prevent overwriting `id`, `name`, `startDate`, `endDate`
}))

const transformDependencies = (tasks: Task[]) => {
  const dependencies: { from: string; to: string; type: string }[] = []

  if (!tasks || !Array.isArray(tasks)) {
    console.error('Tasks are not defined or not an array')
    return dependencies
  }

  tasks.forEach(task => {
    if (task.dependencyList && Array.isArray(task.dependencyList)) {
      const blockingDependency = task.dependencyList.find(dependency => dependency.dependencyType === 'Blocking')
      if (blockingDependency) {
        dependencies.push({
          to: blockingDependency.dependencyId,
          from: task.id,
          type: 'finish_start',
        })
      }
    }
  })

  return dependencies
}

const App: React.FC = () => {
  const [data, setData] = useState<Data[]>(formattedData)

  const dependencies = transformDependencies(completeData)
  // console.log('data', dependencies)

  return (
    <div style={{ width: '100%', height: 500 }}>
      <RcGantt<Data>
        data={data}
        columns={[
          {
            name: 'name',
            label: 'Custom Title',
            width: 100,
          },
        ]}
        dependencies={dependencies}
        locale={enUS}
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
