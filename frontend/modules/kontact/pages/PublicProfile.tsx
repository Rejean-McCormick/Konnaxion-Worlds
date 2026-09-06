// FILE: frontend/modules/kontact/pages/PublicProfile.tsx
﻿// frontend/modules/kontact/pages/PublicProfile.tsx

import UserProfile from '@/components/user-components/UserProfile';
import MainLayout from '@/shared/layout/MainLayout';

/**
 * Kontact · Public Profile page
 *
 * Reuses the existing UserProfile component, which:
 * - reads ?id=<USER_ID> from the URL
 * - fetches /users/:id and /users/:id/comments via the shared API client
 * - renders profile summary + recent comments
 */
export default function PublicProfilePage() {
  return (
    <MainLayout>
      <UserProfile />
    </MainLayout>
  );
}
