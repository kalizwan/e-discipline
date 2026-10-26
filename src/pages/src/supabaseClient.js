import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://meaybfvicexeranpsjbr.supabase.co';
const supabaseKey = 'sb_publishable_TA1E9CdISIubQxMqQYxHZw_LURC1dI7';

export const supabase = createClient(supabaseUrl, supabaseKey);
