import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/client';

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