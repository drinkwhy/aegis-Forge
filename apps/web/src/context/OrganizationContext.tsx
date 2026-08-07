'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';

interface OrganizationContextType {
  organizationId: string | null;
  organizationName: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizationId: null,
  organizationName: null,
  isLoading: true,
  refetch: async () => {},
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOrganization = async () => {
    if (!isUserLoaded || !isOrgLoaded) return;

    if (organization?.id) {
      setOrgId(organization.id);
      setOrgName(organization.name);
      setIsLoading(false);
      return;
    }

    if (user?.id) {
      try {
        const res = await fetch('/api/v1/organizations');
        if (res.ok) {
          const data = await res.json();
          if (data.organizations && data.organizations.length > 0) {
            setOrgId(data.organizations[0].id);
            setOrgName(data.organizations[0].display_name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user organization:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [user?.id, organization?.id, isUserLoaded, isOrgLoaded]);

  return (
    <OrganizationContext.Provider
      value={{
        organizationId: orgId,
        organizationName: orgName,
        isLoading,
        refetch: fetchOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useActiveOrganization() {
  return useContext(OrganizationContext);
}
