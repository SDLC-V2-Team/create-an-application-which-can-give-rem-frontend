import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

jest.mock('./App', () => {
  const React = require('react');
  return () => React.createElement('div', null, 'Mock App');
});

describe('main entry point', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  const loadMain = () => {
    jest.isolateModules(() => {
      require('./main');
    });
  };

  it('renders App inside React.StrictMode when root element exists', () => {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    document.body.appendChild(rootDiv);

    loadMain();

    expect(createRoot).toHaveBeenCalledWith(rootDiv);
    const mockRoot = (createRoot as jest.Mock).mock.results[0].value;
    expect(mockRoot.render).toHaveBeenCalledTimes(1);
    const renderedElement = mockRoot.render.mock.calls[0][0];
    expect(renderedElement.type).toBe(React.StrictMode);
    expect(renderedElement.props.children.type).toBe(App);
  });

  it('throws an error when the #root element is missing', () => {
    expect(() => {
      jest.isolateModules(() => {
        require('./main');
      });
    }).toThrow();
  });

  it('calls createRoot with whatever document.getElementById returns', () => {
    const fakeElement = {};
    jest.spyOn(document, 'getElementById').mockReturnValue(fakeElement as any);

    jest.isolateModules(() => {
      require('./main');
    });

    expect(createRoot).toHaveBeenCalledWith(fakeElement);
  });
});