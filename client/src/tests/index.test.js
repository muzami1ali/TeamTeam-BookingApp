import ReactDOM from 'react-dom/client';
// Snapshot test for index.js
test('index test', () => {
  const div = document.createElement('div');
  div.setAttribute('id', 'root');
  document.body.appendChild(div);

  ReactDOM.createRoot = jest.fn(() => ({
    render: jest.fn(),  
    unmount: jest.fn(),
  }));

  require('../index.tsx');

  expect(ReactDOM.createRoot).toHaveBeenCalledWith(div);
});