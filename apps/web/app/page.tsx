import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import {
  Hero,
  Collections,
  BestSellers,
  OrderingSteps,
  TrustFeatures,
  Testimonials,
  FinalCta,
} from '@/components/landing';

export default function Home() {
  return (
    <div className="home-container">
      <Header />
      <Hero />
      <Collections />
      <BestSellers />
      <OrderingSteps />
      <TrustFeatures />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}
