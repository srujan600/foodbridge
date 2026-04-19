-- Supabase RPC Function to delete the current user's account
-- Run this in your Supabase project's SQL Editor to fix the "Failed to delete account" error.

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the currently authenticated user from auth.users.
  -- This will automatically cascade and delete rows in public tables 
  -- if foreign key constraints with ON DELETE CASCADE are set up.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
