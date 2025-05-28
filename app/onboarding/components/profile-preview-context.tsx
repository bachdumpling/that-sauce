"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getOnboardingStatusAction } from "@/actions/onboarding-actions";

// Define the context type
type ProfilePreviewContextType = {
  profileData: any;
  updateProfileData: (data: any) => void;
  refreshData: () => Promise<void>;
};

// Create the context
const ProfilePreviewContext = createContext<ProfilePreviewContextType>({
  profileData: {},
  updateProfileData: () => {},
  refreshData: async () => {},
});

// Helper function for deep comparison
function isEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return obj1 === obj2;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => isEqual(obj1[key], obj2[key]));
}

// Context provider component
export function ProfilePreviewProvider({
  children,
  initialProfileData = {},
}: {
  children: React.ReactNode;
  initialProfileData?: any;
}) {
  const [profileData, setProfileData] = useState(initialProfileData);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Function to fetch profile data from the database
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOnboardingStatusAction();
      if (response.success && response.data) {
        const { profile, creator, user_role } = response.data;

        // Merge creator data with profile data for the preview
        // Prioritize creator data as it contains most display fields
        setProfileData(prevData => {
          const mergedData = {
            ...prevData,
            ...profile,
            ...(creator || {}),
            user_role: user_role || profile?.user_role,
          };
          
          // Only update if data actually changed
          if (isEqual(prevData, mergedData)) return prevData;
          return mergedData;
        });
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when component mounts and whenever the pathname changes
  useEffect(() => {
    fetchProfileData();
  }, [pathname, fetchProfileData]);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchProfileData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchProfileData]);

  // Update profile data with a stable function reference
  const updateProfileData = useCallback((newData) => {
    setProfileData(prevData => {
      // Skip update if there are no actual changes
      const hasChanges = Object.keys(newData).some(key => {
        return !isEqual(newData[key], prevData[key]);
      });

      if (!hasChanges) return prevData;

      return {
        ...prevData,
        ...newData,
      };
    });
  }, []);

  // Create the context value
  const contextValue = {
    profileData,
    updateProfileData,
    refreshData: fetchProfileData,
  };

  return (
    <ProfilePreviewContext.Provider value={contextValue}>
      {children}
    </ProfilePreviewContext.Provider>
  );
}

// Custom hook to use the context
export function useProfilePreview() {
  return useContext(ProfilePreviewContext);
}
