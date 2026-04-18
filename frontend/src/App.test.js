import { render, screen } from '@testing-library/react';

jest.mock('./pages/Dashboard', () => () => <h1>Dashboard Page</h1>);
jest.mock('./pages/FloorPage', () => () => <div>Floor Page</div>);
jest.mock('./pages/DevicesPage', () => () => <div>Devices Page</div>);
jest.mock('./pages/SoftwarePage', () => () => <div>Software Page</div>);
jest.mock('./pages/HardwarePage', () => () => <div>Hardware Page</div>);

import App from './App';

test('renders the app shell and default route', () => {
  render(<App />);

  expect(screen.getByText('IT Tracker')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Dashboard Page' })).toBeInTheDocument();
});