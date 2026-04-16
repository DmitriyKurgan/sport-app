import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type LoadPreference = 'rir' | 'rpe';

interface UIState {
  sidebarOpen: boolean;
  loadPreference: LoadPreference;
}

const initialState: UIState = {
  sidebarOpen: true,
  loadPreference: 'rir',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoadPreference(state, action: PayloadAction<LoadPreference>) {
      state.loadPreference = action.payload;
    },
  },
});

export const { toggleSidebar, setLoadPreference } = uiSlice.actions;
export default uiSlice.reducer;
