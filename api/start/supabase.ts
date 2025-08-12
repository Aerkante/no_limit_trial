import { createClient } from '@supabase/supabase-js'
import Env from '#start/env'

export const supabase = createClient(Env.get('SUPABASE_PROJECT_URL'), Env.get('SUPABASE_API_KEY'))
