export const operations = ['freq', 'mod', 'amount', 'gain']

export const colors = ['darkred', 'blue', 'purple', 'maroon', '#666600', 'saddlebrown', 'mediumvioletred']

export const modules = {
  oscillators: [
    {
      id: 0,
      freq: {
        value: 0,
        offset: 0,
        init: 440,
        min: 55,
        max: 1760,
        step: 1
      },
      mod: {
        value: 0,
        offset: 0,
        init: 0,
        min: 0,
        max: 3,
        step: 0.01
      },
      amount: {
        value: 0,
        offset: 0,
        init: 0,
        min: 0,
        max: 3,
        step: 0.01
      },
      gain: {
        value: 0,
        offset: 0,
        init: 0.1,
        min: 0,
        max: 1,
        step: 0.05
      }
    }
  ],
  lfos: []
}
