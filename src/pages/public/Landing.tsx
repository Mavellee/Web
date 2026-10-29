import { Hero } from "./landing/Hero";
import { ClosingCta, ExpertsSection, GamesSection, IntentionsSection, JourneySection, SafetySection } from "./landing/Sections";

export function Landing() {
  return (
    <>
      <Hero />
      <IntentionsSection />
      <JourneySection />
      <ExpertsSection />
      <GamesSection />
      <SafetySection />
      <ClosingCta />
    </>
  );
}
