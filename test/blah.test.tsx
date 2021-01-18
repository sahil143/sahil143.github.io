import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Sahil143GitHubIO } from '../src';

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Sahil143GitHubIO />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
