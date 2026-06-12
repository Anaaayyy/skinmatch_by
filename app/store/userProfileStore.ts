import { create } from 'zustand';

interface UserSkinProfile {
  skinType: string;
  problems: string[];
}

interface UserProfileState {
  profile: UserSkinProfile | null;
  isProfileComplete: boolean;
  setProfile: (profile: UserSkinProfile) => void;
  clearProfile: () => void;
  loadProfile: () => void;
  loadProfileFromServer: (data: { skin_type: string; problems: string }) => void;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: null,
  isProfileComplete: false,
  
  setProfile: (profile: UserSkinProfile) => {
    localStorage.setItem('userSkinProfile', JSON.stringify(profile));
    set({ 
      profile, 
      isProfileComplete: !!(profile.skinType && profile.problems.length > 0) 
    });
  },
  
  clearProfile: () => {
    localStorage.removeItem('userSkinProfile');
    set({ profile: null, isProfileComplete: false });
  },
  
  loadProfile: () => {
    const saved = localStorage.getItem('userSkinProfile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        set({ 
          profile, 
          isProfileComplete: !!(profile.skinType && profile.problems.length > 0) 
        });
      } catch {
        set({ profile: null, isProfileComplete: false });
      }
    }
  },
  
  loadProfileFromServer: (data: { skin_type: string; problems: string }) => {
    const profile: UserSkinProfile = {
      skinType: data.skin_type || '',
      problems: data.problems ? data.problems.split(', ') : [],
    };
    localStorage.setItem('userSkinProfile', JSON.stringify(profile));
    set({ 
      profile, 
      isProfileComplete: !!(profile.skinType && profile.problems.length > 0) 
    });
  },
}));