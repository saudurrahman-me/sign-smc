import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CertificatesPage } from '../pages/CertificatesPage';
import { DEMO_CERTIFICATES } from '../data/fallback-certificates';

describe('Public Certificates Dashboard UI', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders public hero banner with academic certification badge and matching public styling', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CertificatesPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Official Academic Certification/i)).toBeInTheDocument();
    expect(screen.getByText(/Event Certificates & Verification/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply for, download, and verify authenticated certificates/i)).toBeInTheDocument();
  });

  it('renders all three public tab controls with cohesive public styling', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CertificatesPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /My Certificates/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply for Certificate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Authenticity/i })).toBeInTheDocument();
  });

  it('shows the student account login prompt with public card design when unauthenticated on My Certificates', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CertificatesPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Student Account Login Required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign In to Student Portal/i })).toBeInTheDocument();
  });

  it('switches to Apply for Certificate tab and shows public card styling and sign in prompt for guest', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CertificatesPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const applyTabBtn = screen.getByRole('button', { name: /Apply for Certificate/i });
    fireEvent.click(applyTabBtn);

    expect(screen.getByText(/Sign In to Apply for Certificates/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign In to Continue/i })).toBeInTheDocument();
  });

  it('switches to Verify Authenticity tab and verifies a legitimate certificate code successfully', async () => {
    render(
      <MemoryRouter initialEntries={['/certificates?tab=verify']}>
        <AuthProvider>
          <CertificatesPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Verify Certificate Authenticity/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/SIGN-CERT-2026-NEURO01/i)).toBeInTheDocument();

    const sampleCert = DEMO_CERTIFICATES[0];
    const input = screen.getByPlaceholderText(/SIGN-CERT-2026-NEURO01/i);
    const verifyBtn = screen.getByRole('button', { name: /Verify Code/i });

    fireEvent.change(input, { target: { value: sampleCert.certificate_code } });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText(/VERIFIED LEGITIMATE/i)).toBeInTheDocument();
      expect(screen.getByText(/Authenticated SIGN SMC Record/i)).toBeInTheDocument();
      expect(screen.getByText(sampleCert.student_name)).toBeInTheDocument();
      expect(screen.getByText(sampleCert.event_title)).toBeInTheDocument();
    });
  });
});
