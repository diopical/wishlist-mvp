import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://supabase.com/dashboard/project/sondbwdrdgvzjtjdslaq'
const supabaseAnonKey = 'sb_publishable_pcwqhodDtNzs2CpvbZROpQ_D_JW6Bxh'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)