import { Route, Routes } from 'react-router-dom';
import { HealthPage } from './pages/HealthPage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingWelcomePage } from './pages/OnboardingWelcomePage';
import { SignupPage } from './pages/SignupPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/health" element={<HealthPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding/welcome" element={<OnboardingWelcomePage />} />
    </Routes>
  );
}
