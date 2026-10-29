import { Faq } from '@/components/landing/Faq';
import { FeatureList } from '@/components/landing/FeatureList';
import { FinalCta } from '@/components/landing/FinalCta';
import { IntroScene } from '@/components/landing/IntroScene';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { NightScroll } from '@/components/landing/NightScroll';
import { TableRail } from '@/components/landing/TableRail';

export function LandingPage() {
  return (
    <div className="landing-theme landing-scroll min-h-screen">
      <LandingHeader />
      <main>
        <IntroScene />
        <NightScroll />
        <TableRail />
        <FeatureList />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
