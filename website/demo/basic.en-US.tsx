import dayjs from 'dayjs'
import RcGantt, { enUS } from 'rc-gantt'
import React, { useRef, useState } from 'react'
import type { DropResult } from 'react-beautiful-dnd'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'

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
  startDate: string | null
  endDate: string | null
  dependencies: string[]
  custom_class: string
  projectTaskStatus: TaskStatus
  assignee: Assignee[]
  children: Task[]
  collapsed: boolean
  dependencyList: Dependency[]
  waitingOnDependencyCount: number
  blockingOnDependencyCount: number
  activityName?: string
  dueDate?: string
}

interface Data {
  id: string
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
        collapsed: false,
        dependencyList: [],
        waitingOnDependencyCount: 0,
        blockingOnDependencyCount: 0,
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

const formattedData: Data[] = completeData
  .filter(task => task.startDate && task.endDate) // Only include scheduled tasks
  .map(task => ({
    id: task.id,
    name: task.name,
    startDate: dayjs(task.startDate).format('YYYY-MM-DD'),
    endDate: dayjs(task.endDate).format('YYYY-MM-DD'),
  }))

const transformDependencies = (tasks: Task[]) => {
  const dependencies: { from: string; to: string; type: string }[] = []
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
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>(
    completeData.filter(task => !task.startDate || !task.endDate) // Unscheduled tasks
  )
  const ganttRef = useRef<HTMLDivElement>(null) // Create a ref for the Gantt chart container

  const dependencies = transformDependencies(completeData)

  const handleOnDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const draggedTask = unscheduledTasks.find(task => task.id === draggableId)

    if (draggedTask && destination.droppableId === 'gantt') {
      // Get the drop position relative to the Gantt chart
      const ganttElement = ganttRef.current
      if (!ganttElement) return

      const ganttRect = ganttElement.getBoundingClientRect()
      const dropPositionX = result.source.x - ganttRect.left // X position relative to the Gantt chart

      const pxPerDay = 100 // Example: 100 pixels per day, adjust based on your Gantt chart settings
      const dropDate = dayjs()
        .add(Math.floor(dropPositionX / pxPerDay), 'days')
        .format('YYYY-MM-DD')

      const newTask = {
        ...draggedTask,
        startDate: dropDate,
        endDate: dayjs(dropDate).add(1, 'week').format('YYYY-MM-DD'),
      }

      setData(prev => [
        ...prev,
        {
          id: newTask.id,
          name: newTask.name,
          startDate: newTask.startDate,
          endDate: newTask.endDate,
        },
      ])

      setUnscheduledTasks(prev => prev.filter(task => task.id !== draggableId))
    }
  }

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <div style={{ display: 'flex', width: '100%', height: '800px' }}>
        <Droppable droppableId='tasks'>
          {provided => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                width: '200px',
                padding: '8px',
                borderRight: '1px solid #ccc',
                overflowY: 'auto',
              }}
            >
              <h3>Unscheduled Tasks</h3>
              {unscheduledTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {provided => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        padding: '8px',
                        margin: '4px',
                        background: '#f0f0f0',
                        border: '1px solid #ccc',
                        cursor: 'move',
                        ...provided.draggableProps.style,
                      }}
                    >
                      {task.name}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        <div ref={ganttRef} style={{ flex: 1, padding: '8px', position: 'relative' }}>
          <Droppable droppableId='gantt'>
            {provided => (
              <div ref={provided.innerRef} {...provided.droppableProps} style={{ height: '100%' }}>
                <RcGantt<Data>
                  data={data}
                  columns={[
                    {
                      name: 'name',
                      label: 'Task Name',
                      width: 150,
                    },
                  ]}
                  dependencies={dependencies}
                  locale={enUS}
                  onUpdate={async (row, startDate, endDate) => {
                    setData(prev => {
                      const newList = prev.map(item => (item.id === row.id ? { ...item, startDate, endDate } : item))
                      return newList
                    })
                    return true
                  }}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  )
}

export default App
