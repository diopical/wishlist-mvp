import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.https://supabase.com/dashboard/project/sondbwdrdgvzjtjdslaq!
const supabaseAnonKey = process.env.sb_publishable_pcwqhodDtNzs2CpvbZROpQ_D_JW6Bxh!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)