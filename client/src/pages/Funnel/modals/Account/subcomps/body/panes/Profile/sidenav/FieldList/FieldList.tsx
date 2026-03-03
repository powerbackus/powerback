/**
 * FieldList component
 *
 * Renders a navigable list of profile form fields in the account modal sidebar.
 * Handles field navigation, focus management, and conditional rendering based on
 * employment status and compliance tier.
 *
 * @module FieldList
 */

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useTransition,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  type MouseEventHandler,
  type KeyboardEventHandler,
} from 'react';
import type { ContactInfo } from '@Interfaces';
import type { UserData } from '@Contexts';
import FieldGroup from './FieldGroup';
import { CONTROLS } from '../..';
import type {
  FieldControl,
  DeviceProp,
  ProfileProp,
  UserDataProp,
} from '@Types';
import './style.css';

type FieldListLocalProps = {
  setActiveTab: Dispatch<SetStateAction<string>>;
  getFieldMap: () => Map<string, HTMLElement>;
  fieldList: FieldControl[];
  setFieldList: () => void;
  activeTab: string;
};

type FieldListComponentProps = FieldListLocalProps & {
  user: UserData;
} & UserDataProp &
  ProfileProp &
  DeviceProp;

/**
 * FieldList component
 *
 * Displays a list of profile form fields organized by category. Supports:
 * - Click/keyboard navigation to jump to specific fields
 * - Automatic focus management when switching between form tabs
 * - Conditional rendering of employment fields based on employment status
 * - Simplified UI for compliant compliance tier users (all required fields complete)
 *
 * @param props - Component props including field list, contact info, and handlers
 * @param props.setActiveTab - Handler to switch between form tabs
 * @param props.getFieldMap - Function returning a ref map of field labels to input elements
 * @param props.fieldList - Array of field controls to display
 * @param props.activeTab - Currently active form tab identifier
 * @param props.contactInfo - User contact information
 * @param props.isMobile - Whether the viewport is mobile-sized
 * @param props.user - User data including compliance tier
 * @returns Rendered field list or gold tier completion indicator
 */
const FieldList = ({
  setActiveTab,
  contactInfo,
  getFieldMap,
  activeTab,
  fieldList,
  isMobile,
  user,
  ...props
}: FieldListComponentProps) => {
  const [myLabelledControl, setMyLabelledControl] = useState<
    FieldControl[] | null
  >(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Use transition to prevent blocking UI during focus operations when tabs change
  const [isFocusing, startFocusing] = useTransition();

  /**
   * Handles navigation to a specific field when user clicks or presses Enter on a field label.
   * Normalizes label text and switches to the appropriate form tab if the field is empty.
   */
  const jumpToField = useCallback(
    (e: MouseEvent & KeyboardEvent) => {
      if (e.type === 'keydown' && e.key !== 'Enter') return;

      const t = e.target,
        last = (t as HTMLInputElement).lastElementChild;
      let clickedLabel = (t as HTMLInputElement).textContent as string;
      // Normalize "Postal Code" to "Zip" to match form field name
      if (clickedLabel === 'Postal Code') clickedLabel = 'Zip';
      // Remove any suffix text (e.g., indicator icons) from the label
      if (last)
        clickedLabel = clickedLabel
          .replace(last.textContent as string, '')
          .trim();

      // Find the form tab that contains the clicked field
      type FormTab = { controls: FieldControl[]; eventKey: string };
      const controlsList = CONTROLS as unknown as FormTab[];
      const [clickedFormTab] = controlsList.filter((form) =>
        form.controls.map((field) => field.label).includes(clickedLabel)
      );

      // if (!clickedFormTab) return;
      const tabControls = clickedFormTab.controls;
      setMyLabelledControl(
        tabControls.filter((field: FieldControl) =>
          field.label.includes(clickedLabel)
        )
      );
      const [labelledControl] = tabControls.filter((field: FieldControl) =>
        field.label.includes(clickedLabel)
      );
      // if (!labelledControl) return;
      // Only switch tabs if the field is empty (skip navigation if already filled)
      if (
        (contactInfo as ContactInfo)[
          labelledControl.name as keyof ContactInfo
        ] !== ''
      )
        return;
      setActiveTab(clickedFormTab.eventKey as unknown as string);
    },
    [contactInfo, setActiveTab]
  );

  const prevActiveTabRef = useRef(activeTab);
  if (prevActiveTabRef.current !== activeTab) {
    prevActiveTabRef.current = activeTab;
    startFocusing(() => {
      setFocusedInput((s) =>
        myLabelledControl ? (s = myLabelledControl[0].label) : s
      );
    });
  }

  // Focus the target input field after tab transition completes
  // Uses a ref map to find the input element by label name
  useEffect(() => {
    if (!focusedInput || isFocusing) return;
    const map = getFieldMap();
    if (!map?.size) return;
    map.get(focusedInput)?.focus();
  }, [setFocusedInput, focusedInput, isFocusing, getFieldMap]);

  // Filter functions to separate employment fields from other profile fields
  // FEC compliance requires employment info only if user is employed
  const employmentRelated = useCallback((field: FieldControl) => {
    return field.name === 'occupation' || field.name === 'employer';
  }, []);

  const notEmploymentRelated = useCallback((field: FieldControl) => {
    return field.name !== 'occupation' && field.name !== 'employer';
  }, []);

  // Render employment fields column only if user is employed
  // Employment fields are conditionally required by FEC based on employment status
  const employedColumn = useMemo(
    () => (
      <>
        {!isMobile && <span>Are you employed?</span>}
        {(((contactInfo as ContactInfo).isEmployed as boolean) && (
          <FieldGroup
            jumpToField={
              jumpToField as unknown as MouseEventHandler<HTMLSpanElement> &
                KeyboardEventHandler<HTMLSpanElement>
            }
            filterFields={employmentRelated}
            contactInfo={contactInfo}
            fieldList={fieldList}
            employedColumn={null}
            isMobile={isMobile}
            type={'employment'}
            {...props}
          />
        )) ||
          null}
      </>
    ),
    [employmentRelated, contactInfo, jumpToField, fieldList, isMobile, props]
  );

  // Compliant tier users have all required fields complete, so show completion indicator
  // instead of the field list
  if (user.compliance === 'compliant') {
    return !isMobile ? (
      <>
        <i className={'bi bi-list-check text-success'} />
        <span className={'full-compliance inter'}>
          {' '}
          You are compliant with FEC requirements.
        </span>
      </>
    ) : null;
  }
  return (
    <FieldGroup
      jumpToField={
        jumpToField as unknown as MouseEventHandler<HTMLSpanElement> &
          KeyboardEventHandler<HTMLSpanElement>
      }
      employedColumn={employedColumn as unknown as ReactNode}
      filterFields={notEmploymentRelated}
      contactInfo={contactInfo}
      fieldList={fieldList}
      isMobile={isMobile}
      type={'contact'}
      {...props}
    />
  );
};

export default React.memo(FieldList);
