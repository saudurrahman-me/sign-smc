import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AboutSection } from '../components/public/AboutSection';
import { MissionVisionSection } from '../components/public/MissionVisionSection';
import { LeadershipSection } from '../components/public/LeadershipSection';
import { EventsSection } from '../components/public/EventsSection';
import { ContactSection } from '../components/public/ContactSection';
import { Footer } from '../components/public/Footer';
import { OFFICIAL_CONTENT, INITIAL_LEADERSHIP_PLACEHOLDERS } from '../data/fallback-content';
import { APP_VERSION } from '../config/version';

describe('Public Website Academic Sections', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  it('renders official Preamble verbatim without modification', () => {
    render(<AboutSection />);
    expect(screen.getByText(/About SIGN Chapter/i)).toBeInTheDocument();
    expect(screen.getByText(`"${OFFICIAL_CONTENT.preamble.content}"`)).toBeInTheDocument();
    expect(screen.getAllByText(/At the Bedside/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/In the Community/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/In Scientific Literature/i).length).toBeGreaterThan(0);
  });

  it('renders official Mission, Vision, and all 6 Core Objectives', () => {
    render(<MissionVisionSection />);
    expect(screen.getByText(OFFICIAL_CONTENT.mission.content)).toBeInTheDocument();
    expect(screen.getByText(OFFICIAL_CONTENT.vision.content)).toBeInTheDocument();

    // Verify all 6 objectives
    OFFICIAL_CONTENT.objectives.items.forEach((obj) => {
      expect(screen.getByText(obj.title)).toBeInTheDocument();
      expect(screen.getByText(obj.description)).toBeInTheDocument();
    });
  });

  it('renders leadership section with official leadership members', () => {
    render(<LeadershipSection />);
    expect(screen.getByText(/Leadership & Executive Committee/i)).toBeInTheDocument();
    expect(screen.getByText(/Prof. Dr. Muhammad Ayub Khan/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Fawad Ali/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Amjad Iqbal/i)).toBeInTheDocument();
    expect(screen.getByText(/Adil Khan/i)).toBeInTheDocument();
    expect(screen.getByText(/Saleem Jan/i)).toBeInTheDocument();
    expect(screen.getByText(/Irshad Ahmad/i)).toBeInTheDocument();
    expect(screen.getByText(/Waqar Younas/i)).toBeInTheDocument();
    expect(screen.getByText(/Eshaal Khan/i)).toBeInTheDocument();
    expect(screen.getByText(/Hadia Zahoor/i)).toBeInTheDocument();
    expect(screen.getByText(/Yusra Panezai/i)).toBeInTheDocument();

    // Verify verified email contact links
    expect(screen.getByLabelText(/Email Adil Khan/i)).toHaveAttribute('href', 'mailto:adilmusawir@gmail.com');
    expect(screen.getByLabelText(/Email Saleem Jan/i)).toHaveAttribute('href', 'mailto:sj3463586@gmail.com');
    expect(screen.getByLabelText(/Email Irshad Ahmad/i)).toHaveAttribute('href', 'mailto:irshadahmad.access@gmail.com');
    expect(screen.getByLabelText(/Email Eshaal Khan/i)).toHaveAttribute('href', 'mailto:eshaal.smc@student.edu.pk');
  });

  it('renders executive lineup with male sequence first followed by girls (Eshaal, Hadia, Yusra)', () => {
    const { container } = render(<LeadershipSection />);
    const textContent = container.textContent || '';
    const adilPos = textContent.indexOf('Adil Khan');
    const saleemPos = textContent.indexOf('Saleem Jan');
    const irshadPos = textContent.indexOf('Irshad Ahmad');
    const waqarPos = textContent.indexOf('Waqar Younas');
    const eshaalPos = textContent.indexOf('Eshaal Khan');
    const hadiaPos = textContent.indexOf('Hadia Zahoor');
    const yusraPos = textContent.indexOf('Yusra Panezai');

    // All positions found
    expect(adilPos).toBeGreaterThan(-1);
    expect(saleemPos).toBeGreaterThan(-1);
    expect(irshadPos).toBeGreaterThan(-1);
    expect(waqarPos).toBeGreaterThan(-1);
    expect(eshaalPos).toBeGreaterThan(-1);
    expect(hadiaPos).toBeGreaterThan(-1);
    expect(yusraPos).toBeGreaterThan(-1);

    // Male sequence first: Adil < Saleem < Irshad < Waqar
    expect(adilPos).toBeLessThan(saleemPos);
    expect(saleemPos).toBeLessThan(irshadPos);
    expect(irshadPos).toBeLessThan(waqarPos);

    // All males before girls: Waqar < Eshaal
    expect(waqarPos).toBeLessThan(eshaalPos);

    // Girls sequence: 1st Eshaal, then Hadia, then Yusra
    expect(eshaalPos).toBeLessThan(hadiaPos);
    expect(hadiaPos).toBeLessThan(yusraPos);
  });

  it('respects user-configured display_order rank when updated in storage', () => {
    // Custom order: rank Dr. Amjad Iqbal (rank 2) before Dr. Fawad Ali (rank 3)
    const customProfiles = INITIAL_LEADERSHIP_PLACEHOLDERS.map((p) => {
      if (p.full_name === 'Dr. Amjad Iqbal') {
        return { ...p, display_order: 2 };
      }
      if (p.full_name === 'Dr. Fawad Ali') {
        return { ...p, display_order: 3 };
      }
      return p;
    });
    sessionStorage.setItem('sign_dev_leadership_profiles', JSON.stringify(customProfiles));

    const { container } = render(<LeadershipSection />);
    const textContent = container.textContent || '';
    const fawadPos = textContent.indexOf('Dr. Fawad Ali');
    const amjadPos = textContent.indexOf('Dr. Amjad Iqbal');

    expect(fawadPos).toBeGreaterThan(-1);
    expect(amjadPos).toBeGreaterThan(-1);
    // Dr. Amjad Iqbal (rank 2) must appear before Dr. Fawad Ali (rank 3)
    expect(amjadPos).toBeLessThan(fawadPos);
  });

  it('correctly renders member assigned to rank 8 before member shifted to rank 9', () => {
    // Specifically test moving Hadia (#9) to rank #8 and shifting Eshaal to rank #9
    const customProfiles = INITIAL_LEADERSHIP_PLACEHOLDERS.map((p) => {
      if (p.full_name.includes('Hadia')) {
        return { ...p, display_order: 8 };
      }
      if (p.full_name.includes('Eshaal')) {
        return { ...p, display_order: 9 };
      }
      return p;
    });
    sessionStorage.setItem('sign_dev_leadership_profiles', JSON.stringify(customProfiles));

    const { container } = render(<LeadershipSection />);
    const textContent = container.textContent || '';
    const hadiaPos = textContent.indexOf('Hadia Zahoor');
    const eshaalPos = textContent.indexOf('Eshaal Khan');

    expect(hadiaPos).toBeGreaterThan(-1);
    expect(eshaalPos).toBeGreaterThan(-1);
    // Hadia (rank 8) must appear before Eshaal (rank 9)
    expect(hadiaPos).toBeLessThan(eshaalPos);
  });

  it('renders events section with clean empty state when no upcoming events exist', () => {
    render(<EventsSection />);
    expect(screen.getByText(/Events & Academic Activities/i)).toBeInTheDocument();
    expect(screen.getByText(/No Upcoming Events Currently Scheduled/i)).toBeInTheDocument();
  });

  it('renders contact section with institutional coordinates, email, and verified channels', () => {
    render(<ContactSection />);
    expect(screen.getByText(/Saidu Medical College, Saidu Sharif, Swat/i)).toBeInTheDocument();
    expect(screen.getByText(/Official Inquiries/i)).toBeInTheDocument();
    expect(screen.getByText(/signsmc.official@gmail.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Instagram Channel/i)).toBeInTheDocument();
    expect(screen.getByText(/Facebook Community/i)).toBeInTheDocument();
  });

  it('renders public footer with central platform version badge', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText(APP_VERSION)).toBeInTheDocument();
  });
});
