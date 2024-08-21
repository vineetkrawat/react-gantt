---
title: 'React Gantt Component'
hero:
  title: 'rc-gantt'
  desc: Gantt Component
  actions:
    - text: Quick Start →
      link: /component

footer: Open-source MIT Licensed | Copyright © 2021<br />
---

## Getting Started

## 📦 Install dependencies

```shell
$ yarn add rc-gantt  # or npm i rc-gantt -S
```

## 🔨 Demo

<code src="./demo/basic.en-US.tsx"></code>

```tsx
import RcGantt, { enUS } from 'rc-gantt'

// in react page
return (
  <RcGantt
    data={data}
    locale={enUS}
    columns={[
      {
        name: 'name',
        label: 'name',
        width: 200,
      },
    ]}
    onUpdate={async () => {
      return true
    }}
  />
)
```

## Feedback

Please visit [Github](https://github.com/ahwgs/react-gantt/issues)
