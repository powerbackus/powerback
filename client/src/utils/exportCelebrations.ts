/**
 * @fileoverview Export utilities for celebration history (CSV download helpers).
 * Converts Celebration documents to a compliant CSV format for users to download.
 * @module utils/exportCelebrations
 */

import type { Celebration } from '@Types';
import type { CelebrationTargetStatus } from '@CONSTANTS';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

dayjs.extend(timezone);
dayjs.extend(utc);

/**
 * Escapes a CSV field value by wrapping in quotes if it contains commas, quotes, or newlines
 */
const escapeCSVField = (
  value: string | number | boolean | null | undefined
): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Formats a date for CSV export
 */
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const ET_TIMEZONE = 'America/New_York';
  return dayjs(date).tz(ET_TIMEZONE).format('MM-DD-YYYY HH:mm:ss [ET]');
};

/**
 * Gets the status of a celebration
 */
const getStatus = (celebration: Celebration): string => {
  if (celebration.resolved) return 'Resolved';
  if (celebration.defunct) return 'Defunct';
  if (celebration.paused) return 'Paused';
  return 'Active';
};

/**
 * Formats bill ID for display (removes last 4 characters and uppercases)
 */
const formatBillId = (billId: string): string => {
  if (!billId || billId.length < 4) return billId;
  return billId.substring(0, billId.length - 4).toUpperCase();
};

/**
 * Extracts date from status_ledger for a specific status
 */
const getStatusDate = (
  celebration: Celebration,
  targetStatus: CelebrationTargetStatus
): string => {
  const ledger = celebration.status_ledger;
  if (!ledger || !Array.isArray(ledger)) return '';

  // Find the most recent entry with the target status
  const statusEntry = ledger
    .filter(
      (entry: { new_status?: string }) => entry.new_status === targetStatus
    )
    .sort(
      (a: { change_datetime?: string }, b: { change_datetime?: string }) => {
        const dateA = new Date(a.change_datetime ?? 0).getTime();
        const dateB = new Date(b.change_datetime ?? 0).getTime();
        return dateB - dateA; // Most recent first
      }
    )[0];

  if (!statusEntry || !statusEntry.change_datetime) return '';
  return formatDate(statusEntry.change_datetime).split(' ')[0] || '';
};

/**
 * Extracts resume date from status_ledger (when status changed from paused to something else)
 */
const getResumeDate = (celebration: Celebration): string => {
  const ledger = celebration.status_ledger;
  if (!ledger || !Array.isArray(ledger)) return '';

  // Find entries where status changed FROM paused
  const resumeEntry = ledger
    .filter(
      (entry: { previous_status?: string; new_status?: string }) =>
        entry.previous_status === 'paused' && entry.new_status !== 'paused'
    )
    .sort(
      (a: { change_datetime?: string }, b: { change_datetime?: string }) => {
        const dateA = new Date(a.change_datetime ?? 0).getTime();
        const dateB = new Date(b.change_datetime ?? 0).getTime();
        return dateB - dateA; // Most recent first
      }
    )[0];

  if (!resumeEntry || !resumeEntry.change_datetime) return '';
  return formatDate(resumeEntry.change_datetime).split(' ')[0] || '';
};

/**
 * Converts an array of celebrations to CSV format
 * @param celebrations - Array of celebration objects to export
 * @returns CSV string ready for download
 */
export const celebrationsToCSV = (celebrations: Celebration[]): string => {
  if (celebrations.length === 0) return '';

  // Check which optional columns should be included
  const hasDefunctData = celebrations.some(
    (c) => c.defunct_date || c.defunct_reason
  );
  const hasResolvedData = celebrations.some((c) => c.resolved);
  const hasPausedData = celebrations.some((c) => c.paused);

  // Base headers (always included)
  const baseHeaders = [
    'Celebration ID',
    'Date Created',
    'Time Created',
    'Status',
    'Donation Amount',
    'Tip Amount',
    'Total Amount',
    'Representative',
    'Representative FEC ID',
    'Bill ID',
    'Bill Number',
    'Bill Name',
  ];

  // Optional headers (conditionally included)
  const optionalHeaders: string[] = [];
  if (hasDefunctData) {
    optionalHeaders.push('Defunct Date', 'Defunct Reason');
  }
  if (hasResolvedData) {
    optionalHeaders.push('Resolved Date');
  }
  if (hasPausedData) {
    optionalHeaders.push('Paused Date', 'Resumed Date');
  }

  const headers = [...baseHeaders, ...optionalHeaders];

  // Convert celebrations to CSV rows
  const rows = celebrations.map((celebration) => {
    const createdAt = celebration.createdAt
      ? new Date(celebration.createdAt)
      : celebration._id
        ? new Date(
            parseInt(
              (celebration._id as unknown as string).substring(0, 8),
              16
            ) * 1000
          )
        : null;

    const dateCreated = formatDate(createdAt);
    const timeCreated = createdAt
      ? dayjs(createdAt).tz('America/New_York').format('HH:mm:ss [ET]')
      : '';
    const status = getStatus(celebration);
    const donationAmount = celebration.donation || 0;
    const tipAmount = celebration.tip || 0;
    const totalAmount = donationAmount + tipAmount;
    const billId = formatBillId(celebration.bill_id || '');

    // Base row data (always included)
    const baseRow = [
      escapeCSVField(celebration.idempotencyKey || ''),
      dateCreated.split(' ')[0] || '', // Date only
      timeCreated,
      escapeCSVField(status),
      escapeCSVField(donationAmount.toFixed(2)),
      escapeCSVField(tipAmount.toFixed(2)),
      escapeCSVField(totalAmount.toFixed(2)),
      escapeCSVField(celebration.pol_name || ''),
      escapeCSVField(celebration.FEC_id || ''),
      escapeCSVField(billId),
      escapeCSVField(celebration.bill_id || ''),
      escapeCSVField(''), // Bill Name - not available in celebration data
    ];

    // Optional row data (conditionally included)
    const optionalRow: string[] = [];
    if (hasDefunctData) {
      const defunctDate = celebration.defunct_date
        ? formatDate(celebration.defunct_date).split(' ')[0] || ''
        : '';
      optionalRow.push(
        defunctDate,
        escapeCSVField(celebration.defunct_reason || '')
      );
    }
    if (hasResolvedData) {
      const resolvedDate = celebration.resolved
        ? getStatusDate(celebration, 'resolved')
        : '';
      optionalRow.push(resolvedDate);
    }
    if (hasPausedData) {
      const pausedDate = celebration.paused
        ? getStatusDate(celebration, 'paused')
        : '';
      const resumedDate = celebration.paused ? '' : getResumeDate(celebration);
      optionalRow.push(pausedDate, resumedDate);
    }

    return [...baseRow, ...optionalRow];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Triggers a download of the CSV file
 * @param csvContent - The CSV string content
 * @param filename - Optional filename (defaults to powerback-celebrations-YYYY-MM-DD.csv)
 */
export const downloadCSV = (csvContent: string, filename?: string): void => {
  const date = new Date();
  const dateStr = dayjs(date).format('YYYY-MM-DD');
  const defaultFilename = `powerback-celebrations-${dateStr}.csv`;
  const finalFilename = filename || defaultFilename;

  // Create a blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
};
