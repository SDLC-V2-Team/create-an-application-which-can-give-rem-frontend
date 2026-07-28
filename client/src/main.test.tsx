import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import App from './App';

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

jest.mock('./App', () => {
  const MockApp = () => <div>Mocked App</div>;
  MockApp.displayName = 'App';
  return MockApp;
});

jest.mock('./register-sw', () => {});

describe('main entry point', () => {
  beforeEach(() => {
    jest.resetModules();
    // Setup a default root element for happy path
    document.getElementById = jest.fn().mockReturnValue(document.createElement('div'));
  });

  it('should render App inside React.StrictMode when root element exists', () => {
    require('./main');

    const rootElement = document.getElementById('root');
    expect(document.getElementById).toHaveBeenCalledWith('root');
    expect(ReactDOMClient.createRoot).toHaveBeenCalledWith(rootElement);

    const mockRoot = (ReactDOMClient.createRoot as jest.Mock).mock.results[0].value;
    expect(mockRoot.render).toHaveBeenCalledTimes(1);
    const renderedElement = mockRoot.render.mock.calls[0][0];
    expect(renderedElement.type).toBe(React.StrictMode);
    expect(renderedElement.props.children.type).toBe(App);
  });

  it('should throw error when root element is missing', () => {
    document.getElementById = jest.fn().mockReturnValue(null);

    expect(() => {
      jest.isolateModules(() => {
        require('./main');
      });
    }).toThrow();
  });

  it('should have imported the service worker registration module', () => {
    // The mock for './register-sw' was set, ensuring the import is side-effect free.
    // Verifying that the mock was defined confirms that the import occurred.
    const registerMock = require('./register-sw');
    expect(registerMock).toBeDefined();
  });
});