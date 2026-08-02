import { Route, Routes } from 'react-router-dom';
import { AppErrorBoundary } from './error-boundary';
import { AlbumPage } from './album/page';
import { CheckinPage } from './checkin/page';
import { InvitationPage } from './invitation-page';
import { LandingPage } from './landing/page';
import { TemplateLibraryPage } from './templates/page';
import { TemplateDetailPage } from './templates/detail-page';
import { GuestInvitationPage } from './guest/page';
import { NotFoundPage } from './not-found-page';
import { CreateInvitationPage } from './create/page';
import { RecapPage } from './recap/page';
import { PrivacyPolicyPage } from './privacy-policy/page';
import { PartnerHostBrand } from '../components/partner-host-brand';

export function App() {
  return (
    <AppErrorBoundary>
      <PartnerHostBrand />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/templates" element={<TemplateLibraryPage />} />
        <Route path="/templates/:slug" element={<TemplateDetailPage />} />
        <Route path="/create" element={<CreateInvitationPage />} />
        <Route path="/guest/:token" element={<GuestInvitationPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/album/:slug" element={<AlbumPage />} />
        <Route path="/recap/:shareToken" element={<RecapPage />} />

        {/* Public invitation — must stay after marketing routes */}
        <Route path="/:slug" element={<InvitationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppErrorBoundary>
  );
}

export default App;
