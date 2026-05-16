import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('렌더링 시 "Debug Trainer" 타이틀이 보인다', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /Debug Trainer/i })
    ).toBeInTheDocument();
  });

  it('Phase 1 안내 문구가 보인다', () => {
    render(<HomePage />);
    expect(screen.getByText(/Phase 1/i)).toBeInTheDocument();
  });
});
