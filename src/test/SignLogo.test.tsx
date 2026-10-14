import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignLogo } from '../components/brand/SignLogo';

describe('SignLogo Brand Component', () => {
  it('renders the neuroscience emblem with accessible label', () => {
    render(<SignLogo variant="icon" size="md" />);
    expect(screen.getByLabelText('SIGN Neuroscience Emblem')).toBeInTheDocument();
  });

  it('renders the full academic branding lockup with typography', () => {
    render(<SignLogo variant="full" size="md" />);
    expect(screen.getByText('SIGN-SMC')).toBeInTheDocument();
    expect(screen.getByText('Student Interest Group in Neurology')).toBeInTheDocument();
  });
});
