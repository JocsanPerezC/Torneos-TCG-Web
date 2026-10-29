import { Faq } from '@/features/landing/components/Faq';
import { FeatureList } from '@/features/landing/components/FeatureList';
import { FinalCta } from '@/features/landing/components/FinalCta';
import { IntroScene } from '@/features/landing/components/IntroScene';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { LandingHeader } from '@/features/landing/components/LandingHeader';
import { NightScroll } from '@/features/landing/components/NightScroll';
import { TableRail } from '@/features/landing/components/TableRail';

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
