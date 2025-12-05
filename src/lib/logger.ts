import { supabase } from './supabaseClient';

type LogAction = 'INSERT' | 'UPDATE' | 'DELETE';

interface LogPayload {
  action: LogAction;
  tableName: string;
  recordId?: string | number | null;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  description: string;
  isError?: boolean;
  errorDetails?: Record<string, any> | null;
}

/**
 * Logs an activity to the Supabase 'logs' table.
 * @param payload - The data to be logged.
 */
export const logActivity = async (payload: LogPayload) => {
  const { data: { user } } = await supabase.auth.getUser();

  const logEntry = {
    user_id: user?.id,
    action: payload.action,
    table_name: payload.tableName,
    record_id: payload.recordId?.toString(),
    old_data: payload.oldData,
    new_data: payload.newData,
    description: payload.description,
    is_error: payload.isError || false,
    error_details: payload.errorDetails,
  };

  const { error } = await supabase.from('logs').insert([logEntry]);

  if (error) {
    console.error('Error logging activity:', error);
    // Depending on the requirements, you might want to handle this more gracefully
    // For now, we just log it to the console.
  }
};
