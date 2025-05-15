import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './components/SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addRadio({
      path: 'color',
      name: 'Circle Color',
      defaultValue: 'red',
      settings: {
        options: [
          {
            value: 'red',
            label: 'Red'
          },
          {
            value: 'green',
            label: 'Green'
          },
          {
            value: 'blue',
            label: 'Blue'
          }
        ]
      }
    });
});
