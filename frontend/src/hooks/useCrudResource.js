import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/client';

/**
 * Reusable CRUD helper for list-style pages (devices, hardware, software, etc.).
 *
 * What this gives each page:
 * - `items`, `loading`, and `saving` state out of the box.
 * - One consistent error message string for banners/toasts.
 * - Helper actions (`createItem`, `updateItem`, `deleteItem`) that refresh data after success.
 *
 * Expectation:
 * - listFn/createFn/updateFn/deleteFn should return axios-like responses.
 */
export const useCrudResource = ({
  listFn,
  createFn,
  updateFn,
  deleteFn,
  loadErrorMessage,
  createErrorMessage,
  updateErrorMessage,
  deleteErrorMessage,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Keep fetch state handling in one place so every page behaves the same on load/reload.
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listFn();
      setItems(response.data || []);
    } catch (error) {
      setError(getApiErrorMessage(error, loadErrorMessage));
    } finally {
      setLoading(false);
    }
  }, [listFn, loadErrorMessage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // After create/update/delete, re-read from the API so UI reflects true server state.
  const createItem = useCallback(async (payload) => {
    try {
      setSaving(true);
      setError('');
      await createFn(payload);
      await refresh();
      return true;
    } catch (error) {
      setError(getApiErrorMessage(error, createErrorMessage));
      return false;
    } finally {
      setSaving(false);
    }
  }, [createErrorMessage, createFn, refresh]);

  const updateItem = useCallback(async (id, payload) => {
    try {
      setSaving(true);
      setError('');
      await updateFn(id, payload);
      await refresh();
      return true;
    } catch (error) {
      setError(getApiErrorMessage(error, updateErrorMessage));
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh, updateErrorMessage, updateFn]);

  const deleteItem = useCallback(async (id) => {
    try {
      setSaving(true);
      setError('');
      await deleteFn(id);
      await refresh();
      return true;
    } catch (error) {
      setError(getApiErrorMessage(error, deleteErrorMessage));
      return false;
    } finally {
      setSaving(false);
    }
  }, [deleteErrorMessage, deleteFn, refresh]);

  return {
    items,
    setItems,
    loading,
    saving,
    error,
    setError,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
};