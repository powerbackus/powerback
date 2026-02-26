import React, {
  useMemo,
  useCallback,
  type ReactNode,
  type MouseEventHandler,
  type KeyboardEventHandler,
} from 'react';
import type { DeviceProp, ProfileProp, FieldControl } from '@Types';
import { Stack, ListGroup } from 'react-bootstrap';
import type { ContactInfo } from '@Interfaces';
import './style.css';

type FieldGroupProps = ProfileProp &
  DeviceProp & {
    jumpToField: MouseEventHandler<HTMLSpanElement> &
      KeyboardEventHandler<HTMLSpanElement>;
    filterFields: (field: FieldControl) => boolean;
    employedColumn: ReactNode;
    fieldList: FieldControl[];
    type: string;
  };

const FieldGroup = ({
  employedColumn,
  filterFields,
  contactInfo,
  jumpToField,
  fieldList,
  isMobile,
  type,
}: FieldGroupProps) => {
  // UseMemo: Computes the icon class for the employed field, memoized for contactInfo and isMobile.
  const employedIcon = useMemo(() => {
      if (!contactInfo || isMobile) return;
      else {
        const bi = 'bi bi-';
        // If not employed, show "finished" bookmark icon, else a different icon.
        if (!contactInfo.isEmployed) {
          return bi + 'bookmark-check finished-field';
        } else {
          return bi + 'arrow-down-left-square';
        }
      }
    }, [isMobile, contactInfo]),
    // useCallback: Determines if the 'passport' field should be hidden, based on country.
    hidePassport = useCallback(
      (name: string) => {
        return (
          ((contactInfo as ContactInfo).country as string) ===
            'United States' && name === 'passport'
        );
      },
      [contactInfo]
    ),
    // useCallback: Hides employment related fields when user is not employed.
    hideEmploymentRelated = useCallback(
      (name: string) => {
        if (!(contactInfo as ContactInfo).isEmployed) {
          return (
            name === 'isEmployed' ||
            name === 'occupation' ||
            name === 'employer'
          );
        } else return false;
      },
      [contactInfo]
    ),
    // useCallback: Controls tabIndex for accessibility; disables tab if blank or not 'isEmployed'.
    handleAccessFieldListItem = useCallback(
      (field: string) => {
        return +!(
          (contactInfo as ContactInfo)[field as keyof ContactInfo] === '' ||
          field !== 'isEmployed'
        );
      },
      [contactInfo]
    ),
    // useCallback: Adds 'jump-to-field' class for fields that are blank and not 'isEmployed'.
    handleJumpToFieldClass = useCallback(
      (field: string) => {
        if (
          (contactInfo as ContactInfo)[field as keyof ContactInfo] === '' &&
          field !== 'isEmployed'
        ) {
          return 'jump-to-field';
        }
      },
      [contactInfo]
    ),
    // useCallback: Returns custom label for zip code if outside US, or field's default label.
    handleItemLabel = useCallback(
      (field: FieldControl) => {
        if (
          field.name === 'zip' &&
          (contactInfo as ContactInfo).country !== 'United States'
        ) {
          return 'Postal Code';
        } else return field.label;
      },
      [contactInfo]
    ),
    // useCallback: Identifies if a given field is 'isEmployed'.
    employedField = useCallback((field: FieldControl) => {
      return field.name === 'isEmployed';
    }, []),
    // useCallback: Determines which icon to render for a field, including employment and completeness status.
    handleIcon = useCallback(
      (field: FieldControl) => {
        if (employedField(field)) {
          if (isMobile) return <i className={employedIcon} />;
          else return null;
        } else
          return (contactInfo as ContactInfo)[
            (field as FieldControl).name as keyof ContactInfo
          ] ? (
            <i className='bi bi-bookmark-check finished-field' />
          ) : (
            <i className='bi bi-exclamation-circle text-warning' />
          );
      },
      [isMobile, contactInfo, employedIcon, employedField]
    ),
    // useCallback: Renders either the alternate column or a field's label (e.g., for employment status row).
    handleFieldListItemLabel = useCallback(
      (field: FieldControl, altColumn: ReactNode) => {
        return employedField(field) ? altColumn : handleItemLabel(field);
      },
      [employedField, handleItemLabel]
    );

  return (
    <ListGroup
      variant={'flush'}
      className={'profile-list-group mt-2'}
    >
      {fieldList
        .filter((field) => filterFields(field))
        .map((field) => (
          <ListGroup.Item
            className={type}
            hidden={
              hidePassport(field.name) || hideEmploymentRelated(field.name)
            }
            key={field.name + 'list-group-item'}
          >
            <Stack direction={'horizontal'}>
              <span
                className={handleJumpToFieldClass(field.name)}
                tabIndex={handleAccessFieldListItem(field.name)}
                onKeyDown={jumpToField}
                onClick={jumpToField}
              >
                {handleFieldListItemLabel(
                  field as unknown as FieldControl,
                  employedColumn
                )}
              </span>
              &nbsp;
              {handleIcon(field as unknown as FieldControl)}
            </Stack>
          </ListGroup.Item>
        ))}
    </ListGroup>
  );
};

export default React.memo(FieldGroup);
