/**
 * Dialogue context. Modals, alerts, overlay, side nav visibility.
 * @module DialogueContext
 */
import {
  useMemo,
  useState,
  useContext,
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { INIT } from '@CONSTANTS';
import { logWarn } from '@Utils';
import type { ModalData, ShowAlert, ShowModal, ShowOverlay } from './types';

/**
 * Dialogue UI state interface
 * Tracks visibility state of various UI dialogue components
 */
interface DialogueState {
  /** Alert notification states (success, error, info messages) */
  showAlert: ShowAlert;
  /** Modal dialog states (credentials, account, terms, etc.) */
  showModal: ShowModal;
  /** Modal data storage (data passed to modals when shown) */
  modalData: ModalData;
  /** Side navigation panel visibility */
  showSideNav: boolean;
  /** Overlay states (password reset, loading screens) */
  showOverlay: ShowOverlay;
}

/**
 * Dialogue actions interface
 * Provides state setters for controlling UI dialogue visibility
 */
interface DialogueActions {
  /** Update alert visibility states */
  setShowAlert: Dispatch<SetStateAction<ShowAlert>>;
  /** Update modal visibility states */
  setShowModal: Dispatch<SetStateAction<ShowModal>>;
  /** Update modal data storage */
  setModalData: Dispatch<SetStateAction<ModalData>>;
  /** Toggle side navigation visibility */
  setShowSideNav: Dispatch<SetStateAction<boolean>>;
  /** Update overlay visibility states */
  setShowOverlay: Dispatch<SetStateAction<ShowOverlay>>;
}

/**
 * Dialogue Context
 * Centralized state management for all UI dialogue components
 *
 * Manages visibility and state for:
 * - Alert notifications (success, error, warning messages)
 * - Modal dialogs (authentication, account settings, terms)
 * - Side navigation panel
 * - Overlay screens (password reset, loading states)
 *
 * This context prevents prop drilling and provides a single source of truth
 * for all dialogue-related UI state across the application
 */
const DialogueContext = createContext<DialogueState & DialogueActions>({
  // Default state values
  modalData: {},
  showSideNav: false,
  showAlert: INIT.alerts,
  showModal: INIT.modals,
  showOverlay: INIT.overlays,

  // Default no-op functions with warnings
  setShowAlert: () => logWarn('setShowAlert called outside dialogue provider'),
  setShowModal: () => logWarn('setShowModal called outside dialogue provider'),
  setModalData: () => logWarn('setModalData called outside dialogue provider'),
  setShowOverlay: () =>
    logWarn('setShowOverlay called outside dialogue provider'),
  setShowSideNav: () =>
    logWarn('setShowSideNav called outside dialogue provider'),
});

/**
 * Dialogue Provider Component
 * Provides centralized state management for all UI dialogue components
 *
 * This provider should wrap the entire application or major sections that need
 * access to dialogue state. It maintains separate state objects for different
 * categories of UI elements to enable fine-grained control.
 *
 * State Categories:
 * - Alerts: Temporary notifications (success, error, info)
 * - Modals: Blocking dialogs requiring user interaction
 * - Overlays: Full-screen or overlay content (password reset forms)
 * - SideNav: Navigation panel visibility
 *
 * @param children - Child components that need access to dialogue context
 */
export const DialogueProvider = ({ children }: { children: ReactNode }) => {
  // Initialize all dialogue states with default values
  const [showSideNav, setShowSideNav] = useState(false);
  const [showAlert, setShowAlert] = useState(INIT.alerts);
  const [showModal, setShowModal] = useState(INIT.modals);
  const [modalData, setModalData] = useState<ModalData>({});
  const [showOverlay, setShowOverlay] = useState(INIT.overlays);

  // Memoize the context value to prevent unnecessary re-renders
  return (
    <DialogueContext.Provider
      value={useMemo(
        () => ({
          // Current state values
          modalData,
          showAlert,
          showModal,
          showOverlay,
          showSideNav,

          // State setters for updating dialogue visibility
          setModalData,
          setShowAlert,
          setShowModal,
          setShowOverlay,
          setShowSideNav,
        }),
        [modalData, showAlert, showModal, showOverlay, showSideNav]
      )}
    >
      {children}
    </DialogueContext.Provider>
  );
};

/**
 * Hook to access dialogue context
 * Must be used within DialogueProvider component tree
 *
 * Provides access to all dialogue state and setter functions for:
 * - Showing/hiding alert notifications
 * - Opening/closing modal dialogs
 * - Toggling side navigation
 * - Managing overlay screens
 *
 * @returns DialogueState & DialogueActions - Complete dialogue context
 */
export const useDialogue = () => useContext(DialogueContext);
