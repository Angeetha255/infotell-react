import { configureStore, createSlice } from '@reduxjs/toolkit';


// ── UI Slice ──────────────────────────────────────────────────
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isLoginOpen: false,
    isMobileMenuOpen: false,
    activeTab: 'accommodation',
  },
  reducers: {
    toggleLogin: (state) => { state.isLoginOpen = !state.isLoginOpen; },
    setLoginOpen: (state, action) => { state.isLoginOpen = action.payload; },
    toggleMobileMenu: (state) => { state.isMobileMenuOpen = !state.isMobileMenuOpen; },
    setActiveTab: (state, action) => { state.activeTab = action.payload; },
  },
});

export const { toggleLogin, setLoginOpen, toggleMobileMenu, setActiveTab } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
  },
});
