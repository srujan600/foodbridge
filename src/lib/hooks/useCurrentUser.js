import { useContext, useState } from 'react';
import { AuthContext } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export function useCurrentUser() {
  const { user, isLoadingAuth, checkUserAuth } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const updateUser = async (data) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...data });
        
      if (error) throw error;
      await checkUserAuth();
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { user, loading: isLoadingAuth || loading, updateUser };
}