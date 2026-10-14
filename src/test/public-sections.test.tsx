import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutSection } from '../components/public/AboutSection';
import { MissionVisionSection } from '../components/public/MissionVisionSection';
import { LeadershipSection } from '../components/public/LeadershipSection';
import { EventsSection } from '../components/public/EventsSection';
import { ContactSection } from '../components/public/ContactSection';
import { OFFICIAL_CONTENT } from '../data/fallback-content';

describe('Public Website Academic Sections', () => {
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
});
